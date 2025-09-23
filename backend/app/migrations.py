"""Database schema utilities for lightweight upgrades."""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DBAPIError


def _is_duplicate_column_error(exc: DBAPIError) -> bool:
    """Return True if the DB-API error indicates the column already exists."""

    original = exc.orig
    if original is None:
        return False

    message = str(original).lower()
    duplicate_indicators = (
        "duplicate column",
        "already exists",
    )
    if any(indicator in message for indicator in duplicate_indicators):
        return True

    pgcode = getattr(original, "pgcode", None)
    if pgcode == "42701":  # duplicate_column
        return True

    errno = getattr(original, "errno", None)
    if errno == 1060:  # MySQL duplicate column name
        return True

    return False


def ensure_assigned_vendor_column(engine: Engine) -> None:
    """Add the assigned_vendor_id column to orders if it is missing.

    Existing installations created before vendor assignment support do not
    include this column. The application now depends on it being present, so we
    add it lazily during startup when the orders table already exists.
    """

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "orders" not in table_names:
        return

    column_names = {column["name"] for column in inspector.get_columns("orders")}
    if "assigned_vendor_id" in column_names:
        return

    if engine.dialect.name == "sqlite":
        ddl = "ALTER TABLE orders ADD COLUMN assigned_vendor_id INTEGER"
    else:
        ddl = (
            "ALTER TABLE orders "
            "ADD COLUMN assigned_vendor_id INTEGER REFERENCES users(id)"
        )

    with engine.begin() as connection:
        try:
            connection.execute(text(ddl))
        except DBAPIError as exc:
            if _is_duplicate_column_error(exc):
                return
            raise


def apply_schema_upgrades(engine: Engine) -> None:
    """Apply idempotent schema upgrades required by the application."""

    ensure_assigned_vendor_column(engine)
