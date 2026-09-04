"""merge multiple heads

Revision ID: 5917b4b08435
Revises: 9e1f11b3b63a, d4f8e2a1c703
Create Date: 2026-09-01 13:00:19.902790

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5917b4b08435'
down_revision: Union[str, None] = ('9e1f11b3b63a', 'd4f8e2a1c703')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
