"""Add order_code and shipment_id to production_orders, order_id to reorder_events

Revision ID: d4f8e2a1c703
Revises: b93c5a963d95
Create Date: 2026-08-27

"""
from __future__ import annotations
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd4f8e2a1c703'
down_revision: Union[str, None] = 'b93c5a963d95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite does not support ALTER TABLE ADD COLUMN for columns with constraints easily,
    # so we use batch_alter_table for compatibility.
    
    with op.batch_alter_table('production_orders') as batch_op:
        batch_op.add_column(sa.Column('order_code', sa.String(80), nullable=True))
        batch_op.add_column(sa.Column('shipment_id', sa.String(80), nullable=True))

    with op.batch_alter_table('reorder_events') as batch_op:
        batch_op.add_column(sa.Column('order_id', sa.String(80), nullable=True))

    # Add qr_verification events column for scanner user tracking
    with op.batch_alter_table('qr_verification_events') as batch_op:
        try:
            batch_op.add_column(sa.Column('location', sa.String(255), nullable=True))
        except Exception:
            pass  # Column may already exist


def downgrade() -> None:
    with op.batch_alter_table('production_orders') as batch_op:
        batch_op.drop_column('shipment_id')
        batch_op.drop_column('order_code')

    with op.batch_alter_table('reorder_events') as batch_op:
        batch_op.drop_column('order_id')

    with op.batch_alter_table('qr_verification_events') as batch_op:
        try:
            batch_op.drop_column('location')
        except Exception:
            pass
