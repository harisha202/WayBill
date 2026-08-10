import sys

filepath = r"c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\services\database_service.py"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the first definition of `create_audit_log`
idx_create_audit = -1
for i, line in enumerate(lines):
    if line.startswith("def create_audit_log("):
        idx_create_audit = i
        break

# The file from idx_create_audit onwards is a mess of duplicated functions.
# Let's keep lines 0 to idx_create_audit, then append the cleanly formatted 3 functions.
if idx_create_audit != -1:
    content = "".join(lines[:idx_create_audit])
    
    clean_tail = """
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
"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content + clean_tail)
    print("Fixed file.")
else:
    print("Could not find create_audit_log.")
