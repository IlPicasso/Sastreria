from fastapi import Depends

from . import auth, models


async def get_current_active_user(
    current_user: models.User = Depends(auth.get_current_user),
) -> models.User:
    """Return the authenticated user (placeholder for future checks)."""

    return current_user


def admin_required():
    return auth.require_roles(models.UserRole.ADMIN)


def staff_required():
    return auth.require_roles(models.UserRole.ADMIN, models.UserRole.VENDEDOR, models.UserRole.SASTRE)


def vendor_or_admin_required():
    return auth.require_roles(models.UserRole.ADMIN, models.UserRole.VENDEDOR)
