from typing import Iterable, List, Optional

from sqlalchemy.orm import Session

from . import auth, models, schemas


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


# Order operations ----------------------------------------------------------

def _measurements_to_dicts(measurements: Iterable[schemas.MeasurementItem]):
    return [measurement.dict() for measurement in measurements]


def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    db_order = models.Order(
        order_number=order_in.order_number,
        customer_name=order_in.customer_name,
        customer_contact=order_in.customer_contact,
        status=order_in.status,
        measurements=_measurements_to_dicts(order_in.measurements),
        notes=order_in.notes,
        assigned_tailor_id=order_in.assigned_tailor_id,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_order_by_number(db: Session, order_number: str) -> Optional[models.Order]:
    return (
        db.query(models.Order)
        .filter(models.Order.order_number == order_number)
        .order_by(models.Order.created_at.desc())
        .first()
    )


def get_orders(db: Session) -> List[models.Order]:
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


def update_order(db: Session, db_order: models.Order, order_update: schemas.OrderUpdate) -> models.Order:
    data = order_update.dict(exclude_unset=True)
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
