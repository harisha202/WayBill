from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.schemas.base import APIResponse

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.blockchain_service import generate_product_hash, generate_tx_hash
from app.services.database_service import (
    DatabaseConflictError,
    DatabaseError,
    append_pipeline_event,
    create_ledger_record,
    decrement_product_stock,
    get_order,
    get_product_by_sku,
    get_sales_analytics,
    list_orders,
    list_products,
    record_sale,
    update_order_stage,
    reorder_recommendations,
)
from app.services.notification_service import notification_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


class SaleCreateRequest(BaseModel):
    sku: str
    quantity: int = Field(gt=0)
    retailer_name: str = Field(default="Retail Shop", min_length=2, max_length=120)
    payment_method: str = Field(default="cash", min_length=3, max_length=30)
    order_code: Optional[str] = None


@router.get(
    "",
    dependencies=[
        Depends(
            require_roles(
                UserRole.admin,
                UserRole.retail_shop,
                UserRole.dealer,
                UserRole.manufacturer,
                UserRole.transporter,
            )
        )
    ],
    response_model=APIResponse[dict]
)
def get_inventory(skip: int = Query(0, ge=0), limit: int = Query(100, le=1000)) -> APIResponse[dict]:
    product_rows = []
    total_stock = 0
    total_inventory_value = 0.0
    products = list_products(skip=skip, limit=limit)
    for index, item in enumerate(products, start=1):
        quantity = int(item.get("quantity", 0))
        price = float(item.get("price", 0.0))
        reorder_level = max(20, int(quantity * 0.35))
        status = (
            "critical"
            if quantity <= max(8, int(reorder_level * 0.4))
            else "low-stock"
            if quantity <= reorder_level
            else "in-stock"
        )
        total_stock += quantity
        total_inventory_value += quantity * price
        product_rows.append(
            {
                "id": item.get("sku", f"SKU-{index:03d}"),
                "name": item.get("name", f"Product {index}"),
                "category": "PPE" if "KIT" in str(item.get("sku", "")) else "Medical Supplies",
                "stock": quantity,
                "reorderLevel": reorder_level,
                "price": price,
                "verified": True,
                "status": status,
            }
        )

    sales = get_sales_analytics(period="week")
    return APIResponse(success=True, data={"products": product_rows, "sales": sales.get("trend", [])})


@router.get(
    "/sales-analytics",
    dependencies=[
        Depends(
            require_roles(
                UserRole.admin,
                UserRole.retail_shop,
                UserRole.dealer,
                UserRole.manufacturer,
                UserRole.transporter,
            )
        )
    ],
    response_model=APIResponse[dict]
)
def get_sales_analytics_endpoint(time_range: str = Query("week", alias="range")) -> APIResponse[dict]:
    period = "month" if str(time_range).lower() == "month" else "week"
    return APIResponse(success=True, data=get_sales_analytics(period=period))


@router.post(
    "/sales",
    dependencies=[
        Depends(
            require_roles(
                UserRole.admin,
                UserRole.retail_shop,
                UserRole.dealer,
                UserRole.manufacturer,
                UserRole.transporter,
            )
        )
    ],
    response_model=APIResponse[dict]
)
def create_sale(
    data: SaleCreateRequest,
    auth_payload: dict = Depends(
        require_roles(
            UserRole.admin,
            UserRole.retail_shop,
            UserRole.dealer,
            UserRole.manufacturer,
            UserRole.transporter,
        )
    ),
) -> APIResponse[dict]:
    product = get_product_by_sku(data.sku)
    if product is None:
        raise HTTPException(status_code=404, detail="Product SKU not found")

    actor_id = auth_payload.get("sub", "unknown")
    actor_role = auth_payload.get("role", "unknown")
    company_name = auth_payload.get("company_name")
    retailer_name = (company_name or actor_id) if actor_role == "retail_shop" else (data.retailer_name or "Retail Store")

    unit_price = float(product.get("price") or 0.0)
    sale_amount = round(unit_price * int(data.quantity), 2)
    related_order = get_order(data.order_code) if data.order_code else None
    batch_id = str((related_order or {}).get("batch_id") or "NA")

    try:
        updated_product = decrement_product_stock(data.sku, data.quantity)
        sale = record_sale(
            sku=data.sku,
            units_sold=data.quantity,
            sale_amount=sale_amount,
            retailer_name=retailer_name,
        )
        payload = {
            "sku": data.sku,
            "quantity": data.quantity,
            "retailerName": retailer_name,
            "paymentMethod": data.payment_method,
            "orderCode": data.order_code,
            "saleId": sale.get("id"),
            "event": "sold",
        }
        tx_hash = generate_tx_hash(payload)
        ledger_hash = generate_product_hash(
            product_id=str(product.get("id")),
            batch_id=batch_id,
            payload=payload,
        )
        create_ledger_record(
            product_id=str(product.get("id")),
            batch_id=batch_id,
            event_stage="sold",
            payload=payload,
            ledger_hash=ledger_hash,
            tx_hash=tx_hash,
        )
        append_pipeline_event(
            order_code=data.order_code or f"SALE-{sale.get('id')}",
            product_sku=data.sku,
            stage="sold",
            tx_hash=tx_hash,
            payload=payload,
        )
        if related_order:
            related_order_code = str(related_order.get("order_code") or data.order_code or "")
            update_order_stage(
                related_order_code,
                stage="sold",
                status="sold",
            )
            
        # Reorder is advisory here. Creating a replenishment order requires
        # explicit approval through the retail reorder approval endpoint.
        current_quantity = int(updated_product.get("quantity") or 0)
        reorder_point = product.get("reorder_point")
        if reorder_point is not None and current_quantity <= int(reorder_point):
            notification_service.publish(
                user_id="admin",
                title="Reorder recommendation available",
                message=f"Stock for {data.sku} fell to {current_quantity}. Review and approve reorder before purchase.",
                metadata={"sku": data.sku, "currentStock": current_quantity, "reorderPoint": int(reorder_point)}
            )
    except DatabaseConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    notification_service.publish(
        user_id="admin",
        title="Product sold",
        message=f"{data.sku} sold ({data.quantity} units) by {data.retailer_name}.",
        metadata={"sku": data.sku, "txHash": tx_hash, "saleId": sale.get("id")},
    )

    return APIResponse(success=True, data={
        "sale": sale,
        "txHash": tx_hash,
        "updatedStock": int(updated_product.get("quantity") or 0),
        "saleAmount": sale_amount,
    })

