from __future__ import annotations
import logging
from typing import Any
import asyncio
from sqlalchemy import select
from app.services.websocket_manager import manager
from app.services.notification_service import notification_service
from app.services.audit_service import audit_service
from app.services.database_service import _engine, users_table

logger = logging.getLogger("domain_events")

async def emit_event(
    event_type: str,
    payload: dict[str, Any],
    *,
    notify_users: list[str] | None = None,     # specific user_ids
    notify_roles: list[str] | None = None,     # all users of these roles
    ws_roles: list[str] | None = None,         # roles to receive WS broadcast
    notify_title: str = "",
    notify_message: str = "",
    notify_severity: str = "info",
    audit_action: str | None = None,
    audit_user: str = "system",
    audit_role: str = "system",
    audit_entity: str = "",
    audit_entity_id: str = "",
    audit_new_value: dict | None = None,
) -> None:
    try:
        if audit_action:
            audit_service.log_action(
                user_id=audit_user,
                user_role=audit_role,
                action=audit_action,
                entity_type=audit_entity,
                entity_id=audit_entity_id,
                new_value=audit_new_value,
            )

        all_notify_users = set(notify_users) if notify_users else set()

        if notify_roles:
            try:
                engine = _engine()
                with engine.connect() as conn:
                    result = conn.execute(
                        select(users_table.c.id).where(users_table.c.role.in_(notify_roles))
                    )
                    for row in result:
                        all_notify_users.add(str(row[0]))
            except Exception as e:
                logger.error(f"Failed to query users for roles {notify_roles}: {e}")

        for user in all_notify_users:
            notification_service.publish(
                user_id=str(user),
                title=notify_title or event_type,
                message=notify_message or f"Event {event_type} occurred",
                severity=notify_severity,
                metadata=payload
            )

        if ws_roles:
            await manager.broadcast_to_roles(event_type, payload, ws_roles)
        else:
            await manager.broadcast_all(event_type, payload)

    except Exception as e:
        logger.error(f"Error emitting event {event_type}: {e}")

async def _emit_async(*args, **kwargs):
    await emit_event(*args, **kwargs)

def emit_event_sync(
    event_type: str,
    payload: dict[str, Any],
    **kwargs
) -> None:
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_emit_async(event_type, payload, **kwargs))
    except RuntimeError:
        asyncio.run(_emit_async(event_type, payload, **kwargs))
