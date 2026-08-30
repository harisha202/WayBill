from sqlalchemy import select, func, text, desc
from app.services.database_service import (
    _engine, _utc_now, DatabaseError,
    shipments_table, trucks_table, drivers_table, interventions_table
)
from datetime import timedelta

def get_transporter_overview_analytics(days: int = 30) -> dict:
    """1. Transport Overview: SLA Gauge, Delay Reasons, KPIs"""
    try:
        with _engine().connect() as conn:
            shipments = conn.execute(select(shipments_table)).fetchall()
            total = len(shipments)
            delayed = len([s for s in shipments if s.delay_risk_score and s.delay_risk_score > 30])
            on_time = total - delayed
            sla_rate = round((on_time / total * 100) if total > 0 else 100, 1)

            # Mocking delay reasons based on interventions
            reasons_rows = conn.execute(
                select(interventions_table.c.reason, func.count().label("count"))
                .group_by(interventions_table.c.reason)
            ).fetchall()
            
            reasons = [{"reason": str(r[0]), "count": int(r[1])} for r in reasons_rows]
            if not reasons:
                reasons = [{"reason": "Traffic", "count": delayed}, {"reason": "Weather", "count": max(0, delayed // 2)}]

            return {
                "slaRate": sla_rate,
                "delayedCount": delayed,
                "onTimeCount": on_time,
                "delayReasons": sorted(reasons, key=lambda x: x["count"], reverse=True)
            }
    except Exception as exc:
        raise DatabaseError("Failed to get transport overview analytics") from exc

def get_shipment_analytics(days: int = 30) -> dict:
    """2. Shipment Analytics: Line volume, Area time-in-transit"""
    since = _utc_now() - timedelta(days=days)
    try:
        with _engine().connect() as conn:
            # Volume Trend
            vol_rows = conn.execute(
                text("""
                    SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count
                    FROM shipments
                    WHERE created_at >= :since
                    GROUP BY day ORDER BY day ASC
                """), {"since": since.isoformat()}
            ).fetchall()
            volume = [{"day": str(r[0]), "shipments": int(r[1])} for r in vol_rows if r[0]]

            # Time in transit (mocked using estimated vs actual if available, else random curve)
            import hashlib
            transit = []
            for i, v in enumerate(volume):
                h = int(hashlib.md5(v["day"].encode()).hexdigest()[:8], 16)
                base_time = 24 + (h % 30)
                transit.append({"day": v["day"], "avgHours": base_time})

            return {
                "volumeTrend": volume,
                "transitTrend": transit
            }
    except Exception as exc:
        raise DatabaseError("Failed to get shipment analytics") from exc

def get_fleet_analytics() -> dict:
    """3. Fleet Management: Donut status, Stacked bar utilization, Scatter age vs cost"""
    try:
        with _engine().connect() as conn:
            trucks = conn.execute(select(trucks_table)).fetchall()
            status_counts = {}
            utilization = []
            scatter = []
            
            import hashlib
            for i, t in enumerate(trucks):
                status = str(t.maintenance_status or "UNKNOWN")
                status_counts[status] = status_counts.get(status, 0) + 1
                
                # Deterministic pseudo-metrics
                plate = str(t.plate_number or f"TRK-{i}").encode()
                h = int(hashlib.md5(plate).hexdigest()[:8], 16)
                
                utilization.append({
                    "truckId": str(t.plate_number),
                    "activeHours": 100 + (h % 60),
                    "idleHours": 20 + (h % 30),
                    "maintenanceHours": 10 if status == "MAINTENANCE" else 0
                })
                scatter.append({
                    "truckId": str(t.plate_number),
                    "ageMonths": 12 + (h % 48),
                    "maintenanceCost": 1000 + (h % 3000)
                })

            status_donut = [{"status": k, "count": v} for k, v in status_counts.items()]

            return {
                "status": status_donut,
                "utilization": utilization[:10], # Top 10
                "ageVsCost": scatter
            }
    except Exception as exc:
        raise DatabaseError("Failed to get fleet analytics") from exc

def get_driver_analytics() -> dict:
    """4. Driver Logs / Maintenance: Bar issues, Line frequency, Radar performance"""
    try:
        with _engine().connect() as conn:
            ints = conn.execute(select(interventions_table)).fetchall()
            issue_counts = {}
            for i in ints:
                typ = str(i.action_type)
                issue_counts[typ] = issue_counts.get(typ, 0) + 1
                
            issues = [{"type": k, "count": v} for k, v in issue_counts.items()]
            
            # Mock Radar for overall performance
            radar = [
                {"metric": "Safety", "score": 85},
                {"metric": "On-Time", "score": 92},
                {"metric": "Fuel Efficiency", "score": 78},
                {"metric": "Compliance", "score": 95},
                {"metric": "Customer Rating", "score": 88}
            ]

            return {
                "issues": issues,
                "performance": radar
            }
    except Exception as exc:
        raise DatabaseError("Failed to get driver analytics") from exc
