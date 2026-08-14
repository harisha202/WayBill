from __future__ import annotations

import hashlib
import json
import logging
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, cast

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    and_,
    create_engine,
    desc,
    func,
    select,
    text,
    text,
)
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.config import get_settings
from app.core.security import hash_password, is_password_hash


class DatabaseError(RuntimeError):
    """Raised when a database operation fails."""


class DatabaseConflictError(DatabaseError):
    """Raised for database uniqueness/conflict violations."""


metadata = MetaData()
logger = logging.getLogger("global_supply_chain_db")

_ACTIVE_DATABASE_URL: str | None = None
_ENGINE: Engine | None = None



rag_quota_table = Table(
    "rag_quota",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("month", String, nullable=False), # e.g. "2026-08"
    Column("pages_used", Integer, default=0),
    Column("page_limit", Integer, default=200),
    Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow),
)

users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String(120), nullable=False, unique=True),
    Column("name", String(120), nullable=False),
    Column("email", String(160), nullable=False, unique=True),
    Column("password_hash", String(255), nullable=False),
    Column("role", String(40), nullable=False),
    Column("company_name", String(160), nullable=True),
    Column("phone", String(64), nullable=True),
    Column("is_active", Integer, nullable=False, default=1),
    Column("last_login_at", DateTime(timezone=True), nullable=True),
    Column("failed_login_attempts", Integer, nullable=False, default=0),
    Column("locked_until", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

guest_entries_table = Table(
    "guest_entries",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(120), nullable=False),
    Column("email", String(160), nullable=False),
    Column("company", String(160), nullable=False),
    Column("phone", String(64), nullable=False),
    Column("role", String(40), nullable=False),
    Column("source", String(64), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

products_table = Table(
    "products",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("sku", String(80), nullable=False, unique=True),
    Column("name", String(200), nullable=False),
    Column("quantity", Integer, nullable=False, default=0),
    Column("price", Float, nullable=False, default=0.0),
    Column("reorder_point", Integer, nullable=True),
    Column("reorder_policy", String(40), nullable=True),
    Column("safety_stock_qty", Integer, nullable=True),
    Column("lead_time_days", Integer, nullable=True, default=0),
    Column("available_stock", Integer, nullable=False, default=0),
    Column("reserved_stock", Integer, nullable=False, default=0),
    Column("in_transit", Integer, nullable=False, default=0),
    Column("damaged", Integer, nullable=False, default=0),
    Column("backordered", Integer, nullable=False, default=0),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

batches_table = Table(
    "batches",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("batch_id", String(80), nullable=False, unique=True),
    Column("product_sku", String(80), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("ledger_hash", String(128), nullable=False),
    Column("tx_hash", String(128), nullable=False),
    Column("status", String(40), nullable=False),
    Column("order_code", String(80), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

orders_table = Table(
    "orders",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("order_code", String(80), nullable=False, unique=True),
    Column("retailer_name", String(160), nullable=False),
    Column("retailer_email", String(160), nullable=False),
    Column("dealer_id", String(80), nullable=False),
    Column("manufacturer_id", String(80), nullable=True),
    Column("transporter_id", String(80), nullable=True),
    Column("product_sku", String(80), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("status", String(80), nullable=False),
    Column("current_stage", String(80), nullable=False),
    Column("batch_id", String(80), nullable=True),
    Column("shipment_id", String(80), nullable=True),
    Column("origin", String(160), nullable=True),
    Column("destination", String(160), nullable=True),
    Column("dealer_received_at", DateTime(timezone=True), nullable=True),
    Column("retail_received_at", DateTime(timezone=True), nullable=True),
    Column("ordered_quantity", Integer, nullable=False, default=0),
    Column("received_quantity", Integer, nullable=False, default=0),
    Column("discrepancy_quantity", Integer, nullable=False, default=0),
    Column("discrepancy_status", String(80), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

shipments_table = Table(
    "shipments",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("shipment_id", String(80), nullable=False, unique=True),
    Column("order_code", String(80), nullable=True),
    Column("lat", Float, nullable=True),
    Column("lng", Float, nullable=True),
    Column("status", String(80), nullable=False),
    Column("origin", String(160), nullable=True),
    Column("destination", String(160), nullable=True),
    Column("eta", String(80), nullable=True),
    Column("weight", Float, nullable=True),
    Column("vehicle_number", String(80), nullable=True),
    Column("assignment_status", String(80), nullable=True),
    Column("delay_risk_score", Float, nullable=True),
    Column("predicted_delay_minutes", Integer, nullable=True),
    Column("planned_eta", String(80), nullable=True),
    Column("route_deviation", String(160), nullable=True),
    Column("last_gps_at", DateTime(timezone=True), nullable=True),
    Column("risk_updated_at", DateTime(timezone=True), nullable=True),
    Column("timestamp", DateTime(timezone=True), nullable=False),
)

shipment_events_table = Table(
    "shipment_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("order_code", String(80), nullable=False),
    Column("product_sku", String(80), nullable=False),
    Column("shipment_id", String(80), nullable=True),
    Column("event_stage", String(80), nullable=False),
    Column("event_status", String(80), nullable=False),
    Column("lat", Float, nullable=True),
    Column("lng", Float, nullable=True),
    Column("distance_km", Float, nullable=True),
    Column("eta_hours", Float, nullable=True),
    Column("tx_hash", String(128), nullable=False),
    Column("payload", JSON, nullable=False, default={}),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

ledger_records_table = Table(
    "ledger_records",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("record_key", String(180), nullable=False, unique=True),
    Column("product_id", String(80), nullable=False),
    Column("batch_id", String(80), nullable=False),
    Column("event_stage", String(80), nullable=False),
    Column("payload", JSON, nullable=False, default={}),
    Column("ledger_hash", String(128), nullable=False),
    Column("tx_hash", String(128), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

sales_history_table = Table(
    "sales_history",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("sku", String(80), nullable=False),
    Column("units_sold", Integer, nullable=False),
    Column("sale_amount", Float, nullable=False),
    Column("retailer_name", String(160), nullable=False),
    Column("sold_at", DateTime(timezone=True), nullable=False),
)

notifications_table = Table(
    "notifications",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", String(120), nullable=False),
    Column("title", String(160), nullable=False),
    Column("message", Text, nullable=False),
    Column("severity", String(24), nullable=False),
    Column("metadata", JSON, nullable=False, default={}),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

suppliers_table = Table(
    "suppliers",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("supplier_id", String(80), nullable=False, unique=True),
    Column("name", String(160), nullable=False),
    Column("tier", Integer, nullable=False),
    Column("parent_supplier_id", String(80), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

supplier_risk_scores_table = Table(
    "supplier_risk_scores",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("supplier_id", String(80), nullable=False),
    Column("overall_score", Float, nullable=False),
    Column("financial_score", Float, nullable=False),
    Column("geopolitical_score", Float, nullable=False),
    Column("operational_score", Float, nullable=False),
    Column("delivery_score", Float, nullable=False),
    Column("esg_score", Float, nullable=False),
    Column("assessed_at", DateTime(timezone=True), nullable=False),
)

activity_logs_table = Table(
    "activity_logs",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", String(120), nullable=False),
    Column("role", String(40), nullable=False),
    Column("action", String(120), nullable=False),
    Column("entity_type", String(80), nullable=True),
    Column("entity_id", String(80), nullable=True),
    Column("details", JSON, nullable=False, default={}),
    Column("timestamp", DateTime(timezone=True), nullable=False),
)


waybill_documents_table = Table(
    "waybill_documents",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("waybill_id", String(80), nullable=False, unique=True),
    Column("batch_id", String(80), nullable=False),
    Column("sku", String(80), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("order_id", String(80), nullable=True),
    Column("current_custodian", String(80), nullable=False),
    Column("status", String(80), nullable=False),
    Column("qr_code", String(255), nullable=True),
    Column("seal_hash", String(64), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

financial_ledger_table = Table(
    "financial_ledger",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("entity_type", String(80), nullable=False),
    Column("entity_id", String(80), nullable=False),
    Column("transaction_type", String(80), nullable=False),
    Column("amount", Float, nullable=False),
    Column("currency", String(10), nullable=False, default="USD"),
    Column("exchange_rate", Float, nullable=False, default=1.0),
    Column("base_amount_inr", Float, nullable=False),
    Column("seal_hash", String(64), nullable=True),
    Column("ledger_hash", String(64), nullable=False),
    Column("previous_ledger_hash", String(64), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

custody_events_table = Table(
    "custody_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("waybill_id", String(80), nullable=False),
    Column("event_type", String(80), nullable=False),
    Column("from_custodian", String(80), nullable=True),
    Column("to_custodian", String(80), nullable=False),
    Column("actor_id", String(80), nullable=False),
    Column("actor_role", String(40), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("location", String(160), nullable=True),
    Column("metadata", JSON, nullable=False, default={}),
    Column("event_hash", String(128), nullable=False),
    Column("previous_event_hash", String(128), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

gps_events_table = Table(
    "gps_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("shipment_id", String(80), nullable=False),
    Column("vehicle_id", String(80), nullable=True),
    Column("latitude", Float, nullable=False),
    Column("longitude", Float, nullable=False),
    Column("speed", Float, nullable=True),
    Column("heading", Float, nullable=True),
    Column("accuracy", Float, nullable=True),
    Column("timestamp", DateTime(timezone=True), nullable=False),
)

cost_ledger_table = Table(
    "cost_ledger",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("shipment_id", String(80), nullable=True),
    Column("order_id", String(80), nullable=True),
    Column("transport_cost", Float, nullable=False, default=0.0),
    Column("storage_cost", Float, nullable=False, default=0.0),
    Column("delay_penalty", Float, nullable=False, default=0.0),
    Column("handling_cost", Float, nullable=False, default=0.0),
    Column("other_cost", Float, nullable=False, default=0.0),
    Column("total_cost", Float, nullable=False, default=0.0),
    Column("currency", String(10), nullable=False, default="USD"),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

backorders_table = Table(
    "backorders",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("order_id", String(80), nullable=False),
    Column("sku", String(80), nullable=False),
    Column("missing_quantity", Integer, nullable=False),
    Column("reason", String(160), nullable=True),
    Column("status", String(40), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("fulfilled_at", DateTime(timezone=True), nullable=True),
)

trucks_table = Table(
    "trucks",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("plate_number", String(80), nullable=False, unique=True),
    Column("model", String(80), nullable=True),
    Column("capacity", Float, nullable=True),
    Column("gps_device_id", String(80), nullable=True),
    Column("maintenance_status", String(40), nullable=True),
    Column("assigned_route", String(160), nullable=True),
    Column("current_load_percent", Float, nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

drivers_table = Table(
    "drivers",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(120), nullable=False),
    Column("license_id", String(80), nullable=False, unique=True),
    Column("contract_type", String(40), nullable=True),
    Column("performance_score", Float, nullable=True),
    Column("on_time_percent", Float, nullable=True),
    Column("incident_count", Integer, nullable=False, default=0),
    Column("avatar_seed", String(80), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

maintenance_records_table = Table(
    "maintenance_records",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("truck_id", String(80), nullable=False),
    Column("maintenance_type", String(80), nullable=False),
    Column("description", String(255), nullable=True),
    Column("status", String(40), nullable=False),
    Column("scheduled_date", DateTime(timezone=True), nullable=True),
    Column("completed_date", DateTime(timezone=True), nullable=True),
)

anomalies_table = Table(
    "anomalies",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("entity_type", String(80), nullable=False),
    Column("entity_id", String(80), nullable=False),
    Column("type", String(80), nullable=False),
    Column("severity", String(40), nullable=False),
    Column("explanation", String(255), nullable=True),
    Column("status", String(40), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("resolved_at", DateTime(timezone=True), nullable=True),
)

reorder_events_table = Table(
    "reorder_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("sku", String(80), nullable=False),
    Column("recommended_quantity", Integer, nullable=False),
    Column("justification", String(255), nullable=True),
    Column("status", String(40), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

qr_verification_events_table = Table(
    "qr_verification_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("waybill_id", String(80), nullable=False),
    Column("result", String(40), nullable=False),
    Column("scanner_user_id", String(80), nullable=True),
    Column("reason", String(255), nullable=True),
    Column("timestamp", DateTime(timezone=True), nullable=False),
)

audit_logs_table = Table(
    "audit_logs",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user", String(120), nullable=False),
    Column("role", String(40), nullable=False),
    Column("action", String(120), nullable=False),
    Column("entity", String(80), nullable=False),
    Column("entity_id", String(80), nullable=False),
    Column("old_value", JSON, nullable=True),
    Column("new_value", JSON, nullable=True),
    Column("metadata", JSON, nullable=False, default={}),
    Column("timestamp", DateTime(timezone=True), nullable=False),
)

processed_keys_table = Table(
    "processed_keys",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("idempotency_key", String(128), nullable=False, unique=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

invoices_table = Table(
    "invoices",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("invoice_number", String(80), nullable=False, unique=True),
    Column("order_id", String(80), nullable=False),
    Column("amount", Float, nullable=False),
    Column("status", String(40), nullable=False),
    Column("issued_at", DateTime(timezone=True), nullable=False),
    Column("due_date", DateTime(timezone=True), nullable=True),
)

settlements_table = Table(
    "settlements",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("settlement_id", String(80), nullable=False, unique=True),
    Column("invoice_number", String(80), nullable=False),
    Column("amount", Float, nullable=False),
    Column("status", String(40), nullable=False),
    Column("settled_at", DateTime(timezone=True), nullable=False),
)

disputes_table = Table(
    "disputes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("dispute_id", String(80), nullable=False, unique=True),
    Column("waybill_id", String(80), nullable=True),
    Column("order_id", String(80), nullable=True),
    Column("mismatch_type", String(80), nullable=False),
    Column("description", String(255), nullable=True),
    Column("status", String(40), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("resolved_at", DateTime(timezone=True), nullable=True),
)

documents_table = Table(
    "documents",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("document_id", String(80), nullable=False, unique=True),
    Column("entity_type", String(80), nullable=False),
    Column("entity_id", String(80), nullable=False),
    Column("document_type", String(80), nullable=False),
    Column("file_url", String(255), nullable=False),
    Column("uploaded_at", DateTime(timezone=True), nullable=False),
)

warehouses_table = Table(
    "warehouses",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("warehouse_id", String(80), nullable=False, unique=True),
    Column("name", String(160), nullable=False),
    Column("location", String(255), nullable=False),
    Column("bin", String(80), nullable=True),
    Column("rack", String(80), nullable=True),
    Column("capacity", Float, nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

stock_movements_table = Table(
    "stock_movements",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("movement_id", String(80), nullable=False, unique=True),
    Column("sku", String(80), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("movement_type", String(40), nullable=False),
    Column("previous_quantity", Integer, nullable=False),
    Column("new_quantity", Integer, nullable=False),
    Column("reference_type", String(80), nullable=True),
    Column("reference_id", String(80), nullable=True),
    Column("user_id", String(80), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

discrepancies_table = Table(
    "discrepancies",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("discrepancy_id", String(80), nullable=False, unique=True),
    Column("order_id", String(80), nullable=False),
    Column("waybill_id", String(80), nullable=True),
    Column("sku", String(80), nullable=False),
    Column("ordered_quantity", Integer, nullable=False),
    Column("received_quantity", Integer, nullable=False),
    Column("missing_quantity", Integer, nullable=False),
    Column("reason", String(255), nullable=True),
    Column("status", String(40), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

production_orders_table = Table(
    "production_orders",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("order_id", String(80), nullable=False, unique=True),
    Column("batch_id", String(80), nullable=False),
    Column("sku", String(80), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("status", String(40), nullable=False),
    Column("qa_status", String(40), nullable=False, default="PENDING"),
    Column("start_date", DateTime(timezone=True), nullable=True),
    Column("end_date", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

quality_inspections_table = Table(
    "quality_inspections",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("inspection_id", String(80), nullable=False, unique=True),
    Column("production_order_id", String(80), nullable=False),
    Column("inspector_id", String(80), nullable=False),
    Column("quantity_inspected", Integer, nullable=False),
    Column("quantity_passed", Integer, nullable=False),
    Column("quantity_failed", Integer, nullable=False),
    Column("defect_type", String(255), nullable=True),
    Column("notes", String(1024), nullable=True),
    Column("status", String(40), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

issues_table = Table(
    "issues",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("issue_id", String(80), nullable=False, unique=True),
    Column("entity_type", String(40), nullable=False),
    Column("entity_id", String(80), nullable=True),
    Column("issue_type", String(80), nullable=False),
    Column("severity", String(40), nullable=False),
    Column("description", String(1024), nullable=False),
    Column("status", String(40), nullable=False),
    Column("reporter_id", String(80), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

interventions_table = Table(
    "interventions",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("intervention_id", String(80), nullable=False, unique=True),
    Column("shipment_id", String(80), nullable=False),
    Column("action_type", String(80), nullable=False),
    Column("reason", String(255), nullable=False),
    Column("severity", String(40), nullable=False),
    Column("status", String(40), nullable=False),
    Column("actor_id", String(80), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _db_path() -> Path:
    settings = get_settings()
    configured = Path(settings.sqlite_db_path).expanduser()
    if configured.is_absolute():
        return configured
    backend_root = Path(__file__).resolve().parents[2]
    return (backend_root / configured).resolve()


def _normalize_database_url(*, prefer_sqlite: bool = False) -> str:
    settings = get_settings()
    raw = str(settings.database_url or "").strip()
    if not prefer_sqlite and raw:
        if raw.startswith("postgres://"):
            raw = raw.replace("postgres://", "postgresql+psycopg://", 1)
        elif raw.startswith("postgresql://") and "+" not in raw.split("://", 1)[0]:
            raw = raw.replace("postgresql://", "postgresql+psycopg://", 1)
        elif raw.startswith("postgresql://") or raw.startswith("postgresql+"):
            raw = raw
        else:
            return raw

        try:
            parsed = make_url(raw)
            host = getattr(parsed, "host", None)
            is_postgres = parsed.get_backend_name() == "postgresql"
            if is_postgres and host and str(host).endswith("render.com") and "sslmode" not in parsed.query:
                parsed = parsed.update_query_dict({"sslmode": "require"})
                return parsed.render_as_string(hide_password=False)
        except Exception:
            pass

        return raw

    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path.as_posix()}"


def _current_database_url() -> str:
    return _ACTIVE_DATABASE_URL or _normalize_database_url()


def _display_database_target(db_url: str) -> str:
    if not db_url:
        return ""

    if db_url.startswith("sqlite"):
        return str(_db_path())

    try:
        return make_url(db_url).render_as_string(hide_password=True)
    except Exception:
        # Best-effort fallback: never leak credentials in logs/health responses.
        if "@" in db_url and "://" in db_url:
            scheme, rest = db_url.split("://", 1)
            if "@" in rest:
                _, host_and_path = rest.split("@", 1)
                return f"{scheme}://***@{host_and_path}"
        return "<redacted>"


def _engine() -> Engine:
    global _ACTIVE_DATABASE_URL
    global _ENGINE

    if _ENGINE is not None:
        return _ENGINE

    primary_url = _normalize_database_url()
    primary_display = _display_database_target(primary_url)
    try:
        primary_parsed = make_url(primary_url)
        hostname = getattr(primary_parsed, "host", None)
        if hostname and hostname.startswith("dpg-") and "." not in hostname:
            logger.warning(
                "DATABASE_URL host %s looks like a Render internal hostname; "
                "it will only resolve from Render services on the same private network. "
                "For local development, use the Render External Database URL instead.",
                hostname,
            )
    except Exception:
        pass
    try:
        primary_engine = create_engine(
            primary_url,
            future=True,
            pool_pre_ping=True,
        )
        with primary_engine.connect():
            pass
        _ACTIVE_DATABASE_URL = primary_url
        _ENGINE = primary_engine
        return _ENGINE
    except Exception as primary_exc:
        logger.warning("Primary database %s failed, falling back to SQLite: %s", primary_display, primary_exc)
        fallback_url = _normalize_database_url(prefer_sqlite=True)
        try:
            fallback_engine = create_engine(
                fallback_url,
                future=True,
                pool_pre_ping=True,
            )
            with fallback_engine.connect():
                pass
            _ACTIVE_DATABASE_URL = fallback_url
            _ENGINE = fallback_engine
            return _ENGINE
        except Exception as fallback_exc:
            raise DatabaseError("Unable to initialize database engine") from fallback_exc


def reset_engine_for_tests() -> None:
    global _ACTIVE_DATABASE_URL
    global _ENGINE

    if _ENGINE is not None:
        try:
            _ENGINE.dispose()
        except Exception:
            pass

    _ENGINE = None
    _ACTIVE_DATABASE_URL = None


def _row_to_dict(row: Any) -> dict:
    if row is None:
        return {}
    data = dict(row._mapping)
    for key in ("payload", "metadata"):
        value = data.get(key)
        if isinstance(value, str):
            try:
                data[key] = json.loads(value)
            except json.JSONDecodeError:
                data[key] = {}
    return data


def _inserted_id(result: Any, *, message: str) -> int:
    primary_key = getattr(result, "inserted_primary_key", None)
    if not primary_key:
        raise DatabaseError(message)
    value = primary_key[0]
    if value is None:
        raise DatabaseError(message)
    return int(value)


def _stage_title(stage: str) -> str:
    return str(stage or "").replace("_", " ").title()


def _next_order_code(conn) -> str:
    max_id = conn.execute(select(func.max(orders_table.c.id))).scalar() or 0
    return f"ORD-{int(max_id) + 1:05d}"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return round(radius * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))), 2)


def _format_indian_grouping(number_text: str) -> str:
    if len(number_text) <= 3:
        return number_text
    head = number_text[:-3]
    tail = number_text[-3:]
    groups: list[str] = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return ",".join([*groups, tail])


def format_inr(amount: float, decimals: int = 2) -> str:
    rounded = float(amount or 0.0)
    precision = max(0, int(decimals))
    absolute = abs(rounded)
    rendered = f"{absolute:.{precision}f}" if precision else f"{absolute:.0f}"
    integer_part, dot, fraction_part = rendered.partition(".")
    grouped_integer = _format_indian_grouping(integer_part)
    sign = "-" if rounded < 0 else ""
    if dot:
        return f"{sign}INR {grouped_integer}.{fraction_part}"
    return f"{sign}INR {grouped_integer}"


def _seed_defaults() -> None:
    now = _utc_now()
    with _engine().begin() as conn:
        user_count = conn.execute(select(func.count()).select_from(users_table)).scalar() or 0
        if user_count == 0:
            conn.execute(
                users_table.insert(),
                [
                    {
                        "username": "admin",
                        "name": "WayBill Admin",
                        "email": "admin@waybill.com",
                        "password_hash": hash_password("admin123"),
                        "role": "admin",
                        "company_name": "WayBill HQ",
                        "phone": "555-0000",
                        "created_at": now,
                    },
                    {
                        "username": "maker",
                        "name": "WayBill Manufacturer",
                        "email": "manufacturer@waybill.com",
                        "password_hash": hash_password("maker123"),
                        "role": "manufacturer",
                        "company_name": "Maker Corp",
                        "phone": "555-1111",
                        "created_at": now,
                    },
                    {
                        "username": "transporter",
                        "name": "WayBill Transporter",
                        "email": "transporter@waybill.com",
                        "password_hash": hash_password("transit123"),
                        "role": "transporter",
                        "company_name": "Transit Inc",
                        "phone": "555-2222",
                        "created_at": now,
                    },
                    {
                        "username": "dealer",
                        "name": "WayBill Dealer",
                        "email": "dealer@waybill.com",
                        "password_hash": hash_password("dealer123"),
                        "role": "dealer",
                        "company_name": "Dealer LLC",
                        "phone": "555-3333",
                        "created_at": now,
                    },
                    {
                        "username": "retail",
                        "name": "WayBill Retail",
                        "email": "retail@waybill.com",
                        "password_hash": hash_password("retail123"),
                        "role": "retail_shop",
                        "company_name": "Retail Store",
                        "phone": "555-4444",
                        "created_at": now,
                    },
                ],
            )
        else:
            # Migrate legacy plaintext passwords that may exist in older demo databases.
            rows = conn.execute(select(users_table.c.id, users_table.c.password_hash)).fetchall()
            for row in rows:
                user_id = int(row._mapping["id"])
                stored = str(row._mapping.get("password_hash") or "")
                if stored and not is_password_hash(stored):
                    conn.execute(
                        users_table.update()
                        .where(users_table.c.id == user_id)
                        .values(password_hash=hash_password(stored))
                    )


def initialize_database() -> None:
    try:
        metadata.create_all(_engine())
        _seed_defaults()
    except SQLAlchemyError as exc:
        raise DatabaseError("Database initialization failed") from exc


def check_database_connection() -> dict:
    try:
        with _engine().connect() as conn:
            conn.execute(select(1)).scalar()
            db_url = _current_database_url()
            return {"ok": True, "path": _display_database_target(db_url)}
    except SQLAlchemyError as exc:
        raise DatabaseError("Database connectivity check failed") from exc


def get_user_by_email(email: str) -> dict | None:
    try:
        with _engine().connect() as conn:
            row = conn.execute(
                select(users_table).where(users_table.c.email == str(email).strip().lower())
            ).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to query user by email") from exc


def create_user(
    username: str,
    name: str,
    email: str,
    password_hash: str,
    role: str,
    company_name: str | None = None,
    phone: str | None = None,
    is_active: int = 1,
) -> dict:
    created_at = _utc_now()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                users_table.insert().values(
                    username=username,
                    name=name,
                    email=str(email).strip().lower(),
                    password_hash=password_hash,
                    role=role,
                    company_name=company_name,
                    phone=phone,
                    is_active=is_active,
                    failed_login_attempts=0,
                    locked_until=None,
                    created_at=created_at,
                )
            )
            user_id = _inserted_id(result, message="Failed to determine created user id")
    except IntegrityError as exc:
        raise DatabaseConflictError("User username or email already exists") from exc
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to create user") from exc

    return {
        "id": user_id,
        "username": username,
        "name": name,
        "email": str(email).strip().lower(),
        "password_hash": password_hash,
        "role": role,
        "company_name": company_name,
        "phone": phone,
        "is_active": is_active,
        "created_at": created_at,
    }


def set_user_role(*, email: str, role: str) -> dict | None:
    normalized_email = str(email).strip().lower()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                users_table.update()
                .where(users_table.c.email == normalized_email)
                .values(role=role)
            )
            if not result.rowcount:
                return None

            row = conn.execute(
                select(users_table).where(users_table.c.email == normalized_email)
            ).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update user role") from exc


def is_account_locked(user_id: int) -> bool:
    try:
        with _engine().connect() as conn:
            row = conn.execute(select(users_table).where(users_table.c.id == user_id)).first()
            if not row:
                return False
            locked_until = row._mapping.get("locked_until")
            if not locked_until:
                return False
            now = _utc_now()
            # If locked_until is naive, make it aware (assuming UTC)
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            return now < locked_until
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to check if account is locked") from exc


def record_failed_login(user_id: int, max_attempts: int = 5, lockout_minutes: int = 15) -> None:
    try:
        with _engine().begin() as conn:
            row = conn.execute(select(users_table).where(users_table.c.id == user_id)).first()
            if not row:
                return
            attempts = (row._mapping.get("failed_login_attempts") or 0) + 1
            locked_until = None
            if attempts >= max_attempts:
                locked_until = _utc_now() + timedelta(minutes=lockout_minutes)
            conn.execute(
                users_table.update()
                .where(users_table.c.id == user_id)
                .values(failed_login_attempts=attempts, locked_until=locked_until)
            )
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to record failed login") from exc


def reset_failed_logins(user_id: int) -> None:
    try:
        with _engine().begin() as conn:
            conn.execute(
                users_table.update()
                .where(users_table.c.id == user_id)
                .values(failed_login_attempts=0, locked_until=None)
            )
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to reset failed logins") from exc


def create_guest_entry(
    *,
    name: str,
    email: str,
    company: str,
    phone: str,
    role: str,
    source: str = "guest_form",
) -> dict:
    created_at = _utc_now()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                guest_entries_table.insert().values(
                    name=name,
                    email=str(email).strip().lower(),
                    company=company,
                    phone=phone,
                    role=role,
                    source=source,
                    created_at=created_at,
                )
            )
            entry_id = _inserted_id(result, message="Failed to determine created guest entry id")
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to store guest entry") from exc

    return {
        "id": entry_id,
        "name": name,
        "email": str(email).strip().lower(),
        "company": company,
        "phone": phone,
        "role": role,
        "source": source,
        "created_at": created_at,
    }


def count_users() -> int:
    try:
        with _engine().connect() as conn:
            return int(conn.execute(select(func.count()).select_from(users_table)).scalar() or 0)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to count users") from exc


def count_guest_entries() -> int:
    try:
        with _engine().connect() as conn:
            return int(conn.execute(select(func.count()).select_from(guest_entries_table)).scalar() or 0)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to count guest entries") from exc


def list_users(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(users_table)
                .order_by(users_table.c.id.asc())
                .offset(skip)
                .limit(limit)
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list users") from exc


def get_user_by_id(user_id: int) -> dict | None:
    try:
        with _engine().connect() as conn:
            row = conn.execute(
                select(users_table).where(users_table.c.id == user_id)
            ).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get user by id") from exc


def update_user(user_id: int, full_name: str, company_name: str | None, phone: str | None, role: str) -> dict:
    try:
        with _engine().begin() as conn:
            # Check if user exists
            row = conn.execute(select(users_table).where(users_table.c.id == user_id)).first()
            if not row:
                raise DatabaseError("User not found")
            
            conn.execute(
                users_table.update()
                .where(users_table.c.id == user_id)
                .values(
                    name=full_name,
                    company_name=company_name,
                    phone=phone,
                    role=role
                )
            )
            return get_user_by_id(user_id)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update user") from exc


def set_user_status(user_id: int, is_active: int) -> dict:
    try:
        with _engine().begin() as conn:
            row = conn.execute(select(users_table).where(users_table.c.id == user_id)).first()
            if not row:
                raise DatabaseError("User not found")
                
            conn.execute(
                users_table.update()
                .where(users_table.c.id == user_id)
                .values(is_active=is_active)
            )
            return get_user_by_id(user_id)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update user status") from exc

def delete_user(user_id: int) -> bool:
    try:
        with _engine().begin() as conn:
            result = conn.execute(users_table.delete().where(users_table.c.id == user_id))
            return result.rowcount > 0
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to delete user") from exc


def reset_user_password(user_id: int, new_password_hash: str) -> dict:
    try:
        with _engine().begin() as conn:
            row = conn.execute(select(users_table).where(users_table.c.id == user_id)).first()
            if not row:
                raise DatabaseError("User not found")
                
            conn.execute(
                users_table.update()
                .where(users_table.c.id == user_id)
                .values(
                    password_hash=new_password_hash,
                    failed_login_attempts=0,
                    locked_until=None
                )
            )
            return get_user_by_id(user_id)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to reset user password") from exc


def list_products(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(products_table)
                .order_by(products_table.c.id.asc())
                .offset(skip)
                .limit(limit)
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list products") from exc


def get_product_by_sku(sku: str) -> dict | None:
    try:
        with _engine().connect() as conn:
            row = conn.execute(select(products_table).where(products_table.c.sku == sku)).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to fetch product") from exc


def create_product(*, sku: str, name: str, quantity: int, price: float) -> dict:
    created_at = _utc_now()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                products_table.insert().values(
                    sku=sku.strip().upper(),
                    name=name.strip(),
                    quantity=int(quantity),
                    price=float(price),
                    created_at=created_at,
                )
            )
            product_id = _inserted_id(result, message="Failed to determine created product id")
    except IntegrityError as exc:
        raise DatabaseConflictError("SKU already exists") from exc
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to create product") from exc

    return {
        "id": product_id,
        "sku": sku.strip().upper(),
        "name": name.strip(),
        "quantity": int(quantity),
        "price": float(price),
        "created_at": created_at,
    }


def increment_product_stock(sku: str, quantity: int) -> dict:
    try:
        with _engine().begin() as conn:
            conn.execute(
                products_table.update()
                .where(products_table.c.sku == sku)
                .values(quantity=products_table.c.quantity + int(quantity))
            )
            row = conn.execute(select(products_table).where(products_table.c.sku == sku)).first()
            if row is None:
                raise DatabaseError("Product SKU not found")
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update product stock") from exc


def decrement_product_stock(sku: str, quantity: int) -> dict:
    requested = int(quantity)
    if requested <= 0:
        raise DatabaseConflictError("Quantity must be greater than 0")
    try:
        with _engine().begin() as conn:
            row = conn.execute(select(products_table).where(products_table.c.sku == sku)).first()
            if row is None:
                raise DatabaseError("Product SKU not found")
            product = _row_to_dict(row)
            current_qty = int(product.get("quantity") or 0)
            if current_qty < requested:
                raise DatabaseConflictError("Insufficient stock")
            conn.execute(
                products_table.update()
                .where(products_table.c.sku == sku)
                .values(quantity=current_qty - requested)
            )
            updated = conn.execute(select(products_table).where(products_table.c.sku == sku)).first()
            return _row_to_dict(updated)
    except DatabaseConflictError:
        raise
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update product stock") from exc


def list_batches(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(batches_table)
                .order_by(desc(batches_table.c.id))
                .offset(skip)
                .limit(limit)
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list batches") from exc


def create_batch(
    *,
    batch_id: str,
    product_sku: str,
    quantity: int,
    ledger_hash: str,
    tx_hash: str,
    status: str = "created",
    order_code: str | None = None,
) -> dict:
    created_at = _utc_now()
    try:
        with _engine().begin() as conn:
            conn.execute(
                batches_table.insert().values(
                    batch_id=batch_id,
                    product_sku=product_sku,
                    quantity=int(quantity),
                    ledger_hash=ledger_hash,
                    tx_hash=tx_hash,
                    status=status,
                    order_code=order_code,
                    created_at=created_at,
                )
            )
            conn.execute(
                products_table.update()
                .where(products_table.c.sku == product_sku)
                .values(quantity=products_table.c.quantity + int(quantity))
            )
            row = conn.execute(select(batches_table).where(batches_table.c.batch_id == batch_id)).first()
            return _row_to_dict(row)
    except IntegrityError as exc:
        raise DatabaseConflictError("Batch ID already exists") from exc
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to create batch") from exc


def get_batch(batch_id: str) -> dict | None:
    try:
        with _engine().connect() as conn:
            row = conn.execute(select(batches_table).where(batches_table.c.batch_id == batch_id)).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to fetch batch") from exc


def create_order(
    *,
    retailer_name: str,
    retailer_email: str,
    dealer_id: str,
    product_sku: str,
    quantity: int,
    origin: str | None = None,
    destination: str | None = None,
) -> dict:
    now = _utc_now()
    try:
        with _engine().begin() as conn:
            # Check available stock
            row = conn.execute(select(products_table).where(products_table.c.sku == product_sku).with_for_update()).first()
            if row is None:
                raise DatabaseError("Product SKU not found")
            
            product = _row_to_dict(row)
            available_stock = int(product.get("available_stock") or 0)
            reserved_stock = int(product.get("reserved_stock") or 0)
            
            if int(quantity) > available_stock:
                raise DatabaseConflictError(f"Insufficient available stock. Requested: {quantity}, Available: {available_stock}")
            
            # Update product stock
            conn.execute(
                products_table.update()
                .where(products_table.c.sku == product_sku)
                .values(
                    available_stock=available_stock - int(quantity),
                    reserved_stock=reserved_stock + int(quantity)
                )
            )

            order_code = _next_order_code(conn)
            conn.execute(
                orders_table.insert().values(
                    order_code=order_code,
                    retailer_name=retailer_name,
                    retailer_email=retailer_email,
                    dealer_id=dealer_id,
                    product_sku=product_sku,
                    quantity=int(quantity),
                    status="retail_ordered",
                    current_stage="retail_ordered",
                    origin=origin,
                    destination=destination,
                    ordered_quantity=int(quantity),
                    created_at=now,
                    updated_at=now,
                )
            )
            row = conn.execute(select(orders_table).where(orders_table.c.order_code == order_code)).first()
            return _row_to_dict(row)
    except DatabaseConflictError:
        raise
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to create order") from exc


def receive_order_with_discrepancy(
    order_code: str,
    received_quantity: int
) -> dict:
    now = _utc_now()
    try:
        with _engine().begin() as conn:
            row = conn.execute(select(orders_table).where(orders_table.c.order_code == order_code)).first()
            if row is None:
                raise DatabaseError("Order not found")
                
            order = _row_to_dict(row)
            ordered_quantity = int(order.get("ordered_quantity") or order.get("quantity") or 0)
            sku = order.get("product_sku")
            
            discrepancy_quantity = ordered_quantity - received_quantity
            discrepancy_status = None
            if discrepancy_quantity > 0:
                discrepancy_status = "shortage"
            elif discrepancy_quantity < 0:
                discrepancy_status = "overage"
                discrepancy_quantity = abs(discrepancy_quantity)
                
            # Update order
            conn.execute(
                orders_table.update()
                .where(orders_table.c.order_code == order_code)
                .values(
                    received_quantity=received_quantity,
                    discrepancy_quantity=discrepancy_quantity,
                    discrepancy_status=discrepancy_status,
                    current_stage="dealer_received",
                    status="dealer_received",
                    dealer_received_at=now,
                    updated_at=now,
                )
            )
            
            if discrepancy_status == "shortage" and discrepancy_quantity > 0:
                conn.execute(
                    backorders_table.insert().values(
                        order_id=order_code,
                        sku=sku,
                        missing_quantity=discrepancy_quantity,
                        reason="Delivery shortage during receipt",
                        status="pending",
                        created_at=now
                    )
                )
                
            updated = conn.execute(select(orders_table).where(orders_table.c.order_code == order_code)).first()
            return _row_to_dict(updated)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to process order receipt") from exc


def update_order_stage(
    order_code: str,
    *,
    stage: str,
    status: str | None = None,
    manufacturer_id: str | None = None,
    transporter_id: str | None = None,
    batch_id: str | None = None,
    shipment_id: str | None = None,
    dealer_received: bool = False,
    retail_received: bool = False,
) -> dict | None:
    values: dict[str, Any] = {
        "current_stage": stage,
        "status": status or stage,
        "updated_at": _utc_now(),
    }
    if manufacturer_id is not None:
        values["manufacturer_id"] = manufacturer_id
    if transporter_id is not None:
        values["transporter_id"] = transporter_id
    if batch_id is not None:
        values["batch_id"] = batch_id
    if shipment_id is not None:
        values["shipment_id"] = shipment_id
    if dealer_received:
        values["dealer_received_at"] = _utc_now()
    if retail_received:
        values["retail_received_at"] = _utc_now()

    try:
        with _engine().begin() as conn:
            conn.execute(
                orders_table.update().where(orders_table.c.order_code == order_code).values(**values)
            )
            row = conn.execute(select(orders_table).where(orders_table.c.order_code == order_code)).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update order stage") from exc


def get_order(order_code: str) -> dict | None:
    try:
        with _engine().connect() as conn:
            row = conn.execute(select(orders_table).where(orders_table.c.order_code == order_code)).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to fetch order") from exc


def list_orders(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(orders_table)
                .order_by(desc(orders_table.c.updated_at))
                .offset(skip)
                .limit(int(limit))
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list orders") from exc


def create_or_update_shipment(
    *,
    shipment_id: str,
    order_code: str | None,
    lat: float | None,
    lng: float | None,
    status: str,
    origin: str | None = None,
    destination: str | None = None,
    eta: str | None = None,
    weight: float | None = None,
    vehicle_number: str | None = None,
    assignment_status: str | None = None,
) -> dict:
    now = _utc_now()
    try:
        with _engine().begin() as conn:
            exists = conn.execute(
                select(shipments_table.c.id).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            payload = {
                "order_code": order_code,
                "lat": lat,
                "lng": lng,
                "status": status,
                "origin": origin,
                "destination": destination,
                "eta": eta,
                "weight": weight,
                "vehicle_number": vehicle_number,
                "assignment_status": assignment_status or "Assigned",
                "timestamp": now,
            }
            if exists:
                conn.execute(
                    shipments_table.update()
                    .where(shipments_table.c.shipment_id == shipment_id)
                    .values(**payload)
                )
            else:
                conn.execute(shipments_table.insert().values(shipment_id=shipment_id, **payload))
            row = conn.execute(
                select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to upsert shipment") from exc


def update_shipment_location(*, shipment_id: str, lat: float, lng: float, status: str) -> dict | None:
    try:
        with _engine().begin() as conn:
            conn.execute(
                shipments_table.update()
                .where(shipments_table.c.shipment_id == shipment_id)
                .values(lat=lat, lng=lng, status=status, timestamp=_utc_now())
            )
            row = conn.execute(
                select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to update shipment location") from exc


def record_gps_ping(*, shipment_id: str, vehicle_id: str | None, lat: float, lng: float, speed: float | None, heading: float | None, accuracy: float | None, delay_risk_score: float | None, predicted_delay_minutes: int | None) -> dict | None:
    try:
        now = _utc_now()
        with _engine().begin() as conn:
            conn.execute(
                gps_events_table.insert().values(
                    shipment_id=shipment_id,
                    vehicle_id=vehicle_id,
                    latitude=lat,
                    longitude=lng,
                    speed=speed,
                    heading=heading,
                    accuracy=accuracy,
                    timestamp=now
                )
            )
            
            update_values = {
                "lat": lat,
                "lng": lng,
                "last_gps_at": now,
                "timestamp": now
            }
            if delay_risk_score is not None:
                update_values["delay_risk_score"] = delay_risk_score
                update_values["predicted_delay_minutes"] = predicted_delay_minutes
                update_values["risk_updated_at"] = now
                
            conn.execute(
                shipments_table.update()
                .where(shipments_table.c.shipment_id == shipment_id)
                .values(**update_values)
            )
            row = conn.execute(
                select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to record GPS ping") from exc


def list_shipments(skip: int = 0, limit: int = 100) -> dict[str, dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(shipments_table)
                .order_by(shipments_table.c.id.asc())
                .offset(skip)
                .limit(limit)
            ).fetchall()
            mapped: dict[str, dict] = {}
            for row in rows:
                item = _row_to_dict(row)
                timestamp_value = item.get("timestamp")
                mapped[item["shipment_id"]] = {
                    "lat": item.get("lat"),
                    "lng": item.get("lng"),
                    "status": item.get("status"),
                    "origin": item.get("origin"),
                    "destination": item.get("destination"),
                    "eta": item.get("eta"),
                    "weight": item.get("weight"),
                    "vehicleNumber": item.get("vehicle_number"),
                    "assignmentStatus": item.get("assignment_status") or "Assigned",
                    "timestamp": (
                        timestamp_value.isoformat()
                        if isinstance(timestamp_value, datetime)
                        else str(timestamp_value or "")
                    ),
                }
            return mapped
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list shipments") from exc


def list_dealer_arrivals(dealer_lat: float = 12.9716, dealer_lng: float = 77.5946) -> list[dict]:
    try:
        with _engine().connect() as conn:
            join_stmt = (
                select(
                    shipments_table.c.shipment_id,
                    shipments_table.c.status,
                    shipments_table.c.origin,
                    shipments_table.c.destination,
                    shipments_table.c.eta,
                    shipments_table.c.lat,
                    shipments_table.c.lng,
                    shipments_table.c.weight,
                    shipments_table.c.vehicle_number,
                    orders_table.c.order_code,
                    orders_table.c.product_sku,
                    orders_table.c.quantity,
                    orders_table.c.current_stage,
                )
                .select_from(
                    shipments_table.outerjoin(
                        orders_table,
                        shipments_table.c.order_code == orders_table.c.order_code,
                    )
                )
                .order_by(desc(shipments_table.c.timestamp))
            )
            rows = conn.execute(join_stmt).fetchall()

        arrivals: list[dict] = []
        for index, row in enumerate(rows, start=1):
            record = dict(row._mapping)
            lat = record.get("lat")
            lng = record.get("lng")
            distance_km = None
            eta_hours = None
            if lat is not None and lng is not None:
                distance_km = _haversine_km(float(lat), float(lng), float(dealer_lat), float(dealer_lng))
                eta_hours = round(distance_km / 45.0, 1)

            status = str(record.get("status") or "in_transit")
            stage = str(record.get("current_stage") or status)
            arrivals.append(
                {
                    "id": index,
                    "shipmentId": record.get("shipment_id"),
                    "orderId": record.get("order_code"),
                    "manufacturer": "Global Supply Manufacturer",
                    "carrier": "Prime Logistics",
                    "origin": record.get("origin") or "Unknown",
                    "destination": record.get("destination") or "Unknown",
                    "status": stage.replace("_", " ").title(),
                    "estimatedArrival": record.get("eta") or "",
                    "currentLocation": (
                        f"{round(float(lat), 4)}, {round(float(lng), 4)}"
                        if lat is not None and lng is not None
                        else "Location unavailable"
                    ),
                    "progress": 95 if "deliver" in status else 35 if "delay" in status else 70,
                    "blockchainVerified": True,
                    "items": int(record.get("quantity") or 0),
                    "distanceKm": distance_km,
                    "etaHours": eta_hours,
                    "dealerMessage": (
                        f"Your shipment is {distance_km} km away, ETA {eta_hours} hours"
                        if distance_km is not None and eta_hours is not None
                        else "Waiting for live GPS signal"
                    ),
                    "lat": lat,
                    "lng": lng,
                    "vehicleNumber": record.get("vehicle_number") or "--",
                    "productSku": record.get("product_sku") or "--",
                }
            )
        return arrivals
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list dealer arrivals") from exc


def create_ledger_record(
    *,
    product_id: str,
    batch_id: str,
    event_stage: str,
    payload: dict,
    ledger_hash: str,
    tx_hash: str,
) -> dict:
    created_at = _utc_now()
    record_key = f"{product_id}:{batch_id}:{event_stage}:{tx_hash[:16]}"
    try:
        with _engine().begin() as conn:
            exists = conn.execute(
                select(ledger_records_table.c.id).where(ledger_records_table.c.record_key == record_key)
            ).first()
            values = {
                "record_key": record_key,
                "product_id": product_id,
                "batch_id": batch_id,
                "event_stage": event_stage,
                "payload": payload,
                "ledger_hash": ledger_hash,
                "tx_hash": tx_hash,
                "created_at": created_at,
            }
            if exists:
                conn.execute(
                    ledger_records_table.update()
                    .where(ledger_records_table.c.record_key == record_key)
                    .values(**values)
                )
            else:
                conn.execute(ledger_records_table.insert().values(**values))
            row = conn.execute(
                select(ledger_records_table).where(ledger_records_table.c.record_key == record_key)
            ).first()
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to write ledger record") from exc


def get_ledger_record(product_id: str, batch_id: str, event_stage: str | None = None) -> dict | None:
    try:
        with _engine().connect() as conn:
            stmt = select(ledger_records_table).where(
                and_(
                    ledger_records_table.c.product_id == product_id,
                    ledger_records_table.c.batch_id == batch_id,
                )
            )
            if event_stage:
                stmt = stmt.where(ledger_records_table.c.event_stage == event_stage)
            row = conn.execute(stmt.order_by(desc(ledger_records_table.c.created_at))).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to fetch ledger record") from exc


def get_ledger_record_by_tx_hash(tx_hash: str) -> dict | None:
    try:
        with _engine().connect() as conn:
            row = conn.execute(
                select(ledger_records_table).where(ledger_records_table.c.tx_hash == tx_hash)
            ).first()
            return _row_to_dict(row) if row else None
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to query tx hash") from exc


def list_ledger_records(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(ledger_records_table)
                .order_by(desc(ledger_records_table.c.created_at))
                .offset(skip)
                .limit(limit)
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list ledger records") from exc


def record_shipment_event(
    *,
    order_code: str,
    product_sku: str,
    shipment_id: str | None,
    event_stage: str,
    event_status: str,
    tx_hash: str,
    payload: dict,
    lat: float | None = None,
    lng: float | None = None,
    distance_km: float | None = None,
    eta_hours: float | None = None,
) -> dict:
    created_at = _utc_now()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                shipment_events_table.insert().values(
                    order_code=order_code,
                    product_sku=product_sku,
                    shipment_id=shipment_id,
                    event_stage=event_stage,
                    event_status=event_status,
                    lat=lat,
                    lng=lng,
                    distance_km=distance_km,
                    eta_hours=eta_hours,
                    tx_hash=tx_hash,
                    payload=payload,
                    created_at=created_at,
                )
            )
            event_id = _inserted_id(result, message="Failed to determine created shipment event id")
            row = conn.execute(
                select(shipment_events_table).where(shipment_events_table.c.id == event_id)
            ).first()
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to record shipment event") from exc


def get_product_journey(product_sku: str) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(shipment_events_table)
                .where(shipment_events_table.c.product_sku == product_sku)
                .order_by(shipment_events_table.c.created_at.asc())
            ).fetchall()

        journey: list[dict] = []
        for row in rows:
            item = _row_to_dict(row)
            created_at = item.get("created_at")
            journey.append(
                {
                    "eventStage": item.get("event_stage"),
                    "eventStatus": item.get("event_status"),
                    "orderCode": item.get("order_code"),
                    "shipmentId": item.get("shipment_id"),
                    "txHash": item.get("tx_hash"),
                    "distanceKm": item.get("distance_km"),
                    "etaHours": item.get("eta_hours"),
                    "location": (
                        {"lat": item.get("lat"), "lng": item.get("lng")}
                        if item.get("lat") is not None and item.get("lng") is not None
                        else None
                    ),
                    "payload": item.get("payload") or {},
                    "timestamp": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
                }
            )
        return journey
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to load product journey") from exc


def record_sale(*, sku: str, units_sold: int, sale_amount: float, retailer_name: str, sold_at: datetime | None = None) -> dict:
    timestamp = sold_at or _utc_now()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                sales_history_table.insert().values(
                    sku=sku,
                    units_sold=int(units_sold),
                    sale_amount=float(sale_amount),
                    retailer_name=retailer_name,
                    sold_at=timestamp,
                )
            )
            sale_id = _inserted_id(result, message="Failed to determine created sale id")
            row = conn.execute(select(sales_history_table).where(sales_history_table.c.id == sale_id)).first()
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to record sale") from exc


def get_sales_history(days: int = 30) -> list[dict]:
    since = _utc_now() - timedelta(days=max(days, 1))
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(sales_history_table)
                .where(sales_history_table.c.sold_at >= since)
                .order_by(sales_history_table.c.sold_at.asc())
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to query sales history") from exc


def get_sales_analytics(period: str = "week") -> dict:
    normalized = str(period).lower()
    days = 30 if normalized == "month" else 7
    since = _utc_now() - timedelta(days=days)
    try:
        with _engine().connect() as conn:
            sales_rows = conn.execute(
                select(sales_history_table)
                .where(sales_history_table.c.sold_at >= since)
                .order_by(sales_history_table.c.sold_at.asc())
            ).fetchall()
            products = conn.execute(select(products_table)).fetchall()
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to build sales analytics") from exc

    totals_by_day: dict[str, float] = {}
    units_by_sku: dict[str, int] = {}
    revenue_by_sku: dict[str, float] = {}
    for row in sales_rows:
        item = _row_to_dict(row)
        sold_at = item.get("sold_at")
        if isinstance(sold_at, datetime):
            day_label = sold_at.strftime("%a") if normalized != "month" else f"D{int(sold_at.strftime('%d'))}"
        else:
            day_label = "D1"
        totals_by_day[day_label] = totals_by_day.get(day_label, 0.0) + float(item.get("sale_amount") or 0.0)
        sku = str(item.get("sku") or "")
        units_by_sku[sku] = units_by_sku.get(sku, 0) + int(item.get("units_sold") or 0)
        revenue_by_sku[sku] = revenue_by_sku.get(sku, 0.0) + float(item.get("sale_amount") or 0.0)

    trend: list[dict] = []
    if normalized == "month":
        for day in range(1, 31):
            label = f"D{day}"
            trend.append({"label": label, "value": round(totals_by_day.get(label, 0.0), 2)})
    else:
        for label in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
            trend.append({"label": label, "value": round(totals_by_day.get(label, 0.0), 2)})

    product_names = {item["sku"]: item["name"] for item in [_row_to_dict(row) for row in products]}
    top_products = [
        {
            "product": product_names.get(sku, sku),
            "units": units,
            "revenue": format_inr(revenue_by_sku.get(sku, 0.0), decimals=2),
            "growth": "+5%" if units > 0 else "0%",
        }
        for sku, units in sorted(units_by_sku.items(), key=lambda kv: kv[1], reverse=True)
    ][:5]

    recent_transactions = []
    recent_sales_rows = sorted(
        [_row_to_dict(r) for r in sales_rows],
        key=lambda item: item.get("sold_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:8]
    for row_data in recent_sales_rows:
        sold_at = row_data.get("sold_at")
        recent_transactions.append(
            {
                "id": f"TXN-{row_data.get('id')}",
                "time": sold_at.strftime("%H:%M") if isinstance(sold_at, datetime) else "--:--",
                "items": int(row_data.get("units_sold") or 0),
                "amount": format_inr(float(row_data.get("sale_amount") or 0.0), decimals=2),
                "payment": "Card",
                "status": "Completed",
            }
        )

    today_value = trend[-1]["value"] if trend else 0.0
    week_value = sum(item["value"] for item in trend[-7:]) if trend else 0.0
    month_value = sum(item["value"] for item in trend) if trend else 0.0
    avg_tx = month_value / max(len(recent_transactions), 1)

    return {
        "period": "month" if normalized == "month" else "week",
        "trend": trend,
        "topProducts": top_products,
        "recentTransactions": recent_transactions,
        "salesStats": {
            "today": format_inr(today_value, decimals=0),
            "week": format_inr(week_value, decimals=0),
            "month": format_inr(month_value, decimals=0),
            "avgTransaction": format_inr(avg_tx, decimals=2),
        },
    }


def reorder_recommendations(days: int = 30) -> list[dict]:
    since = _utc_now() - timedelta(days=max(days, 1))
    try:
        with _engine().connect() as conn:
            product_rows = conn.execute(select(products_table)).fetchall()
            sales_rows = conn.execute(
                select(sales_history_table)
                .where(sales_history_table.c.sold_at >= since)
                .order_by(sales_history_table.c.sold_at.asc())
            ).fetchall()
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to generate reorder recommendations") from exc

    sold_by_sku: dict[str, int] = {}
    for row in sales_rows:
        item = _row_to_dict(row)
        sku = str(item.get("sku") or "")
        sold_by_sku[sku] = sold_by_sku.get(sku, 0) + int(item.get("units_sold") or 0)

    recommendations: list[dict] = []
    for row in product_rows:
        product = _row_to_dict(row)
        sku = str(product.get("sku") or "")
        current_stock = int(product.get("quantity") or 0)
        reorder_point = int(product.get("reorder_point") or 0)
        safety_stock = int(product.get("safety_stock_qty") or 0)
        lead_time = int(product.get("lead_time_days") or 0)

        total_sold = sold_by_sku.get(sku, 0)
        avg_daily_sales = round(total_sold / max(days, 1), 2)
        stockout_days = round(current_stock / avg_daily_sales, 1) if avg_daily_sales > 0 else None
        
        reasons = []
        should_reorder = False
        priority = "normal"
        
        if current_stock <= safety_stock:
            reasons.append(f"Current stock ({current_stock}) is at or below safety stock ({safety_stock}).")
            should_reorder = True
            priority = "critical"
        elif current_stock <= reorder_point:
            reasons.append(f"Current stock ({current_stock}) is below reorder point ({reorder_point}).")
            should_reorder = True
            priority = "high"
            
        if stockout_days is not None and stockout_days <= lead_time:
            reasons.append(f"Stock will run out in {stockout_days} days, which is less than or equal to lead time ({lead_time} days).")
            should_reorder = True
            if priority != "critical":
                priority = "high"

        if not reasons:
            reasons.append("Stock level is healthy.")

        recommendations.append(
            {
                "sku": sku,
                "productName": product.get("name"),
                "currentStock": current_stock,
                "reorderPoint": reorder_point,
                "safetyStock": safety_stock,
                "leadTimeDays": lead_time,
                "avgDailySales": avg_daily_sales,
                "stockOutDays": stockout_days,
                "recommendation": " ".join(reasons),
                "priority": priority,
                "reasons": reasons,
            }
        )
    return recommendations


def create_notification(
    *,
    user_id: str,
    title: str,
    message: str,
    severity: str = "info",
    metadata_payload: dict | None = None,
) -> dict:
    created_at = _utc_now()
    payload = metadata_payload or {}
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                notifications_table.insert().values(
                    user_id=user_id,
                    title=title,
                    message=message,
                    severity=severity,
                    metadata=payload,
                    created_at=created_at,
                )
            )
            notification_id = _inserted_id(result, message="Failed to determine created notification id")
            row = conn.execute(
                select(notifications_table).where(notifications_table.c.id == notification_id)
            ).first()
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to create notification") from exc


def list_notifications(user_id: str | None = None, limit: int = 50) -> list[dict]:
    try:
        with _engine().connect() as conn:
            stmt = select(notifications_table)
            if user_id:
                stmt = stmt.where(notifications_table.c.user_id == user_id)
            rows = conn.execute(stmt.order_by(desc(notifications_table.c.created_at)).limit(limit)).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list notifications") from exc


def summarize_global_metrics() -> dict:
    try:
        with _engine().connect() as conn:
            return {
                "active_orders": int(conn.execute(select(func.count()).select_from(orders_table).where(orders_table.c.status != 'delivered')).scalar() or 0),
                "active_shipments": int(conn.execute(select(func.count()).select_from(shipments_table).where(shipments_table.c.status != 'delivered')).scalar() or 0),
                "in_transit_shipments": int(conn.execute(select(func.count()).select_from(shipments_table).where(shipments_table.c.status == 'in_transit')).scalar() or 0),
                "delayed_shipments": int(conn.execute(select(func.count()).select_from(shipments_table).where(shipments_table.c.status == 'delayed')).scalar() or 0),
                "critical_risks": int(conn.execute(select(func.count()).select_from(anomalies_table).where(anomalies_table.c.severity == 'critical')).scalar() or 0),
                "active_manufacturers": int(conn.execute(select(func.count()).select_from(users_table).where((users_table.c.role == 'manufacturer') & (users_table.c.is_active == True))).scalar() or 0),
                "active_transporters": int(conn.execute(select(func.count()).select_from(users_table).where((users_table.c.role == 'transporter') & (users_table.c.is_active == True))).scalar() or 0),
                "active_dealers": int(conn.execute(select(func.count()).select_from(users_table).where((users_table.c.role == 'dealer') & (users_table.c.is_active == True))).scalar() or 0),
                "active_retail_shops": int(conn.execute(select(func.count()).select_from(users_table).where((users_table.c.role == 'retail_shop') & (users_table.c.is_active == True))).scalar() or 0),
                "inventory_alerts": 0, # Placeholder, will implement below
                "pending_waybills": int(conn.execute(select(func.count()).select_from(waybill_documents_table).where(waybill_documents_table.c.status == 'pending')).scalar() or 0),
                "pending_discrepancies": int(conn.execute(select(func.count()).select_from(anomalies_table).where(anomalies_table.c.status == 'open')).scalar() or 0),
                
                # Keep old ones just in case
                "total_products": int(conn.execute(select(func.count()).select_from(products_table)).scalar() or 0),
                "total_batches": int(conn.execute(select(func.count()).select_from(batches_table)).scalar() or 0),
                "revenue": round(float(conn.execute(select(func.coalesce(func.sum(sales_history_table.c.sale_amount), 0.0))).scalar() or 0.0), 2),
            }
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to summarize global metrics") from exc


def build_admin_blockchain_transactions() -> dict:
    records = list_ledger_records(limit=500)
    transactions = []
    for idx, item in enumerate(records, start=1):
        created_at = item.get("created_at")
        transactions.append({
            "id": idx,
            "transactionHash": item.get("tx_hash"),
            "productBatch": item.get("batch_id"),
            "manufacturer": "Global Supply Manufacturer",
            "status": "verified",
            "blockNumber": 18234000 + idx,
            "gasFee": 38 + (idx % 10),
            "timestamp": (
                created_at.isoformat()
                if isinstance(created_at, datetime)
                else str(created_at or "")
            ),
            "productDetails": {
                "productId": item.get("product_id"),
                "eventStage": item.get("event_stage"),
                "payload": item.get("payload") or {},
            },
        })
    total = len(transactions)
    gas_fees = [cast(float, item["gasFee"]) for item in transactions]
    return {
        "transactions": transactions,
        "stats": {
            "totalVerifications": total,
            "successRate": 100.0 if total else 0.0,
            "avgGasFee": round(sum(gas_fees) / max(total, 1), 2),
            "pendingTransactions": 0,
        },
    }


def append_pipeline_event(
    *,
    order_code: str,
    product_sku: str,
    stage: str,
    tx_hash: str,
    payload: dict,
    shipment_id: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    distance_km: float | None = None,
    eta_hours: float | None = None,
) -> dict:
    return record_shipment_event(
        order_code=order_code,
        product_sku=product_sku,
        shipment_id=shipment_id,
        event_stage=stage,
        event_status=_stage_title(stage),
        tx_hash=tx_hash,
        payload=payload,
        lat=lat,
        lng=lng,
        distance_km=distance_km,
        eta_hours=eta_hours,
    )


def log_activity(user_id: str, role: str, action: str, entity_type: str | None = None, entity_id: str | None = None, details: dict | None = None) -> None:
    now = _utc_now()
    with _engine().begin() as conn:
        conn.execute(
            activity_logs_table.insert().values(
                user_id=user_id,
                role=role,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details or {},
                timestamp=now
            )
        )

def get_activity_logs(limit: int = 100) -> list[dict]:
    with _engine().begin() as conn:
        rows = conn.execute(
            select(activity_logs_table)
            .order_by(desc(activity_logs_table.c.timestamp))
            .limit(limit)
        ).fetchall()
        
        results = []
        for row in rows:
            d = dict(row._mapping)
            if 'timestamp' in d and hasattr(d['timestamp'], 'isoformat'):
                d['timestamp'] = d['timestamp'].isoformat()
            results.append(d)
        return results

def get_rag_quota(month_str: str) -> dict:
    with _engine().begin() as conn:
        row = conn.execute(
            select(rag_quota_table).where(rag_quota_table.c.month == month_str)
        ).first()
        if not row:
            conn.execute(
                rag_quota_table.insert().values(month=month_str, pages_used=0, page_limit=200)
            )
            return {"month": month_str, "pages_used": 0, "page_limit": 200}
        return dict(row._mapping)

def increment_rag_quota(month_str: str, pages: int) -> dict:
    quota = get_rag_quota(month_str)
    new_used = quota["pages_used"] + pages
    if new_used > quota["page_limit"]:
        raise ValueError("Monthly document page limit exceeded")
    
    with _engine().begin() as conn:
        conn.execute(
            rag_quota_table.update()
            .where(rag_quota_table.c.month == month_str)
            .values(pages_used=new_used)
        )
    return get_rag_quota(month_str)


def get_supplier_tree() -> list[dict]:
    with _engine().begin() as conn:
        suppliers = conn.execute(select(suppliers_table)).fetchall()
        scores = conn.execute(
            select(supplier_risk_scores_table)
            .order_by(desc(supplier_risk_scores_table.c.assessed_at))
        ).fetchall()

        latest_scores = {}
        for s in scores:
            d = dict(s._mapping)
            if 'assessed_at' in d and hasattr(d['assessed_at'], 'isoformat'):
                d['assessed_at'] = d['assessed_at'].isoformat()
            if d['supplier_id'] not in latest_scores:
                latest_scores[d['supplier_id']] = d
        
        nodes = []
        for row in suppliers:
            d = dict(row._mapping)
            if 'created_at' in d and hasattr(d['created_at'], 'isoformat'):
                d['created_at'] = d['created_at'].isoformat()
            d["risk_score"] = latest_scores.get(d["supplier_id"])
            d["children"] = []
            nodes.append(d)
            
        tree = []
        node_map = {n["supplier_id"]: n for n in nodes}
        for n in nodes:
            if n.get("parent_supplier_id") and n["parent_supplier_id"] in node_map:
                node_map[n["parent_supplier_id"]]["children"].append(n)
            else:
                tree.append(n)
                
        return tree

# -----------------------------------------------------------------------------
# Waybill Document Methods
# -----------------------------------------------------------------------------

def check_and_record_idempotency_key(idempotency_key: str) -> bool:
    """Returns True if the key was already processed, False if it's new (and records it)."""
    with _engine().begin() as conn:
        try:
            conn.execute(
                processed_keys_table.insert().values(
                    idempotency_key=idempotency_key,
                    created_at=datetime.now(timezone.utc)
                )
            )
            return False
        except IntegrityError:
            return True

def create_waybill(waybill_id: str, batch_id: str, sku: str, quantity: int, order_id: str | None, initial_custodian: str, actor_id: str, actor_role: str) -> dict[str, Any]:
    with _engine().begin() as conn:
        now = datetime.now(timezone.utc)
        
        # 1. Insert waybill document
        stmt = waybill_documents_table.insert().values(
            waybill_id=waybill_id,
            batch_id=batch_id,
            sku=sku,
            quantity=quantity,
            order_id=order_id,
            current_custodian=initial_custodian,
            status="created",
            qr_code=None,
            created_at=now,
            updated_at=now
        )
        conn.execute(stmt)

        # 2. Insert initial custody event
        import hashlib
        new_hash = hashlib.sha256(f"{waybill_id}{initial_custodian}{now.isoformat()}".encode()).hexdigest()

        custody_stmt = custody_events_table.insert().values(
            waybill_id=waybill_id,
            event_type="creation",
            from_custodian=None,
            to_custodian=initial_custodian,
            actor_id=actor_id,
            actor_role=actor_role,
            quantity=quantity,
            location=None,
            event_hash=new_hash,
            previous_event_hash=None,
            created_at=now
        )
        conn.execute(custody_stmt)
        
        return get_waybill(waybill_id) or {}

def update_waybill_custody(waybill_id: str, new_custodian: str, actor_id: str, actor_role: str, quantity: int, location: str | None = None, event_type: str = "transfer") -> dict[str, Any] | None:
    with _engine().begin() as conn:
        # Get current waybill and latest custody event for chaining
        waybill_row = conn.execute(select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)).first()
        if not waybill_row:
            return None
        waybill = _row_to_dict(waybill_row)
        
        last_event_row = conn.execute(
            select(custody_events_table)
            .where(custody_events_table.c.waybill_id == waybill_id)
            .order_by(desc(custody_events_table.c.id))
        ).first()
        
        previous_hash = _row_to_dict(last_event_row).get("event_hash") if last_event_row else None
        now = datetime.now(timezone.utc)
        
        import hashlib
        new_hash = hashlib.sha256(f"{previous_hash}{waybill_id}{new_custodian}{now.isoformat()}".encode()).hexdigest()
        
        custody_stmt = custody_events_table.insert().values(
            waybill_id=waybill_id,
            event_type=event_type,
            from_custodian=waybill.get("current_custodian"),
            to_custodian=new_custodian,
            actor_id=actor_id,
            actor_role=actor_role,
            quantity=quantity,
            location=location,
            event_hash=new_hash,
            previous_event_hash=previous_hash,
            created_at=now
        )
        conn.execute(custody_stmt)
        
        status = "in_transit" if event_type == "transfer" else ("delivered" if event_type == "receive" else waybill.get("status"))
        
        upd_stmt = (
            waybill_documents_table.update()
            .where(waybill_documents_table.c.waybill_id == waybill_id)
            .values(
                current_custodian=new_custodian,
                status=status,
                updated_at=now
            )
        )
        conn.execute(upd_stmt)
        
    return get_waybill(waybill_id)

def get_waybill(waybill_id: str) -> dict[str, Any] | None:
    with _engine().begin() as conn:
        stmt = select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)
        row = conn.execute(stmt).first()
        if not row:
            return None
        waybill = _row_to_dict(row)
        
        events_stmt = select(custody_events_table).where(custody_events_table.c.waybill_id == waybill_id).order_by(custody_events_table.c.id)
        events_rows = conn.execute(events_stmt).fetchall()
        waybill["custody_chain"] = [_row_to_dict(er) for er in events_rows]
        return waybill
        
def get_all_waybills() -> list[dict]:
    with _engine().begin() as conn:
        rows = conn.execute(select(waybill_documents_table)).fetchall()
        waybills = []
        for r in rows:
            w = _row_to_dict(r)
            waybills.append(w)
        return waybills

def verify_waybill(waybill_id: str, seal_hash: str) -> dict:
    waybill = get_waybill(waybill_id)
    if not waybill:
        return {"valid": False, "reason": "Waybill not found"}
        
    chain = waybill.get("custody_chain", [])
    if not chain:
        return {"valid": False, "reason": "No custody events found", "waybill": waybill}
        
    latest_event = chain[-1]
    if latest_event.get("event_hash") != seal_hash:
        return {"valid": False, "reason": "Seal hash mismatch", "waybill": waybill}
        
    # Verify the hash chain
    for i in range(1, len(chain)):
        if chain[i].get("previous_event_hash") != chain[i-1].get("event_hash"):
            return {"valid": False, "reason": "Custody chain integrity broken", "waybill": waybill}
            
    return {"valid": True, "waybill": waybill}

def verify_waybill_trust(waybill_id: str) -> dict:
    from app.services.blockchain_service import generate_product_hash
    with _engine().connect() as conn:
        waybill_row = conn.execute(select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)).first()
        if not waybill_row:
            return {"is_valid": False, "mismatches": ["Waybill not found"]}
            
        waybill = _row_to_dict(waybill_row)
        seal_hash = waybill.get("seal_hash")
        mismatches = []
        
        if not seal_hash:
            mismatches.append("Waybill has no seal_hash")
            
        # 1. Calculate custody hash chain
        events_rows = conn.execute(
            select(custody_events_table)
            .where(custody_events_table.c.waybill_id == waybill_id)
            .order_by(custody_events_table.c.id)
        ).fetchall()
        
        custody_chain = [_row_to_dict(r) for r in events_rows]
        if not custody_chain:
            mismatches.append("No custody events found")
        else:
            expected_prev = None
            for event in custody_chain:
                if event.get("previous_event_hash") != expected_prev:
                    mismatches.append(f"Custody chain broken at event {event.get('id')}: previous_event_hash mismatch")
                # Recalculating hash requires exact isoformat, doing link verification instead
                expected_prev = event.get("event_hash")
                
            if seal_hash and expected_prev != seal_hash:
                mismatches.append("Seal hash mismatch: waybill seal_hash != latest event hash")
                
        # 2. Calculate ledger hash chain
        batch_id = waybill.get("batch_id")
        if batch_id:
            ledger_rows = conn.execute(
                select(ledger_records_table)
                .where(ledger_records_table.c.batch_id == batch_id)
                .order_by(ledger_records_table.c.id)
            ).fetchall()
            for r in ledger_rows:
                r_dict = _row_to_dict(r)
                # Recalculate ledger hash
                expected_hash = generate_product_hash(
                    product_id=r_dict.get("product_id"),
                    batch_id=r_dict.get("batch_id"),
                    payload=r_dict.get("payload", {})
                )
                if expected_hash != r_dict.get("ledger_hash"):
                    mismatches.append(f"Ledger record {r_dict.get('id')} tampered: hash mismatch")

        # Verify global financial ledger chain links for related entries
        fin_rows = conn.execute(
            select(financial_ledger_table).order_by(financial_ledger_table.c.id)
        ).fetchall()
        fin_chain = [_row_to_dict(r) for r in fin_rows]
        
        for i in range(1, len(fin_chain)):
            if fin_chain[i].get("previous_ledger_hash") != fin_chain[i-1].get("ledger_hash"):
                if fin_chain[i].get("entity_id") == waybill_id or fin_chain[i].get("seal_hash") == seal_hash:
                    mismatches.append(f"Financial ledger chain broken at entry {fin_chain[i].get('id')}")
                    
        return {
            "is_valid": len(mismatches) == 0,
            "mismatches": mismatches
        }


def get_waybill_by_order(order_id: str) -> dict[str, Any] | None:
    with _engine().begin() as conn:
        stmt = select(waybill_documents_table).where(waybill_documents_table.c.order_id == order_id)
        row = conn.execute(stmt).first()
        if not row:
            return None
        waybill = _row_to_dict(row)
        
        events_stmt = select(custody_events_table).where(custody_events_table.c.waybill_id == waybill_id).order_by(custody_events_table.c.id)
        events_rows = conn.execute(events_stmt).fetchall()
        waybill["custody_chain"] = [_row_to_dict(er) for er in events_rows]
        return waybill



def create_audit_log(
    *,
    user: str,
    role: str,
    action: str,
    entity: str,
    entity_id: str,
    old_value: dict | None = None,
    new_value: dict | None = None,
    metadata_val: dict | None = None
) -> dict:
    now = _utc_now()
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                audit_logs_table.insert().values(
                    user=user,
                    role=role,
                    action=action,
                    entity=entity,
                    entity_id=entity_id,
                    old_value=old_value,
                    new_value=new_value,
                    metadata=metadata_val or {},
                    timestamp=now,
                )
            )
            inserted_id = _inserted_id(result, message="Failed to get inserted audit log id")
            row = conn.execute(select(audit_logs_table).where(audit_logs_table.c.id == inserted_id)).first()
            return _row_to_dict(row)
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to create audit log") from exc

def list_audit_logs(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(audit_logs_table)
                .order_by(desc(audit_logs_table.c.timestamp))
                .offset(skip)
                .limit(limit)
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list audit logs") from exc

def list_backorders(skip: int = 0, limit: int = 100) -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(
                select(backorders_table)
                .order_by(desc(backorders_table.c.created_at))
                .offset(skip)
                .limit(limit)
            ).fetchall()
            return [_row_to_dict(row) for row in rows]
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to list backorders") from exc

def get_revenue_vs_cost() -> list[dict]:
    try:
        with _engine().connect() as conn:
            query = text("""
                SELECT strftime('%Y-%m', o.created_at) as month, SUM(p.price * o.quantity) as revenue
                FROM orders o
                JOIN products p ON o.product_sku = p.sku
                GROUP BY month
                ORDER BY month DESC
                LIMIT 6
            """)
            rows = conn.execute(query).fetchall()
            data = []
            for r in reversed(rows):
                if r[0]:
                    rev = float(r[1] or 0)
                    data.append({"month": r[0], "revenue": rev, "cost": rev * 0.7})
            if not data:
                data = [{"month": "2024-01", "revenue": 10000, "cost": 7000}]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get revenue vs cost") from exc

def get_order_pipeline_counts() -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(select(orders_table.c.status, func.count()).group_by(orders_table.c.status)).fetchall()
            data = [{"status": r[0], "count": r[1]} for r in rows if r[0]]
            if not data:
                data = [{"status": "pending", "count": 0}]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get order pipeline counts") from exc

def get_backorder_trends() -> list[dict]:
    try:
        with _engine().connect() as conn:
            query = text("""
                SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count
                FROM backorders
                GROUP BY day
                ORDER BY day DESC
                LIMIT 7
            """)
            rows = conn.execute(query).fetchall()
            data = [{"day": r[0], "count": r[1]} for r in reversed(rows) if r[0]]
            if not data:
                data = [{"day": "2024-01-01", "count": 0}]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get backorder trends") from exc

def get_profit_margins() -> list[dict]:
    try:
        with _engine().connect() as conn:
            query = text("""
                SELECT strftime('%Y-%m', o.created_at) as month, SUM(p.price * o.quantity) as revenue
                FROM orders o
                JOIN products p ON o.product_sku = p.sku
                GROUP BY month
                ORDER BY month DESC
                LIMIT 6
            """)
            rows = conn.execute(query).fetchall()
            data = []
            for r in reversed(rows):
                if r[0]:
                    data.append({"month": r[0], "margin_pct": 30.0})
            if not data:
                data = [{"month": "2024-01", "margin_pct": 30.0}]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get profit margins") from exc

def get_inventory_vs_reorder() -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(select(products_table.c.sku, products_table.c.available_stock).limit(5)).fetchall()
            data = [{"sku": r[0], "stock": r[1] or 0, "reorder_point": 50} for r in rows if r[0]]
            if not data:
                data = [{"sku": "NONE", "stock": 0, "reorder_point": 50}]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get inventory vs reorder") from exc

def get_route_cost_savings() -> list[dict]:
    try:
        with _engine().connect() as conn:
            query = text("""
                SELECT s.origin, s.destination, AVG(c.transport_cost) as avg_cost
                FROM shipments s
                JOIN cost_ledger c ON s.shipment_id = c.shipment_id
                WHERE s.origin IS NOT NULL AND s.destination IS NOT NULL
                GROUP BY s.origin, s.destination
                LIMIT 5
            """)
            rows = conn.execute(query).fetchall()
            data = []
            for r in rows:
                if r[0] and r[1]:
                    route = f"{r[0]} - {r[1]}"
                    after = float(r[2] or 0)
                    before = after * 1.25
                    data.append({"route": route, "before": before, "after": after})
            if not data:
                data = [
                    {"route": "Mumbai - Delhi", "before": 12000, "after": 9500},
                    {"route": "Chennai - Blr", "before": 4500, "after": 3800},
                    {"route": "Delhi - Pune", "before": 14000, "after": 11000}
                ]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get route cost savings") from exc

def get_fleet_utilization() -> list[dict]:
    try:
        with _engine().connect() as conn:
            rows = conn.execute(select(trucks_table.c.maintenance_status, func.count()).group_by(trucks_table.c.maintenance_status)).fetchall()
            data = []
            for r in rows:
                status = r[0] or "Active"
                data.append({"status": status.capitalize(), "count": r[1]})
            if not data:
                data = [
                    {"status": "Active", "count": 24},
                    {"status": "Idle", "count": 6},
                    {"status": "Maintenance", "count": 2}
                ]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get fleet utilization") from exc

def get_delay_risk_distribution() -> list[dict]:
    try:
        with _engine().connect() as conn:
            query = text("""
                SELECT 
                    CASE 
                        WHEN delay_risk_score < 0.3 THEN 'Low'
                        WHEN delay_risk_score < 0.7 THEN 'Medium'
                        ELSE 'High'
                    END as risk_level,
                    COUNT(*) as count
                FROM shipments
                WHERE delay_risk_score IS NOT NULL
                GROUP BY risk_level
            """)
            rows = conn.execute(query).fetchall()
            data = [{"risk_level": r[0], "count": r[1]} for r in rows if r[0]]
            if not data:
                data = [
                    {"risk_level": "Low", "count": 15},
                    {"risk_level": "Medium", "count": 7},
                    {"risk_level": "High", "count": 2}
                ]
            return data
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to get delay risk distribution") from exc


def seal_waybill(waybill_id: str) -> str | None:
    try:
        with _engine().begin() as conn:
            waybill_row = conn.execute(
                select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)
            ).first()
            
            if not waybill_row:
                return None
                
            wb_data = _row_to_dict(waybill_row)
            
            events_rows = conn.execute(
                select(custody_events_table)
                .where(custody_events_table.c.waybill_id == waybill_id)
                .order_by(custody_events_table.c.id.asc())
            ).fetchall()
            
            data_to_hash = f"wb:{wb_data.get('waybill_id')}|batch:{wb_data.get('batch_id')}|qty:{wb_data.get('quantity')}"
            for ev in events_rows:
                ev_data = _row_to_dict(ev)
                data_to_hash += f"|ev:{ev_data.get('event_type')}:{ev_data.get('to_custodian')}:{ev_data.get('event_hash')}"
                
            seal_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
            
            conn.execute(
                waybill_documents_table.update()
                .where(waybill_documents_table.c.waybill_id == waybill_id)
                .values(seal_hash=seal_hash, updated_at=_utc_now())
            )
            return seal_hash
    except SQLAlchemyError as exc:
        raise DatabaseError(f"Failed to seal waybill {waybill_id}") from exc


def get_control_tower_analytics(date_from: str | None = None, date_to: str | None = None, status_filter: str | None = None) -> dict:
    """Aggregates all Control Tower analytics in one call so all charts share the same filtered dataset."""
    try:
        with _engine().connect() as conn:
            # Build date filter clause
            date_clause = ""
            if date_from and date_to:
                date_clause = f"AND o.created_at >= '{date_from}' AND o.created_at <= '{date_to}'"
            elif date_from:
                date_clause = f"AND o.created_at >= '{date_from}'"
            
            status_clause = ""
            if status_filter and status_filter != 'all':
                status_clause = f"AND o.status = '{status_filter}'"

            # 1. Order pipeline stage counts
            pipeline_rows = conn.execute(text(f"""
                SELECT current_stage, COUNT(*) as count
                FROM orders o
                WHERE 1=1 {date_clause} {status_clause}
                GROUP BY current_stage
                ORDER BY count DESC
            """)).fetchall()
            pipeline = [{'stage': r[0] or 'Unknown', 'count': int(r[1])} for r in pipeline_rows]

            # 2. Order throughput over time (last 30 points)
            throughput_rows = conn.execute(text(f"""
                SELECT 
                    strftime('%Y-%m-%d', o.created_at) as day,
                    COUNT(*) as created_count,
                    SUM(CASE WHEN o.status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completed_count
                FROM orders o
                WHERE 1=1 {date_clause}
                GROUP BY day
                ORDER BY day ASC
                LIMIT 30
            """)).fetchall()
            throughput = [{'day': r[0], 'created': int(r[1]), 'completed': int(r[2] or 0)} for r in throughput_rows if r[0]]

            # 3. Orders by status
            by_status_rows = conn.execute(text(f"""
                SELECT o.status, COUNT(*) as count
                FROM orders o
                WHERE 1=1 {date_clause}
                GROUP BY o.status
                ORDER BY count DESC
            """)).fetchall()
            by_status = [{'status': r[0] or 'Unknown', 'count': int(r[1])} for r in by_status_rows]

            # 4. Completion rate
            completion_row = conn.execute(text(f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completed
                FROM orders o
                WHERE 1=1 {date_clause}
            """)).fetchone()
            total_orders = int(completion_row[0] or 0)
            completed_orders = int(completion_row[1] or 0)
            completion_rate = round((completed_orders / total_orders * 100) if total_orders > 0 else 0, 1)

            # 5. Shipment risk classification (using delay_risk_score)
            shipment_risk_rows = conn.execute(text("""
                SELECT
                    CASE
                        WHEN delay_risk_score IS NULL THEN 'Normal'
                        WHEN delay_risk_score < 0.3 THEN 'Normal'
                        WHEN delay_risk_score < 0.6 THEN 'At Risk'
                        WHEN delay_risk_score < 0.8 THEN 'Delayed'
                        ELSE 'Critical'
                    END as risk_level,
                    COUNT(*) as count
                FROM shipments
                GROUP BY risk_level
            """)).fetchall()
            shipment_risk = [{'level': r[0], 'count': int(r[1])} for r in shipment_risk_rows]

            # 6. Shipment risk trend (last 14 days)
            risk_trend_rows = conn.execute(text("""
                SELECT
                    strftime('%Y-%m-%d', timestamp) as day,
                    SUM(CASE WHEN delay_risk_score IS NULL OR delay_risk_score < 0.3 THEN 1 ELSE 0 END) as normal,
                    SUM(CASE WHEN delay_risk_score >= 0.3 AND delay_risk_score < 0.6 THEN 1 ELSE 0 END) as at_risk,
                    SUM(CASE WHEN delay_risk_score >= 0.6 AND delay_risk_score < 0.8 THEN 1 ELSE 0 END) as delayed,
                    SUM(CASE WHEN delay_risk_score >= 0.8 THEN 1 ELSE 0 END) as critical
                FROM shipments
                GROUP BY day
                ORDER BY day ASC
                LIMIT 14
            """)).fetchall()
            risk_trend = [{
                'day': r[0], 'normal': int(r[1] or 0), 'at_risk': int(r[2] or 0),
                'delayed': int(r[3] or 0), 'critical': int(r[4] or 0)
            } for r in risk_trend_rows if r[0]]

            # 7. Shipment scatter: predicted_delay_minutes vs weight (as proxy for distance)
            scatter_rows = conn.execute(text("""
                SELECT
                    weight,
                    predicted_delay_minutes,
                    delay_risk_score,
                    shipment_id
                FROM shipments
                WHERE weight IS NOT NULL AND predicted_delay_minutes IS NOT NULL
                LIMIT 100
            """)).fetchall()
            shipment_scatter = [{
                'weight': float(r[0] or 0),
                'delay_minutes': int(r[1] or 0),
                'risk_score': float(r[2] or 0),
                'id': r[3]
            } for r in scatter_rows]

            # 8. Inventory health classification
            inv_rows = conn.execute(text("""
                SELECT
                    sku, name,
                    available_stock,
                    reorder_point,
                    safety_stock_qty,
                    quantity,
                    price
                FROM products
                WHERE sku IS NOT NULL
                LIMIT 50
            """)).fetchall()
            inventory_items = []
            for r in inv_rows:
                avail = int(r[2] or 0)
                reorder = int(r[3] or 0) if r[3] else max(int(r[5] or 0) // 4, 5)
                safety = int(r[4] or 0) if r[4] else max(reorder // 2, 2)
                # Classify
                if avail <= 0:
                    health = 'Critical'
                elif avail <= safety:
                    health = 'Critical'
                elif avail <= reorder:
                    health = 'Low'
                elif avail > reorder * 3:
                    health = 'Overstock'
                else:
                    health = 'Healthy'
                inventory_items.append({
                    'sku': r[0], 'name': r[1],
                    'available_stock': avail,
                    'reorder_point': reorder,
                    'safety_stock': safety,
                    'quantity': int(r[5] or 0),
                    'price': float(r[6] or 0),
                    'health': health
                })

            # 9. Inventory health summary
            health_summary = {'Healthy': 0, 'Low': 0, 'Critical': 0, 'Overstock': 0}
            for item in inventory_items:
                health_summary[item['health']] = health_summary.get(item['health'], 0) + 1
            inventory_health_breakdown = [
                {'category': k, 'count': v} for k, v in health_summary.items()
            ]

            # 10. Stock vs demand trend (sales history)
            stock_demand_rows = conn.execute(text("""
                SELECT
                    strftime('%Y-%m-%d', sold_at) as day,
                    SUM(units_sold) as demand
                FROM sales_history
                GROUP BY day
                ORDER BY day ASC
                LIMIT 30
            """)).fetchall()
            stock_demand = [{'day': r[0], 'demand': int(r[1] or 0)} for r in stock_demand_rows if r[0]]

            # KPIs
            total_inv = sum(i['available_stock'] for i in inventory_items)
            critical_inv = sum(1 for i in inventory_items if i['health'] == 'Critical')
            total_risk_shipments = sum(s['count'] for s in shipment_risk if s['level'] in ('At Risk', 'Delayed', 'Critical'))

            return {
                'kpis': {
                    'total_orders': total_orders,
                    'completed_orders': completed_orders,
                    'completion_rate': completion_rate,
                    'total_risk_shipments': total_risk_shipments,
                    'critical_inventory': critical_inv,
                    'total_inventory_items': len(inventory_items),
                    'total_stock': total_inv
                },
                'order_pipeline': pipeline,
                'order_throughput': throughput,
                'orders_by_status': by_status,
                'completion_rate': completion_rate,
                'shipment_risk': shipment_risk,
                'risk_trend': risk_trend,
                'shipment_scatter': shipment_scatter,
                'inventory_items': inventory_items,
                'inventory_health_breakdown': inventory_health_breakdown,
                'stock_demand_trend': stock_demand
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('Failed to get control tower analytics') from exc


def get_supply_chain_analytics(date_from: str | None = None, date_to: str | None = None) -> dict:
    """Aggregates all Supply Chain Depth analytics in one call."""
    try:
        with _engine().connect() as conn:
            date_clause = ''
            if date_from:
                date_clause = f"AND o.created_at >= '{date_from}'"
            if date_to:
                date_clause += f" AND o.created_at <= '{date_to}'"

            # Network nodes from users table
            user_rows = conn.execute(text("""
                SELECT id, name, role, company_name, is_active FROM users
                WHERE role IN ('manufacturer', 'transporter', 'dealer', 'retail_shop')
            """)).fetchall()
            nodes = [{
                'id': str(r[0]),
                'name': r[1] or r[2],
                'entity_type': r[2],
                'company': r[3] or r[1],
                'is_active': bool(r[4])
            } for r in user_rows]

            # Supplier nodes
            sup_rows = conn.execute(text("""
                SELECT s.supplier_id, s.name, s.tier,
                    COALESCE(rs.overall_score, 0.5) as risk
                FROM suppliers s
                LEFT JOIN supplier_risk_scores rs ON s.supplier_id = rs.supplier_id
            """)).fetchall()
            supplier_nodes = [{
                'id': r[0], 'name': r[1], 'entity_type': 'supplier',
                'tier': int(r[2] or 1), 'risk_score': float(r[3] or 0.5)
            } for r in sup_rows]
            nodes = supplier_nodes + nodes

            # Edges from orders (manufacturer -> transporter -> dealer)
            edge_rows = conn.execute(text(f"""
                SELECT
                    manufacturer_id, transporter_id, dealer_id,
                    COUNT(*) as order_count,
                    SUM(quantity) as total_qty
                FROM orders o
                WHERE manufacturer_id IS NOT NULL {date_clause}
                GROUP BY manufacturer_id, transporter_id, dealer_id
                LIMIT 100
            """)).fetchall()
            edges = []
            for r in edge_rows:
                mfg, trans, dlr = str(r[0] or ''), str(r[1] or ''), str(r[2] or '')
                count, qty = int(r[3] or 0), int(r[4] or 0)
                if mfg and trans:
                    edges.append({'source': mfg, 'target': trans, 'value': count, 'qty': qty})
                if trans and dlr:
                    edges.append({'source': trans, 'target': dlr, 'value': count, 'qty': qty})

            # Sankey flow data: group by entity type
            flow_rows = conn.execute(text(f"""
                SELECT
                    manufacturer_id as source_id,
                    dealer_id as target_id,
                    COUNT(*) as flow_count,
                    SUM(o.quantity) as flow_qty
                FROM orders o
                WHERE manufacturer_id IS NOT NULL AND dealer_id IS NOT NULL {date_clause}
                GROUP BY manufacturer_id, dealer_id
                ORDER BY flow_count DESC
                LIMIT 20
            """)).fetchall()
            sankey_flows = [{
                'source': str(r[0]), 'target': str(r[1]),
                'value': int(r[2] or 0), 'qty': int(r[3] or 0)
            } for r in flow_rows]

            # Bubble chart: partner volume vs risk
            bubble_rows = conn.execute(text("""
                SELECT
                    s.supplier_id, s.name,
                    COALESCE(rs.overall_score, 0.5) as risk_score,
                    COALESCE(rs.delivery_score, 0.5) as delivery,
                    COUNT(DISTINCT o.order_code) as order_count
                FROM suppliers s
                LEFT JOIN supplier_risk_scores rs ON s.supplier_id = rs.supplier_id
                LEFT JOIN orders o ON o.manufacturer_id = s.supplier_id
                GROUP BY s.supplier_id, s.name
            """)).fetchall()
            partner_bubbles = [{
                'id': r[0], 'name': r[1],
                'risk_score': float(r[2] or 0.5),
                'delivery_score': float(r[3] or 0.5),
                'order_count': int(r[4] or 0)
            } for r in bubble_rows]

            # Micro sparklines: orders per entity per day (last 7 days)
            sparkline_rows = conn.execute(text("""
                SELECT
                    strftime('%Y-%m-%d', created_at) as day,
                    manufacturer_id,
                    COUNT(*) as count
                FROM orders
                WHERE manufacturer_id IS NOT NULL
                GROUP BY day, manufacturer_id
                ORDER BY day ASC
                LIMIT 200
            """)).fetchall()
            sparklines_by_entity = {}
            for r in sparkline_rows:
                eid = str(r[1] or '')
                if eid:
                    if eid not in sparklines_by_entity:
                        sparklines_by_entity[eid] = []
                    sparklines_by_entity[eid].append({'day': r[0], 'count': int(r[2] or 0)})
            micro_charts = [{'entity_id': k, 'data': v[:7]} for k, v in list(sparklines_by_entity.items())[:6]]

            return {
                'kpis': {
                    'total_nodes': len(nodes),
                    'total_edges': len(edges),
                    'total_suppliers': len(supplier_nodes),
                    'active_flows': len(sankey_flows)
                },
                'nodes': nodes,
                'edges': edges,
                'sankey_flows': sankey_flows,
                'partner_bubbles': partner_bubbles,
                'micro_charts': micro_charts
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('Failed to get supply chain analytics') from exc


def get_supplier_risk_analytics(date_from: str | None = None, date_to: str | None = None, supplier_id_filter: str | None = None) -> dict:
    """Aggregates all Supplier Risk analytics in one call."""
    try:
        with _engine().connect() as conn:
            sup_filter = ''
            if supplier_id_filter:
                sup_filter = f"AND s.supplier_id = '{supplier_id_filter}'"

            # Supplier risk scores
            risk_rows = conn.execute(text(f"""
                SELECT
                    s.supplier_id, s.name, s.tier,
                    COALESCE(rs.overall_score, 0.5) as overall_score,
                    COALESCE(rs.financial_score, 0.5) as financial_score,
                    COALESCE(rs.geopolitical_score, 0.5) as geopolitical_score,
                    COALESCE(rs.operational_score, 0.5) as operational_score,
                    COALESCE(rs.delivery_score, 0.5) as delivery_score,
                    COALESCE(rs.esg_score, 0.5) as esg_score
                FROM suppliers s
                LEFT JOIN supplier_risk_scores rs ON s.supplier_id = rs.supplier_id
                WHERE 1=1 {sup_filter}
                ORDER BY overall_score DESC
            """)).fetchall()

            suppliers_data = []
            for r in risk_rows:
                overall = float(r[3] or 0.5)
                # Classify risk level
                if overall >= 0.8:
                    risk_level = 'Critical'
                elif overall >= 0.6:
                    risk_level = 'High'
                elif overall >= 0.4:
                    risk_level = 'Medium'
                else:
                    risk_level = 'Low'
                suppliers_data.append({
                    'supplier_id': r[0],
                    'name': r[1],
                    'tier': int(r[2] or 1),
                    'overall_score': overall,
                    'financial_score': float(r[4] or 0.5),
                    'geopolitical_score': float(r[5] or 0.5),
                    'operational_score': float(r[6] or 0.5),
                    'delivery_score': float(r[7] or 0.5),
                    'esg_score': float(r[8] or 0.5),
                    'risk_level': risk_level
                })

            # On-time delivery performance per supplier from shipments/orders
            ontime_rows = conn.execute(text("""
                SELECT
                    o.manufacturer_id as supplier_id,
                    COUNT(*) as total_deliveries,
                    SUM(CASE WHEN s.delay_risk_score IS NULL OR s.delay_risk_score < 0.3 THEN 1 ELSE 0 END) as on_time
                FROM orders o
                LEFT JOIN shipments s ON o.shipment_id = s.shipment_id
                WHERE o.manufacturer_id IS NOT NULL
                GROUP BY o.manufacturer_id
            """)).fetchall()
            ontime_by_supplier = {}
            for r in ontime_rows:
                total = int(r[1] or 0)
                on_time = int(r[2] or 0)
                ontime_pct = round((on_time / total * 100) if total > 0 else 0, 1)
                ontime_by_supplier[str(r[0])] = {'total': total, 'on_time': on_time, 'pct': ontime_pct}

            # Enrich suppliers with on-time data
            for s in suppliers_data:
                ot = ontime_by_supplier.get(s['supplier_id'], {'total': 0, 'on_time': 0, 'pct': 0})
                s['on_time_pct'] = ot['pct']
                s['total_deliveries'] = ot['total']

            # Dispute counts per supplier
            dispute_rows = conn.execute(text("""
                SELECT o.manufacturer_id, COUNT(*) as disputes
                FROM orders o
                WHERE o.discrepancy_status IS NOT NULL AND o.manufacturer_id IS NOT NULL
                GROUP BY o.manufacturer_id
            """)).fetchall()
            disputes_by_supplier = {str(r[0]): int(r[1] or 0) for r in dispute_rows}
            for s in suppliers_data:
                s['dispute_count'] = disputes_by_supplier.get(s['supplier_id'], 0)

            # Distribution data for violin (overall_score distribution)
            all_scores = [s['overall_score'] for s in suppliers_data]

            # Radar data for first supplier (or selected)
            radar_data = []
            if suppliers_data:
                s = suppliers_data[0]
                radar_data = [
                    {'axis': 'Financial', 'value': round(s['financial_score'] * 100, 1)},
                    {'axis': 'Geopolitical', 'value': round(s['geopolitical_score'] * 100, 1)},
                    {'axis': 'Operational', 'value': round(s['operational_score'] * 100, 1)},
                    {'axis': 'Delivery', 'value': round(s['delivery_score'] * 100, 1)},
                    {'axis': 'ESG', 'value': round(s['esg_score'] * 100, 1)}
                ]

            return {
                'kpis': {
                    'total_suppliers': len(suppliers_data),
                    'critical_suppliers': sum(1 for s in suppliers_data if s['risk_level'] == 'Critical'),
                    'high_risk': sum(1 for s in suppliers_data if s['risk_level'] == 'High'),
                    'avg_on_time_pct': round(sum(s['on_time_pct'] for s in suppliers_data) / len(suppliers_data), 1) if suppliers_data else 0
                },
                'suppliers': suppliers_data,
                'radar_data': radar_data,
                'all_scores': all_scores
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('Failed to get supplier risk analytics') from exc


def get_financial_analytics(date_from: str | None = None, date_to: str | None = None, entity_type_filter: str | None = None) -> dict:
    """Aggregates all Financial Ledger analytics in one call."""
    try:
        with _engine().connect() as conn:
            date_clause = ''
            if date_from:
                date_clause += f" AND fl.created_at >= '{date_from}'"
            if date_to:
                date_clause += f" AND fl.created_at <= '{date_to}'"

            entity_clause = ''
            if entity_type_filter and entity_type_filter != 'all':
                entity_clause = f" AND fl.entity_type = '{entity_type_filter}'"

            # Revenue vs cost by month
            rev_cost_rows = conn.execute(text(f"""
                SELECT
                    strftime('%Y-%m', fl.created_at) as month,
                    SUM(CASE WHEN fl.transaction_type IN ('sale', 'revenue', 'SALE', 'REVENUE') THEN fl.base_amount_inr ELSE 0 END) as revenue,
                    COALESCE((
                        SELECT SUM(cl.total_cost)
                        FROM cost_ledger cl
                        WHERE strftime('%Y-%m', cl.created_at) = strftime('%Y-%m', fl.created_at)
                    ), 0) as total_cost
                FROM financial_ledger fl
                WHERE 1=1 {date_clause} {entity_clause}
                GROUP BY month
                ORDER BY month ASC
                LIMIT 12
            """)).fetchall()

            rev_cost = []
            for r in rev_cost_rows:
                if r[0]:
                    rev = float(r[1] or 0)
                    cost = float(r[2] or 0)
                    profit = rev - cost
                    margin = round((profit / rev * 100) if rev > 0 else 0, 1)
                    rev_cost.append({
                        'month': r[0], 'revenue': round(rev, 2),
                        'cost': round(cost, 2), 'profit': round(profit, 2),
                        'margin': margin
                    })

            # If no data from financial_ledger, try orders + products
            if not rev_cost:
                fallback_rows = conn.execute(text("""
                    SELECT
                        strftime('%Y-%m', o.created_at) as month,
                        SUM(p.price * o.quantity) as revenue,
                        COALESCE(SUM(cl.total_cost), SUM(p.price * o.quantity) * 0.65) as cost
                    FROM orders o
                    JOIN products p ON o.product_sku = p.sku
                    LEFT JOIN cost_ledger cl ON o.order_code = cl.order_id
                    GROUP BY month
                    ORDER BY month ASC
                    LIMIT 12
                """)).fetchall()
                for r in fallback_rows:
                    if r[0]:
                        rev = float(r[1] or 0)
                        cost = float(r[2] or rev * 0.65)
                        profit = rev - cost
                        margin = round((profit / rev * 100) if rev > 0 else 0, 1)
                        rev_cost.append({
                            'month': r[0], 'revenue': round(rev, 2),
                            'cost': round(cost, 2), 'profit': round(profit, 2),
                            'margin': margin
                        })

            # Cost breakdown by category (from cost_ledger)
            cost_breakdown_rows = conn.execute(text("""
                SELECT
                    strftime('%Y-%m', created_at) as month,
                    SUM(transport_cost) as transport,
                    SUM(storage_cost) as storage,
                    SUM(handling_cost) as handling,
                    SUM(delay_penalty) as delay_penalty,
                    SUM(other_cost) as other
                FROM cost_ledger
                GROUP BY month
                ORDER BY month ASC
                LIMIT 12
            """)).fetchall()
            cost_breakdown = [{
                'month': r[0],
                'Transportation': round(float(r[1] or 0), 2),
                'Warehouse': round(float(r[2] or 0), 2),
                'Handling': round(float(r[3] or 0), 2),
                'Procurement': round(float(r[4] or 0), 2),
                'Other': round(float(r[5] or 0), 2)
            } for r in cost_breakdown_rows if r[0]]

            # Totals for donut
            cost_totals_row = conn.execute(text("""
                SELECT
                    SUM(transport_cost) as transport,
                    SUM(storage_cost) as storage,
                    SUM(handling_cost) as handling,
                    SUM(delay_penalty) as delay_penalty,
                    SUM(other_cost) as other
                FROM cost_ledger
            """)).fetchone()
            cost_totals = {
                'Transportation': round(float(cost_totals_row[0] or 0), 2),
                'Warehouse': round(float(cost_totals_row[1] or 0), 2),
                'Handling': round(float(cost_totals_row[2] or 0), 2),
                'Procurement': round(float(cost_totals_row[3] or 0), 2),
                'Other': round(float(cost_totals_row[4] or 0), 2)
            }

            # Ledger verification: use invoices + settlements
            # Verified = invoice has a settlement with status 'settled'
            # Pending = invoice status pending
            # Disputed = disputes table
            # Failed = invoice status failed/rejected
            verification_rows = conn.execute(text("""
                SELECT
                    CASE
                        WHEN i.status IN ('settled', 'paid', 'SETTLED', 'PAID') THEN 'Verified'
                        WHEN i.status IN ('pending', 'PENDING') THEN 'Pending'
                        WHEN i.status IN ('disputed', 'DISPUTED') THEN 'Disputed'
                        WHEN i.status IN ('failed', 'rejected', 'FAILED', 'REJECTED') THEN 'Failed'
                        ELSE 'Pending'
                    END as v_status,
                    COUNT(*) as count,
                    SUM(i.amount) as total_amount
                FROM invoices i
                GROUP BY v_status
            """)).fetchall()
            verification_summary = [{
                'status': r[0], 'count': int(r[1] or 0), 'amount': round(float(r[2] or 0), 2)
            } for r in verification_rows]

            # If no invoices, use financial_ledger transaction_types as proxy
            if not verification_summary:
                txn_rows = conn.execute(text("""
                    SELECT transaction_type, COUNT(*) as count, SUM(base_amount_inr) as total
                    FROM financial_ledger
                    GROUP BY transaction_type
                    ORDER BY count DESC
                    LIMIT 10
                """)).fetchall()
                # Map transaction types to verification statuses
                status_map = {'settled': 'Verified', 'sale': 'Verified', 'SALE': 'Verified',
                              'pending': 'Pending', 'PENDING': 'Pending',
                              'dispute': 'Disputed', 'failed': 'Failed'}
                for r in txn_rows:
                    v_status = status_map.get(r[0], 'Pending')
                    verification_summary.append({
                        'status': v_status, 'count': int(r[1] or 0), 'amount': round(float(r[2] or 0), 2)
                    })

            # Verification trend by month
            verif_trend_rows = conn.execute(text("""
                SELECT
                    strftime('%Y-%m', issued_at) as month,
                    SUM(CASE WHEN status IN ('settled', 'paid') THEN 1 ELSE 0 END) as verified,
                    SUM(CASE WHEN status IN ('pending') THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status IN ('disputed') THEN 1 ELSE 0 END) as disputed,
                    SUM(CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END) as failed
                FROM invoices
                GROUP BY month
                ORDER BY month ASC
                LIMIT 12
            """)).fetchall()
            verification_trend = [{
                'month': r[0],
                'Verified': int(r[1] or 0), 'Pending': int(r[2] or 0),
                'Disputed': int(r[3] or 0), 'Failed': int(r[4] or 0)
            } for r in verif_trend_rows if r[0]]

            # Verification by entity
            verif_entity_rows = conn.execute(text("""
                SELECT
                    fl.entity_type,
                    COUNT(*) as total_txns,
                    SUM(CASE WHEN i.status IN ('settled','paid') THEN 1 ELSE 0 END) as verified
                FROM financial_ledger fl
                LEFT JOIN invoices i ON fl.entity_id = i.order_id
                GROUP BY fl.entity_type
                ORDER BY total_txns DESC
                LIMIT 10
            """)).fetchall()
            verification_by_entity = [{
                'entity': r[0] or 'Unknown',
                'total': int(r[1] or 0),
                'verified': int(r[2] or 0)
            } for r in verif_entity_rows]

            # Waterfall data from rev_cost
            waterfall = []
            if rev_cost:
                total_rev = sum(m['revenue'] for m in rev_cost)
                total_cost = sum(m['cost'] for m in rev_cost)
                total_profit = total_rev - total_cost
                waterfall = [
                    {'name': 'Revenue', 'value': round(total_rev, 2), 'type': 'revenue'},
                    {'name': 'Total Costs', 'value': round(-total_cost, 2), 'type': 'cost'},
                    {'name': 'Net Profit', 'value': round(total_profit, 2), 'type': 'profit' if total_profit >= 0 else 'negative'}
                ]

            # KPIs
            total_rev_all = sum(m['revenue'] for m in rev_cost)
            total_cost_all = sum(m['cost'] for m in rev_cost)
            total_profit_all = total_rev_all - total_cost_all
            avg_margin = round((total_profit_all / total_rev_all * 100) if total_rev_all > 0 else 0, 1)

            return {
                'kpis': {
                    'total_revenue': round(total_rev_all, 2),
                    'total_cost': round(total_cost_all, 2),
                    'total_profit': round(total_profit_all, 2),
                    'avg_margin': avg_margin
                },
                'revenue_cost_trend': rev_cost,
                'waterfall': waterfall,
                'cost_breakdown_monthly': cost_breakdown,
                'cost_totals': cost_totals,
                'verification_summary': verification_summary,
                'verification_trend': verification_trend,
                'verification_by_entity': verification_by_entity
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('Failed to get financial analytics') from exc

def get_mfg_dashboard_analytics(date_from=None, date_to=None, sku_filter=None):
    """Dashboard: production output trend, orders by status, completion donut, KPIs."""
    try:
        with _engine().connect() as conn:
            dc = f"AND created_at >= '{date_from}'" if date_from else ""
            dc += f" AND created_at <= '{date_to}'" if date_to else ""
            sc = f"AND sku = '{sku_filter}'" if sku_filter else ""

            # KPIs
            kpi = conn.execute(text(f"""
                SELECT COUNT(*) as total,
                    SUM(CASE WHEN status='STARTED' OR status='CREATED' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) as completed,
                    SUM(quantity) as total_qty,
                    SUM(CASE WHEN status='COMPLETED' THEN quantity ELSE 0 END) as completed_qty
                FROM production_orders WHERE 1=1 {dc} {sc}
            """)).fetchone()

            # Production output trend by day
            trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', created_at) as day,
                    SUM(CASE WHEN status IN ('STARTED','COMPLETED') THEN quantity ELSE 0 END) as started_qty,
                    SUM(CASE WHEN status='COMPLETED' THEN quantity ELSE 0 END) as completed_qty
                FROM production_orders WHERE 1=1 {dc} {sc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            # Orders by status
            by_status = conn.execute(text(f"""
                SELECT status, COUNT(*) as count, SUM(quantity) as total_qty
                FROM production_orders WHERE 1=1 {dc} {sc}
                GROUP BY status ORDER BY count DESC
            """)).fetchall()

            total = int(kpi[0] or 0)
            completed = int(kpi[2] or 0)
            completion_rate = round((completed / total * 100) if total > 0 else 0, 1)

            return {
                'kpis': {'total_orders': total, 'active_orders': int(kpi[1] or 0),
                         'completed_orders': completed, 'total_qty': int(kpi[3] or 0),
                         'completed_qty': int(kpi[4] or 0), 'completion_rate': completion_rate},
                'output_trend': [{'day': r[0], 'started_qty': int(r[1] or 0), 'completed_qty': int(r[2] or 0)} for r in trend if r[0]],
                'by_status': [{'status': r[0], 'count': int(r[1] or 0), 'total_qty': int(r[2] or 0)} for r in by_status],
                'completion_rate': completion_rate
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg dashboard analytics failed') from exc


def get_mfg_production_analytics(date_from=None, date_to=None, sku_filter=None, status_filter=None):
    """Production: gantt data, status+QA stacked, quantity trend."""
    try:
        with _engine().connect() as conn:
            dc = f"AND created_at >= '{date_from}'" if date_from else ""
            dc += f" AND created_at <= '{date_to}'" if date_to else ""
            sc = f"AND sku = '{sku_filter}'" if sku_filter else ""
            stc = f"AND status = '{status_filter}'" if status_filter else ""

            # Gantt/timeline: orders with dates
            gantt = conn.execute(text(f"""
                SELECT order_id, sku, quantity, status, qa_status,
                    start_date, end_date, created_at
                FROM production_orders WHERE 1=1 {dc} {sc} {stc}
                ORDER BY created_at DESC LIMIT 50
            """)).fetchall()

            # Status x QA stacked
            stacked = conn.execute(text(f"""
                SELECT status, qa_status, COUNT(*) as count, SUM(quantity) as qty
                FROM production_orders WHERE 1=1 {dc} {sc}
                GROUP BY status, qa_status ORDER BY status, qa_status
            """)).fetchall()

            # Quantity trend
            qty_trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', created_at) as day,
                    SUM(CASE WHEN status='STARTED' THEN quantity ELSE 0 END) as started,
                    SUM(CASE WHEN status='COMPLETED' THEN quantity ELSE 0 END) as completed
                FROM production_orders WHERE 1=1 {dc} {sc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            gantt_data = []
            for r in gantt:
                gantt_data.append({
                    'order_id': r[0], 'sku': r[1], 'quantity': int(r[2] or 0),
                    'status': r[3], 'qa_status': r[4],
                    'start_date': str(r[5]) if r[5] else str(r[7]),
                    'end_date': str(r[6]) if r[6] else None,
                    'created_at': str(r[7])
                })

            # Pivot stacked for chart
            stacked_pivot = {}
            for r in stacked:
                st = r[0]
                if st not in stacked_pivot:
                    stacked_pivot[st] = {'status': st, 'PENDING': 0, 'PASSED': 0, 'FAILED': 0, 'total_qty': 0}
                stacked_pivot[st][r[1]] = int(r[2] or 0)
                stacked_pivot[st]['total_qty'] += int(r[3] or 0)

            return {
                'gantt_data': gantt_data,
                'status_qa_stacked': list(stacked_pivot.values()),
                'qty_trend': [{'day': r[0], 'started': int(r[1] or 0), 'completed': int(r[2] or 0)} for r in qty_trend if r[0]]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg production analytics failed') from exc


def get_mfg_forecast_analytics(date_from=None, date_to=None, sku_filter=None):
    """AI Forecast: demand from orders (actual only - no fake forecast). Demand by SKU, trend."""
    try:
        with _engine().connect() as conn:
            dc = f"AND created_at >= '{date_from}'" if date_from else ""
            dc += f" AND created_at <= '{date_to}'" if date_to else ""
            sc = f"AND product_sku = '{sku_filter}'" if sku_filter else ""

            # Demand trend by day
            trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', created_at) as day,
                    SUM(quantity) as demand_qty, COUNT(*) as order_count
                FROM orders WHERE 1=1 {dc} {sc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            # Demand by SKU
            by_sku = conn.execute(text(f"""
                SELECT product_sku, SUM(quantity) as demand_qty, COUNT(*) as order_count
                FROM orders WHERE 1=1 {dc}
                GROUP BY product_sku ORDER BY demand_qty DESC LIMIT 20
            """)).fetchall()

            # Historical trend (last 12 weeks aggregated)
            hist = conn.execute(text(f"""
                SELECT strftime('%Y-%W', created_at) as week,
                    SUM(quantity) as demand_qty
                FROM orders WHERE 1=1 {sc}
                GROUP BY week ORDER BY week ASC LIMIT 24
            """)).fetchall()

            kpi_row = conn.execute(text(f"""
                SELECT COUNT(*) as orders, SUM(quantity) as total_demand,
                    COUNT(DISTINCT product_sku) as unique_skus
                FROM orders WHERE 1=1 {dc} {sc}
            """)).fetchone()

            return {
                'kpis': {'total_orders': int(kpi_row[0] or 0), 'total_demand': int(kpi_row[1] or 0), 'unique_skus': int(kpi_row[2] or 0)},
                'demand_trend': [{'day': r[0], 'demand_qty': int(r[1] or 0), 'order_count': int(r[2] or 0)} for r in trend if r[0]],
                'demand_by_sku': [{'sku': r[0], 'demand_qty': int(r[1] or 0), 'order_count': int(r[2] or 0)} for r in by_sku if r[0]],
                'historical_trend': [{'week': r[0], 'demand_qty': int(r[1] or 0)} for r in hist if r[0]]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg forecast analytics failed') from exc


def get_mfg_materials_analytics(sku_filter=None):
    """Materials: stacked stock position, stock movements, heatmap risk."""
    try:
        with _engine().connect() as conn:
            sc = f"WHERE sku = '{sku_filter}'" if sku_filter else ""

            # Stock position per SKU
            stock = conn.execute(text(f"""
                SELECT sku, name, available_stock, reserved_stock, in_transit,
                    reorder_point, quantity, price
                FROM products {sc}
                ORDER BY available_stock ASC LIMIT 30
            """)).fetchall()

            # Stock movements history (last 30)
            movements = conn.execute(text("""
                SELECT strftime('%Y-%m-%d', created_at) as day, sku,
                    SUM(CASE WHEN movement_type IN ('IN','RECEIPT','RESTOCK') THEN quantity ELSE 0 END) as stock_in,
                    SUM(CASE WHEN movement_type IN ('OUT','SALE','DISPATCH') THEN quantity ELSE 0 END) as stock_out
                FROM stock_movements
                GROUP BY day, sku ORDER BY day ASC LIMIT 200
            """)).fetchall()

            items = []
            for r in stock:
                avail = int(r[2] or 0)
                reorder = int(r[5] or 0)
                risk = 'Critical' if avail <= 0 else 'At Risk' if avail <= reorder else 'Healthy'
                items.append({
                    'sku': r[0], 'name': r[1], 'available': avail,
                    'reserved': int(r[3] or 0), 'in_transit': int(r[4] or 0),
                    'reorder_point': reorder, 'total_qty': int(r[6] or 0),
                    'price': float(r[7] or 0), 'risk': risk
                })

            # If no stock movements, fall back to current stock vs reorder comparison
            mv_data = [{'day': r[0], 'sku': r[1], 'stock_in': int(r[2] or 0), 'stock_out': int(r[3] or 0)} for r in movements if r[0]]
            has_movements = len(mv_data) > 0

            return {
                'kpis': {
                    'total_skus': len(items),
                    'at_risk': sum(1 for i in items if i['risk'] in ('At Risk', 'Critical')),
                    'critical': sum(1 for i in items if i['risk'] == 'Critical'),
                    'total_value': round(sum(i['available'] * i['price'] for i in items), 2)
                },
                'stock_items': items,
                'stock_movements': mv_data,
                'has_movements': has_movements
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg materials analytics failed') from exc


def get_mfg_quality_analytics(date_from=None, date_to=None, sku_filter=None):
    """QA: pass/fail trend, defect pareto, result donut."""
    try:
        with _engine().connect() as conn:
            dc = f"AND qi.created_at >= '{date_from}'" if date_from else ""
            dc += f" AND qi.created_at <= '{date_to}'" if date_to else ""
            sc = f"AND po.sku = '{sku_filter}'" if sku_filter else ""

            # Pass/fail trend
            trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', qi.created_at) as day,
                    SUM(qi.quantity_passed) as passed,
                    SUM(qi.quantity_failed) as failed,
                    SUM(qi.quantity_inspected) as inspected
                FROM quality_inspections qi
                JOIN production_orders po ON qi.production_order_id = po.order_id
                WHERE 1=1 {dc} {sc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            # Defect pareto
            pareto = conn.execute(text(f"""
                SELECT qi.defect_type, SUM(qi.quantity_failed) as defect_count
                FROM quality_inspections qi
                JOIN production_orders po ON qi.production_order_id = po.order_id
                WHERE qi.defect_type IS NOT NULL AND qi.quantity_failed > 0 {dc.replace('AND qi.', 'AND qi.')} {sc}
                GROUP BY qi.defect_type ORDER BY defect_count DESC LIMIT 15
            """)).fetchall()

            # Overall totals
            totals = conn.execute(text(f"""
                SELECT SUM(qi.quantity_passed) as total_passed,
                    SUM(qi.quantity_failed) as total_failed,
                    SUM(qi.quantity_inspected) as total_inspected,
                    COUNT(*) as total_inspections
                FROM quality_inspections qi
                JOIN production_orders po ON qi.production_order_id = po.order_id
                WHERE 1=1 {dc} {sc}
            """)).fetchone()

            tp = int(totals[0] or 0)
            tf = int(totals[1] or 0)
            ti = int(totals[2] or 0)
            pass_rate = round((tp / (tp + tf) * 100) if (tp + tf) > 0 else 0, 1)
            defect_rate = round((tf / ti * 100) if ti > 0 else 0, 1)

            # Build pareto with cumulative %
            pareto_data = []
            total_defects = sum(int(r[1] or 0) for r in pareto)
            cum = 0
            for r in pareto:
                cnt = int(r[1] or 0)
                cum += cnt
                pareto_data.append({
                    'defect_type': r[0] or 'Unknown',
                    'count': cnt,
                    'cumulative_pct': round((cum / total_defects * 100) if total_defects > 0 else 0, 1)
                })

            return {
                'kpis': {'total_passed': tp, 'total_failed': tf, 'total_inspected': ti,
                         'total_inspections': int(totals[3] or 0),
                         'pass_rate': pass_rate, 'defect_rate': defect_rate},
                'pass_fail_trend': [{'day': r[0], 'passed': int(r[1] or 0), 'failed': int(r[2] or 0), 'inspected': int(r[3] or 0)} for r in trend if r[0]],
                'defect_pareto': pareto_data,
                'result_donut': [{'status': 'Passed', 'count': tp}, {'status': 'Failed', 'count': tf}]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg quality analytics failed') from exc


def get_mfg_ledger_analytics(date_from=None, date_to=None):
    """Financial Ledger: dispatch value, waybill composition, trend. Uses waybill_documents + production_orders."""
    try:
        with _engine().connect() as conn:
            dc = f"AND wd.created_at >= '{date_from}'" if date_from else ""
            dc += f" AND wd.created_at <= '{date_to}'" if date_to else ""

            # Waterfall: value of completed vs dispatched orders (price * quantity)
            value_rows = conn.execute(text(f"""
                SELECT po.status,
                    SUM(po.quantity * COALESCE(p.price, 0)) as value,
                    COUNT(*) as count
                FROM production_orders po
                LEFT JOIN products p ON po.sku = p.sku
                GROUP BY po.status ORDER BY po.status
            """)).fetchall()

            waterfall = [{'name': r[0], 'value': round(float(r[1] or 0), 2), 'count': int(r[2] or 0)} for r in value_rows]

            # Waybill status composition
            wb_status = conn.execute(text(f"""
                SELECT wd.status, COUNT(*) as count
                FROM waybill_documents wd WHERE 1=1 {dc}
                GROUP BY wd.status ORDER BY count DESC
            """)).fetchall()

            # Dispatch trend by day
            dispatch_trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', wd.created_at) as day, COUNT(*) as dispatches
                FROM waybill_documents wd WHERE 1=1 {dc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            kpi = conn.execute(text("""
                SELECT COUNT(*) as total_waybills,
                    SUM(CASE WHEN status='DELIVERED' THEN 1 ELSE 0 END) as delivered
                FROM waybill_documents
            """)).fetchone()

            return {
                'kpis': {'total_waybills': int(kpi[0] or 0), 'delivered': int(kpi[1] or 0)},
                'waterfall': waterfall,
                'waybill_composition': [{'status': r[0], 'count': int(r[1] or 0)} for r in wb_status],
                'dispatch_trend': [{'day': r[0], 'dispatches': int(r[1] or 0)} for r in dispatch_trend if r[0]]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg ledger analytics failed') from exc


def get_mfg_alerts_analytics(severity_filter=None, date_from=None, date_to=None):
    """Alert Center: by severity, trend, status donut. Uses issues table."""
    try:
        with _engine().connect() as conn:
            dc = f"AND created_at >= '{date_from}'" if date_from else ""
            dc += f" AND created_at <= '{date_to}'" if date_to else ""
            sev = f"AND severity = '{severity_filter}'" if severity_filter else ""

            by_severity = conn.execute(text(f"""
                SELECT severity, COUNT(*) as count
                FROM issues WHERE 1=1 {dc} {sev}
                GROUP BY severity ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
            """)).fetchall()

            trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count
                FROM issues WHERE 1=1 {dc} {sev}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            by_status = conn.execute(text(f"""
                SELECT status, COUNT(*) as count
                FROM issues WHERE 1=1 {dc} {sev}
                GROUP BY status ORDER BY count DESC
            """)).fetchall()

            kpi = conn.execute(text(f"""
                SELECT COUNT(*) as total,
                    SUM(CASE WHEN severity='CRITICAL' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN status='OPEN' THEN 1 ELSE 0 END) as open_count
                FROM issues WHERE 1=1 {dc}
            """)).fetchone()

            return {
                'kpis': {'total': int(kpi[0] or 0), 'critical': int(kpi[1] or 0), 'open': int(kpi[2] or 0)},
                'by_severity': [{'severity': r[0], 'count': int(r[1] or 0)} for r in by_severity],
                'trend': [{'day': r[0], 'count': int(r[1] or 0)} for r in trend if r[0]],
                'by_status': [{'status': r[0], 'count': int(r[1] or 0)} for r in by_status]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg alerts analytics failed') from exc


def get_mfg_disputes_analytics(status_filter=None, date_from=None, date_to=None):
    """Dispute Center: lifecycle funnel, by type, trend. Uses disputes table."""
    try:
        with _engine().connect() as conn:
            dc = f"AND created_at >= '{date_from}'" if date_from else ""
            dc += f" AND created_at <= '{date_to}'" if date_to else ""
            stc = f"AND status = '{status_filter}'" if status_filter else ""

            # Lifecycle funnel (status counts in order)
            funnel_order = "CASE status WHEN 'OPEN' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'RESOLVED' THEN 3 WHEN 'CLOSED' THEN 4 ELSE 5 END"
            funnel = conn.execute(text(f"""
                SELECT status, COUNT(*) as count
                FROM disputes WHERE 1=1 {dc}
                GROUP BY status ORDER BY {funnel_order}
            """)).fetchall()

            # By mismatch_type (dispute type)
            by_type = conn.execute(text(f"""
                SELECT mismatch_type, COUNT(*) as count
                FROM disputes WHERE 1=1 {dc} {stc}
                GROUP BY mismatch_type ORDER BY count DESC LIMIT 10
            """)).fetchall()

            # Trend by day
            trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count
                FROM disputes WHERE 1=1 {dc} {stc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            kpi = conn.execute(text(f"""
                SELECT COUNT(*) as total,
                    SUM(CASE WHEN status='OPEN' THEN 1 ELSE 0 END) as open_count,
                    SUM(CASE WHEN status='RESOLVED' OR status='CLOSED' THEN 1 ELSE 0 END) as resolved
                FROM disputes WHERE 1=1 {dc}
            """)).fetchone()

            return {
                'kpis': {'total': int(kpi[0] or 0), 'open': int(kpi[1] or 0), 'resolved': int(kpi[2] or 0)},
                'lifecycle_funnel': [{'stage': r[0], 'count': int(r[1] or 0)} for r in funnel],
                'by_type': [{'type': r[0] or 'Unknown', 'count': int(r[1] or 0)} for r in by_type],
                'trend': [{'day': r[0], 'count': int(r[1] or 0)} for r in trend if r[0]]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg disputes analytics failed') from exc


def get_mfg_batch_analytics(date_from=None, date_to=None):
    """Batch Traceability: sankey/flow (batch journey), status donut, volume trend."""
    try:
        with _engine().connect() as conn:
            dc = f"AND po.created_at >= '{date_from}'" if date_from else ""
            dc += f" AND po.created_at <= '{date_to}'" if date_to else ""

            # Batch journey: production -> QA -> dispatch
            # Flow: count of batches per transition
            flow_data = conn.execute(text(f"""
                SELECT po.status as prod_status,
                    po.qa_status,
                    COUNT(*) as batch_count,
                    SUM(po.quantity) as total_qty
                FROM production_orders po
                WHERE 1=1 {dc}
                GROUP BY po.status, po.qa_status
                ORDER BY prod_status, qa_status
            """)).fetchall()

            # Batch status donut
            batch_status = conn.execute(text(f"""
                SELECT status, COUNT(*) as count, SUM(quantity) as qty
                FROM production_orders WHERE 1=1 {dc.replace('po.', '')}
                GROUP BY status
            """)).fetchall()

            # Volume trend
            vol_trend = conn.execute(text(f"""
                SELECT strftime('%Y-%m-%d', po.created_at) as day,
                    COUNT(*) as batch_count, SUM(po.quantity) as qty
                FROM production_orders po WHERE 1=1 {dc}
                GROUP BY day ORDER BY day ASC LIMIT 30
            """)).fetchall()

            # Waybill flow (dispatch tracking)
            waybill_flow = conn.execute(text("""
                SELECT status, COUNT(*) as count
                FROM waybill_documents GROUP BY status ORDER BY count DESC
            """)).fetchall()

            # Build sankey nodes and links
            # Nodes: Production statuses -> QA statuses -> Dispatch statuses
            sankey_links = []
            for r in flow_data:
                prod_s = f"Production: {r[0]}"
                qa_s = f"QA: {r[1]}"
                cnt = int(r[2] or 0)
                qty = int(r[3] or 0)
                if cnt > 0:
                    sankey_links.append({'source': prod_s, 'target': qa_s, 'value': cnt, 'qty': qty})

            for r in waybill_flow:
                sankey_links.append({'source': 'QA: PASSED', 'target': f"Dispatch: {r[0]}", 'value': int(r[1] or 0), 'qty': 0})

            kpi = conn.execute(text("""
                SELECT COUNT(*) as total_batches, COUNT(DISTINCT batch_id) as unique_batches,
                    SUM(quantity) as total_qty
                FROM production_orders
            """)).fetchone()

            return {
                'kpis': {'total_batches': int(kpi[0] or 0), 'unique_batches': int(kpi[1] or 0), 'total_qty': int(kpi[2] or 0)},
                'sankey_links': sankey_links,
                'batch_status': [{'status': r[0], 'count': int(r[1] or 0), 'qty': int(r[2] or 0)} for r in batch_status],
                'volume_trend': [{'day': r[0], 'batch_count': int(r[1] or 0), 'qty': int(r[2] or 0)} for r in vol_trend if r[0]]
            }
    except SQLAlchemyError as exc:
        raise DatabaseError('mfg batch analytics failed') from exc


def record_ledger_entry(
    entity_type: str,
    entity_id: str,
    transaction_type: str,
    amount: float,
    currency: str = "USD",
    exchange_rate: float = 1.0,
    seal_hash: str | None = None
) -> dict:
    try:
        now = _utc_now()
        base_amount_inr = amount * exchange_rate
        
        with _engine().begin() as conn:
            prev_row = conn.execute(
                select(financial_ledger_table.c.ledger_hash)
                .order_by(desc(financial_ledger_table.c.id))
            ).first()
            
            previous_ledger_hash = prev_row[0] if prev_row else None
            
            hash_input = f"{previous_ledger_hash or 'GENESIS'}|{entity_type}|{entity_id}|{transaction_type}|{amount}|{currency}|{exchange_rate}|{base_amount_inr}|{seal_hash or ''}|{now.isoformat()}"
            ledger_hash = hashlib.sha256(hash_input.encode()).hexdigest()
            
            result = conn.execute(
                financial_ledger_table.insert().values(
                    entity_type=entity_type,
                    entity_id=entity_id,
                    transaction_type=transaction_type,
                    amount=amount,
                    currency=currency,
                    exchange_rate=exchange_rate,
                    base_amount_inr=base_amount_inr,
                    seal_hash=seal_hash,
                    ledger_hash=ledger_hash,
                    previous_ledger_hash=previous_ledger_hash,
                    created_at=now
                )
            )
            inserted_id = _inserted_id(result, message="Failed to record ledger entry")
            
            return {
                "id": inserted_id,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "transaction_type": transaction_type,
                "amount": amount,
                "currency": currency,
                "exchange_rate": exchange_rate,
                "base_amount_inr": base_amount_inr,
                "seal_hash": seal_hash,
                "ledger_hash": ledger_hash,
                "previous_ledger_hash": previous_ledger_hash,
                "created_at": now
            }
    except SQLAlchemyError as exc:
        raise DatabaseError("Failed to record ledger entry") from exc
