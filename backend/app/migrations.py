"""Minimal migration helpers to keep the database schema up to date.

This module provides a lightweight migration routine that is executed during
application startup.  It complements the SQLAlchemy model metadata by
materialising new columns in existing databases without requiring the operator
to recreate the schema from scratch.
"""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from .database import Base


def ensure_schema(engine: Engine) -> None:
    """Create missing tables and backfill newly introduced columns."""

    # Ensure all declarative tables exist for fresh installations.
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        inspector = inspect(connection)
        if "orders" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("orders")}

        if "entry_date" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE orders ADD COLUMN entry_date DATE NOT NULL "
                    "DEFAULT (CURRENT_DATE)"
                )
            )
            connection.execute(text("UPDATE orders SET entry_date = DATE(created_at)"))

        if "delivery_date" not in columns:
            connection.execute(
                text("ALTER TABLE orders ADD COLUMN delivery_date DATE")
            )

        # Backfill any rows where entry_date is still missing.
        connection.execute(
            text(
                "UPDATE orders SET entry_date = DATE(created_at) "
                "WHERE entry_date IS NULL"
            )
        )
