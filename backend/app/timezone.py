"""Utility helpers for working with the application timezone."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

# The tailoring business operates on the GMT-5 timezone (e.g., Ecuador/Colombia).
# Using a fixed offset keeps the behaviour consistent regardless of the server's
# locale configuration.
APP_TIMEZONE = timezone(timedelta(hours=-5))


def now() -> datetime:
    """Return the current time in the application timezone."""

    return datetime.now(tz=APP_TIMEZONE)


__all__ = ["APP_TIMEZONE", "now"]
