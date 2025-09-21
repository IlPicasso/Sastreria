from typing import Iterable, List, Optional, Dict, Any, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from . import auth, models, schemas


# Serialization helpers -----------------------------------------------------

def serialize_user(user: Optional[models.User]) -> Optional[Dict[str, Any]]:
    if user is None:
        return None
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value if user.role else None,
    }


def serialize_customer(customer: Optional[models.Customer]) -> Optional[Dict[str, Any]]:
    if customer is None:
        return None
    return {
        "id": customer.id,
        "full_name": customer.full_name,
        "document_id": customer.document_id,
        "phone": customer.phone,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "updated_at": customer.updated_at.isoformat() if customer.updated_at else None,
        "measurements": [
            {
                "id": measurement.id,
                "name": measurement.title,
                "measurements": measurement.measurements,
            }
            for measurement in customer.measurements
        ],
    }


def serialize_order(order: Optional[models.Order]) -> Optional[Dict[str, Any]]:
    if order is None:
        return None
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "customer_document": order.customer_document,
        "customer_contact": order.customer_contact,
        "status": order.status.value if order.status else None,
        "measurements": order.measurements,
        "notes": order.notes,
        "assigned_tailor_id": order.assigned_tailor_id,
        "delivery_date": order.delivery_date.isoformat() if order.delivery_date else None,
        "invoice_number": order.invoice_number,
        "origin_branch": order.origin_branch.value if order.origin_branch else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }


# Audit log operations ------------------------------------------------------

def create_audit_log(
    db: Session,
    *,
    actor: Optional[models.User],
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
) -> models.AuditLog:
    log_entry = models.AuditLog(
        actor_id=actor.id if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def list_audit_logs(db: Session, *, limit: int = 200) -> List[models.AuditLog]:
    return (
        db.query(models.AuditLog)
        .options(joinedload(models.AuditLog.actor))
        .order_by(models.AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )


# User operations -----------------------------------------------------------

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, role: Optional[models.UserRole] = None) -> List[models.User]:
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.order_by(models.User.full_name.asc()).all()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        password_hash=auth.get_password_hash(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: models.User, user_update: schemas.UserUpdate) -> models.User:
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
    if user_update.role is not None:
        db_user.role = user_update.role
    if user_update.password is not None:
        db_user.password_hash = auth.get_password_hash(user_update.password)
    db.commit()
    db.refresh(db_user)
    return db_user


# Customer operations -------------------------------------------------------

def _measurement_collections_to_models(
    customer_id: int, measurements: Iterable[schemas.CustomerMeasurementCreate]
) -> List[models.CustomerMeasurement]:
    result: List[models.CustomerMeasurement] = []
    for measurement in measurements:
        if not isinstance(measurement, schemas.CustomerMeasurementCreate):
            measurement = schemas.CustomerMeasurementCreate.model_validate(measurement)
        db_measurement = models.CustomerMeasurement(
            customer_id=customer_id,
            title=measurement.name,
            measurements=_measurements_to_dicts(measurement.measurements),
        )
        result.append(db_measurement)
    return result


def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    customer = (
        db.query(models.Customer)
        .options(joinedload(models.Customer.measurements))
        .filter(models.Customer.id == customer_id)
        .first()
    )
    if customer:
        order_count = (
            db.query(func.count(models.Order.id))
            .filter(models.Order.customer_id == customer.id)
            .scalar()
        )
        setattr(customer, "order_count", int(order_count or 0))
    return customer


def get_customer_by_document(db: Session, document_id: str) -> Optional[models.Customer]:
    customer = (
        db.query(models.Customer)
        .options(joinedload(models.Customer.measurements))
        .filter(models.Customer.document_id == document_id)
        .first()
    )
    if customer:
        order_count = (
            db.query(func.count(models.Order.id))
            .filter(models.Order.customer_id == customer.id)
            .scalar()
        )
        setattr(customer, "order_count", int(order_count or 0))
    return customer


def get_customers(
    db: Session,
    *,
    skip: int = 0,
    limit: Optional[int] = None,
    search: Optional[str] = None,
) -> Tuple[List[models.Customer], int]:
    query = db.query(models.Customer)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Customer.full_name.ilike(pattern),
                models.Customer.document_id.ilike(pattern),
            )
        )
    total = query.count()
    items_query = (
        query.options(joinedload(models.Customer.measurements))
        .order_by(models.Customer.full_name.asc())
        .offset(skip)
    )
    if limit is not None:
        items_query = items_query.limit(limit)
    customers = items_query.all()
    if customers:
        counts = (
            db.query(models.Order.customer_id, func.count(models.Order.id))
            .filter(models.Order.customer_id.in_([customer.id for customer in customers]))
            .group_by(models.Order.customer_id)
            .all()
        )
        counts_map = {customer_id: count for customer_id, count in counts}
        for customer in customers:
            setattr(customer, "order_count", counts_map.get(customer.id, 0))
    return customers, total