@router.get("/alerts", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop))], response_model=APIResponse[dict])
def get_inventory_alerts() -> APIResponse[dict]:
    from app.services.database_service import _engine, products_table
    from sqlalchemy import select
    from app.services.ai_service import check_inventory_alerts
    with _engine().begin() as conn:
        rows = conn.execute(select(products_table)).fetchall()
        items = [dict(row._mapping) for row in rows]
    return APIResponse(success=True, data=check_inventory_alerts(items))

@router.get("/analytics/inventory-reorder")
def get_inventory_vs_reorder(payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop, UserRole.dealer))):
    from app.services.database_service import get_inventory_vs_reorder
    data = get_inventory_vs_reorder()
    return APIResponse(success=True, data=data)


@router.get("/analytics/inventory-health", dependencies=[Depends(require_roles(UserRole.retail_shop))])
def get_inventory_health():
    products = list_products()
    statuses = {"critical": 0, "low_stock": 0, "healthy": 0, "overstocked": 0, "out_of_stock": 0}
    items = []
    for product in products:
        available = int(product.get("available_stock") or 0)
        reorder_point = int(product.get("reorder_point") or 0)
        safety_stock = int(product.get("safety_stock_qty") or 0)
        if available <= 0:
            status = "out_of_stock"
        elif safety_stock and available <= safety_stock:
            status = "critical"
        elif reorder_point and available <= reorder_point:
            status = "low_stock"
        elif reorder_point and available > reorder_point * 3:
            status = "overstocked"
        else:
            status = "healthy"
        statuses[status] += 1
        items.append({
            "sku": product.get("sku"),
            "available": available,
            "reorder_point": reorder_point,
            "safety_stock": safety_stock,
            "status": status,
        })
    return APIResponse(success=True, data={"summary": statuses, "items": items})

@router.get("/analytics/pos-sales-trend", dependencies=[Depends(require_roles(UserRole.retail_shop))])
def get_pos_sales():
    return APIResponse(success=True, data=get_sales_analytics(period="month"))

@router.get("/analytics/demand-forecast", dependencies=[Depends(require_roles(UserRole.retail_shop))])
def get_demand_forecast():
    sales = get_sales_analytics(period="month")
    values = [float(point.get("value") or 0.0) for point in sales.get("trend", [])]
    non_zero = [value for value in values if value > 0]
    if len(non_zero) < 7:
        return APIResponse(success=True, data={
            "status": "INSUFFICIENT_DATA",
            "message": "Insufficient historical sales data for demand forecast.",
            "historical": sales.get("trend", []),
            "forecast": [],
        })
    avg_daily = sum(non_zero[-7:]) / 7
    return APIResponse(success=True, data={
        "status": "ESTIMATED",
        "basis": "7-day trailing average from sales_history",
        "forecast_7d": round(avg_daily * 7, 2),
        "historical": sales.get("trend", []),
    })

@router.get("/analytics/auto-reorder", dependencies=[Depends(require_roles(UserRole.retail_shop))])
def get_auto_reorder():
    items = [
        item for item in reorder_recommendations(days=30)
        if item.get("priority") in ("critical", "high")
    ]
    return APIResponse(success=True, data={"items": items})
