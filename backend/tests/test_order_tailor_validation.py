import os
import sys
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-value-32-chars!!")

import pytest
from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import auth, main, models, schemas
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


@pytest.fixture
def admin_user(db_session):
    return create_user(db_session, "admin", models.UserRole.ADMIN)


@pytest.fixture
def vendor_user(db_session):
    return create_user(db_session, "vendor", models.UserRole.VENDEDOR)


@pytest.fixture
def customer(db_session):
    customer = models.Customer(
        full_name="Cliente Ejemplo",
        document_id="1234567890",
        phone="0999999999",
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer


@pytest.fixture
def tailor_user(db_session):
    user = models.User(
        username="tailor",
        full_name="Sastre Ejemplo",
        role=models.UserRole.SASTRE,
        password_hash=auth.get_password_hash("secret"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_create_order_with_invalid_tailor_id(db_session, admin_user, customer):
    order_in = schemas.OrderCreate(
        order_number="ORD-100",
        customer_id=customer.id,
        origin_branch=models.Establishment.BATAN,
        assigned_tailor_id=999,
        tasks=[schemas.OrderTaskCreate(description="Ajuste inicial")],
    )

    with pytest.raises(HTTPException) as exc_info:
        main.create_order_endpoint(order_in, db_session, admin_user)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "El sastre asignado no existe"


def test_update_order_rejects_non_tailor_assignment(db_session, admin_user, customer):
    created_order = main.create_order_endpoint(
        schemas.OrderCreate(
            order_number="ORD-200",
            customer_id=customer.id,
            origin_branch=models.Establishment.URDESA,
            tasks=[schemas.OrderTaskCreate(description="Preparar prenda")],
        ),
        db_session,
        admin_user,
    )

    non_tailor = models.User(
        username="vend",
        full_name="Vendedor",
        role=models.UserRole.VENDEDOR,
        password_hash=auth.get_password_hash("secret"),
    )
    db_session.add(non_tailor)
    db_session.commit()
    db_session.refresh(non_tailor)

    with pytest.raises(HTTPException) as exc_info:
        main.update_order_endpoint(
            created_order.id,
            schemas.OrderUpdate(assigned_tailor_id=non_tailor.id),
            db_session,
            admin_user,
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "El usuario asignado no es un sastre"


def test_order_creation_persists_initial_tasks(db_session, vendor_user, customer):
    tailor = create_user(db_session, "tailor", models.UserRole.SASTRE)
    order_in = schemas.OrderCreate(
        order_number="ORD-300",
        customer_id=customer.id,
        origin_branch=models.Establishment.URDESA,
        tasks=[
            schemas.OrderTaskCreate(description="Ajustar bastilla", responsible_id=tailor.id),
            schemas.OrderTaskCreate(description="Planchar prenda"),
            schemas.OrderTaskCreate(),
        ],
    )

    order = main.create_order_endpoint(order_in, db_session, vendor_user)

    stored_tasks = (
        db_session.query(models.OrderTask)
        .filter(models.OrderTask.order_id == order.id)
        .order_by(models.OrderTask.created_at.asc())
        .all()
    )

    assert len(stored_tasks) == 3
    assert stored_tasks[0].description == "Ajustar bastilla"
    assert stored_tasks[0].responsible_id == tailor.id
    assert stored_tasks[0].status == models.OrderTaskStatus.PENDING
    assert stored_tasks[1].description == "Planchar prenda"
    assert stored_tasks[1].responsible_id is None
    assert stored_tasks[2].description == "Trabajo #1"
    assert stored_tasks[2].responsible_id is None



def test_order_creation_rejects_non_tailor_task_responsible(db_session, vendor_user, customer):
    non_tailor = create_user(db_session, "no_tailor", models.UserRole.VENDEDOR)
    order_in = schemas.OrderCreate(
        order_number="ORD-400",
        customer_id=customer.id,
        origin_branch=models.Establishment.BATAN,
        tasks=[
            schemas.OrderTaskCreate(description="Coser botones", responsible_id=non_tailor.id)
        ],
    )

    with pytest.raises(HTTPException) as exc_info:
        main.create_order_endpoint(order_in, db_session, vendor_user)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "El usuario asignado no es un sastre"


def test_create_order_without_tasks_is_allowed(db_session, vendor_user, customer):
    order_in = schemas.OrderCreate(
        order_number="ORD-500",
        customer_id=customer.id,
        origin_branch=models.Establishment.BATAN,
    )

    order = main.create_order_endpoint(order_in, db_session, vendor_user)

    stored_tasks = (
        db_session.query(models.OrderTask)
        .filter(models.OrderTask.order_id == order.id)
        .all()
    )

    assert stored_tasks == []