def create_customer(db: Session, customer_in: schemas.CustomerCreate) -> models.Customer:
    db_customer = models.Customer(
        full_name=customer_in.full_name,
        document_id=customer_in.document_id,
        phone=customer_in.phone,
    )
    db.add(db_customer)
    db.flush()
    for measurement in _measurement_collections_to_models(db_customer.id, customer_in.measurements):
        db.add(measurement)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(
    db: Session, db_customer: models.Customer, customer_update: schemas.CustomerUpdate
) -> models.Customer:
    data = customer_update.model_dump(exclude_unset=True)
    measurements_payload = data.pop("measurements", None)
    for field, value in data.items():
        setattr(db_customer, field, value)
    if measurements_payload is not None:
        for existing in list(db_customer.measurements):
            db.delete(existing)
        db.flush()
        for measurement in _measurement_collections_to_models(db_customer.id, measurements_payload):
            db.add(measurement)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, db_customer: models.Customer) -> None:
    db.delete(db_customer)
    db.commit()


# Order operations ----------------------------------------------------------

def _measurements_to_dicts(measurements: Iterable[schemas.MeasurementItem]):
    result = []
    for measurement in measurements:
        if not isinstance(measurement, schemas.MeasurementItem):
            measurement = schemas.MeasurementItem.model_validate(measurement)
        result.append(measurement.model_dump())
    return result


def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    db_order = models.Order(
        order_number=order_in.order_number,
        customer_id=order_in.customer_id,
        customer_name=order_in.customer_name or "",
        customer_document=order_in.customer_document,
        customer_contact=order_in.customer_contact,
        status=order_in.status,
        measurements=_measurements_to_dicts(order_in.measurements),
        notes=order_in.notes,
        assigned_tailor_id=order_in.assigned_tailor_id,
        delivery_date=order_in.delivery_date,
        invoice_number=order_in.invoice_number,
        origin_branch=order_in.origin_branch,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.assigned_tailor),
            joinedload(models.Order.customer).joinedload(models.Customer.measurements),
        )
        .filter(models.Order.id == order_id)
        .first()
    )


def get_order_by_number(db: Session, order_number: str) -> Optional[models.Order]:
    return (
        db.query(models.Order)
        .filter(models.Order.order_number == order_number)
        .order_by(models.Order.created_at.desc())
        .first()
    )


def get_orders(
    db: Session,
    *,
    skip: int = 0,
    limit: Optional[int] = None,
    search: Optional[str] = None,
    customer_id: Optional[int] = None,
) -> Tuple[List[models.Order], int]:
    query = db.query(models.Order)
    if customer_id is not None:
        query = query.filter(models.Order.customer_id == customer_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Order.order_number.ilike(pattern),
                models.Order.customer_document.ilike(pattern),
            )
        )
    total = query.count()
    items_query = (
        query.options(
            joinedload(models.Order.assigned_tailor),
            joinedload(models.Order.customer).joinedload(models.Customer.measurements),
        )
        .order_by(models.Order.created_at.desc())
        .offset(skip)
    )
    if limit is not None:
        items_query = items_query.limit(limit)
    orders = items_query.all()
    return orders, total


def search_orders(
    db: Session,
    *,
    order_number: Optional[str] = None,
    customer_document: Optional[str] = None,
) -> List[models.Order]:
    query = db.query(models.Order).options(joinedload(models.Order.customer))
    if order_number:
        query = query.filter(models.Order.order_number == order_number)
    if customer_document:
        query = query.filter(models.Order.customer_document == customer_document)
    return query.order_by(models.Order.updated_at.desc()).all()


def update_order(db: Session, db_order: models.Order, order_update: schemas.OrderUpdate) -> models.Order:
    data = order_update.model_dump(exclude_unset=True)
    if "measurements" in data and data["measurements"] is not None:
        data["measurements"] = _measurements_to_dicts(data["measurements"])
    for field, value in data.items():
        setattr(db_order, field, value)
    db.commit()
    db.refresh(db_order)
    return db_order


def delete_order(db: Session, db_order: models.Order) -> None:
    db.delete(db_order)
    db.commit()
