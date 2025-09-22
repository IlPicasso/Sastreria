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


@pytest.fixture
def admin_user(db_session):
    user = models.User(
        username="admin",
        full_name="Admin",
        role=models.UserRole.ADMIN,
        password_hash=auth.get_password_hash("secret"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


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


def test_create_order_with_invalid_tailor_id(db_session, admin_user, customer):
    order_in = schemas.OrderCreate(
        order_number="ORD-100",
        customer_id=customer.id,
        origin_branch=models.Establishment.BATAN,
        assigned_tailor_id=999,
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
