"""create events table

Revision ID: 001_create_events_table
Revises: 
Create Date: 2026-05-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_create_events_table'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('events',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),  # ← length=100 eklendi
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),  # ← nullable=False!
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_events_id'), 'events', ['id'], unique=False)
    op.create_index('ix_events_event_type', 'events', ['event_type'], unique=False)
    op.create_index('ix_events_timestamp', 'events', ['timestamp'], unique=False)
    op.create_index('ix_events_user_id', 'events', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_events_user_id', table_name='events')
    op.drop_index('ix_events_timestamp', table_name='events')
    op.create_index('ix_events_event_type', table_name='events')
    op.drop_index(op.f('ix_events_id'), table_name='events')
    op.drop_table('events')