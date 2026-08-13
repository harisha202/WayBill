from __future__ import annotations
import json
from datetime import datetime, timezone
from sqlalchemy import insert
from app.services.database_service import _engine, audit_logs_table

class AuditService:
    @staticmethod
    def log_action(
        user: str,
        role: str,
        action: str,
        entity: str,
        entity_id: str,
        old_value: dict | None = None,
        new_value: dict | None = None,
        metadata: dict | None = None
    ) -> None:
        """
        Logs a mutation action to the audit_logs_table.
        """
        timestamp = datetime.now(timezone.utc)
        
        # Ensure values are JSON serializable dictionaries or None
        if old_value is not None and not isinstance(old_value, dict):
            old_value = {"value": str(old_value)}
        if new_value is not None and not isinstance(new_value, dict):
            new_value = {"value": str(new_value)}
        if metadata is None:
            metadata = {}

        with _engine().begin() as conn:
            conn.execute(
                insert(audit_logs_table).values(
                    user=user,
                    role=role,
                    action=action,
                    entity=entity,
                    entity_id=entity_id,
                    old_value=old_value,
                    new_value=new_value,
                    metadata=metadata,
                    timestamp=timestamp
                )
            )

audit_service = AuditService()
