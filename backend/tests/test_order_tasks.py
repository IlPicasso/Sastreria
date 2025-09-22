import asyncio
import os
import sys
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-value-32-chars!!")

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import auth, dependencies, main, models, schemas
from app.database import Base


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def create_user(session, username: str, role: models.UserRole) -> models.User:
    user = models.User(
        username=username,
        full_name=username.title(),
        role=role,
        password_hash=auth.get_password_hash("secret"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_customer_with_order(session) -> models.Order:
    customer = models.Customer(
        full_name="Cliente Demo",
        document_id="1234567890",
        phone="0990000000",
    )
    session.add(customer)
    session.commit()
    session.refresh(customer)

    order = models.Order(
        order_number="ORD-500",
        customer_id=customer.id,
        customer_name=customer.full_name,
        customer_document=customer.document_id,
        customer_contact=customer.phone,
        status=models.OrderStatus.EN_TIENDA_BATAN,
        measurements=[],
        origin_branch=models.Establishment.BATAN,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


def test_tailor_can_create_task_and_vendor_cannot_modify(db_session):
    tailor = create_user(db_session, "tailor", models.UserRole.SASTRE)
    vendor = create_user(db_session, "vendor", models.UserRole.VENDEDOR)
    order = create_customer_with_order(db_session)

    asyncio.run(dependencies.tailor_or_admin_required()(tailor))
    created = main.create_order_task_endpoint(
        order.id,
        schemas.OrderTaskCreate(),
        db_session,
        tailor,
    )
    assert created.description == "Trabajo #1"
    assert created.status == models.OrderTaskStatus.PENDING
    assert created.order_id == order.id
    assert db_session.query(models.OrderTask).count() == 1

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(dependencies.tailor_or_admin_required()(vendor))
    assert exc_info.value.status_code == 403
    assert db_session.query(models.OrderTask).count() == 1


def test_status_update_requires_tailor_and_logs_audit(db_session):
    tailor = create_user(db_session, "tailor", models.UserRole.SASTRE)
    admin = create_user(db_session, "admin", models.UserRole.ADMIN)
    vendor = create_user(db_session, "vendor", models.UserRole.VENDEDOR)
    order = create_customer_with_order(db_session)

    asyncio.run(dependencies.tailor_or_admin_required()(tailor))
    task = main.create_order_task_endpoint(
        order.id,
        schemas.OrderTaskCreate(description="Marcar dobladillos"),
        db_session,
        tailor,
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(dependencies.tailor_or_admin_required()(vendor))
    assert exc_info.value.status_code == 403

    asyncio.run(dependencies.tailor_or_admin_required()(admin))
    updated = main.update_order_task_endpoint(
        order.id,
        task.id,
        schemas.OrderTaskUpdate(status=models.OrderTaskStatus.COMPLETED),
        db_session,
        admin,
    )
    assert updated.status == models.OrderTaskStatus.COMPLETED

    stored_task = db_session.query(models.OrderTask).filter_by(id=task.id).one()
    assert stored_task.status == models.OrderTaskStatus.COMPLETED

    logs = (
        db_session.query(models.AuditLog)
        .filter(models.AuditLog.entity_type == "order_task", models.AuditLog.entity_id == task.id)
        .order_by(models.AuditLog.timestamp.asc())
        .all()
    )
    status_logs = [log for log in logs if log.action == "update_status"]
    assert status_logs, "Debe registrarse un log de auditoría para el cambio de estado"
    last_status_log = status_logs[-1]
    assert last_status_log.before == {"status": models.OrderTaskStatus.PENDING.value}
    assert last_status_log.after == {"status": models.OrderTaskStatus.COMPLETED.value}

    updated_blank = main.update_order_task_endpoint(
        order.id,
        task.id,
        schemas.OrderTaskUpdate(description="   "),
        db_session,
        admin,
    )
    assert updated_blank.description == "Trabajo #1"
