"""add job status check constraint

Revision ID: b1d2e3f4a5c6
Revises: ac43eefb1e01
Create Date: 2026-07-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1d2e3f4a5c6'
down_revision: Union[str, None] = 'ac43eefb1e01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        'chk_job_status',
        'jobs',
        "status IN ('queued', 'running', 'done', 'error')"
    )


def downgrade() -> None:
    op.drop_constraint('chk_job_status', 'jobs', type_='check')
