from sqlalchemy import select, func, text
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

            reasons_rows = conn.execute(
                select(interventions_table.c.reason, func.count().label("count"))
                .group_by(interventions_table.c.reason)
            ).fetchall()
            
            reasons = [{"reason": str(r[0]), "count": int(r[1])} for r in reasons_rows]

            return {
                "slaRate": sla_rate,
                "delayedCount": delayed,
                "onTimeCount": on_time,
                "delayReasons": sorted(reasons, key=lambda x: x["count"], reverse=True),
                "delayReasonsSource": "interventions" if reasons else "unavailable"
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
                    SELECT strftime('%Y-%m-%d', timestamp) as day, COUNT(*) as count
                    FROM shipments
                    WHERE timestamp >= :since
                    GROUP BY day ORDER BY day ASC
                """), {"since": since.isoformat()}
            ).fetchall()
            volume = [{"day": str(r[0]), "shipments": int(r[1])} for r in vol_rows if r[0]]

            return {
                "volumeTrend": volume,
                "transitTrend": [],
                "transitTrendStatus": "UNAVAILABLE",
                "transitTrendReason": "Shipment schema does not store dispatch and delivery timestamps needed for time-in-transit analytics."
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
            for i, t in enumerate(trucks):
                status = str(t.maintenance_status or "UNKNOWN")
                status_counts[status] = status_counts.get(status, 0) + 1

                utilization.append({
                    "truckId": str(t.plate_number),
                    "loadPercent": float(t.current_load_percent or 0.0),
                    "capacity": float(t.capacity or 0.0),
                    "maintenanceStatus": status
                })

            status_donut = [{"status": k, "count": v} for k, v in status_counts.items()]

            return {
                "status": status_donut,
                "utilization": utilization[:10],
                "ageVsCost": [],
                "ageVsCostStatus": "UNAVAILABLE",
                "ageVsCostReason": "Truck schema does not store vehicle age or maintenance cost."
            }
    except Exception as exc:
        raise DatabaseError("Failed to get fleet analytics") from exc

def get_driver_analytics() -> dict:
    """4. Driver Logs / Maintenance: Bar issues, Line frequency, Radar performance"""
    try:
        with _engine().connect() as conn:
            ints = conn.execute(select(interventions_table)).fetchall()
            drivers = conn.execute(select(drivers_table)).fetchall()
            issue_counts = {}
            for i in ints:
                typ = str(i.action_type)
                issue_counts[typ] = issue_counts.get(typ, 0) + 1
                
            issues = [{"type": k, "count": v} for k, v in issue_counts.items()]
            
            radar = []
            if drivers:
                avg_performance = sum(float(d.performance_score or 0.0) for d in drivers) / len(drivers)
                avg_on_time = sum(float(d.on_time_percent or 0.0) for d in drivers) / len(drivers)
                incident_count = sum(int(d.incident_count or 0) for d in drivers)
                safety_score = max(0.0, 100.0 - (incident_count / max(len(drivers), 1) * 10.0))
                radar = [
                    {"metric": "Safety", "score": round(safety_score, 1)},
                    {"metric": "On-Time", "score": round(avg_on_time, 1)},
                    {"metric": "Performance", "score": round(avg_performance, 1)}
                ]

            return {
                "issues": issues,
                "performance": radar
            }
    except Exception as exc:
        raise DatabaseError("Failed to get driver analytics") from exc
