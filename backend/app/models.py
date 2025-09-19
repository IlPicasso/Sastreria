import enum
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, enum.Enum):
    """Roles available for authenticated users."""

    ADMIN = "administrador"
    VENDEDOR = "vendedor"
    SASTRE = "sastre"


class OrderStatus(str, enum.Enum):
    """Lifecycle states for tailoring orders."""

    EN_TIENDA_BATAN = "En tienda Batan"
    EN_TIENDA_URDESA = "En Tienda Urdesa"
    ENTREGADO_SASTRERIA = "Entregado a Sastrería"
    LISTO_ENVIAR_BATAN = "Listo para Enviar a Batan"
    LISTO_ENTREGA_BATAN = "Listo para ser Entregado a Cliente en Batan"
    LISTO_ENTREGA_URDESA = "Listo para ser Entregado a cliente en Urdesa"
    ENTREGADO = "Entregado"


class User(Base):
    """Registered system user."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    password_hash = Column(String(255), nullable=False)

    assigned_orders = relationship(
        "Order",
        back_populates="assigned_tailor",
        foreign_keys="Order.assigned_tailor_id",
    )


class Order(Base):
    """Tailoring order tracked in the system."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_document = Column(String(50), nullable=True, index=True)
    customer_contact = Column(String(255), nullable=True)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.EN_TIENDA_BATAN)
    measurements = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    assigned_tailor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    delivery_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    assigned_tailor = relationship("User", back_populates="assigned_orders")
    customer = relationship("Customer", back_populates="orders")


class Customer(Base):
    """Customer with reusable measurement sets."""

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    document_id = Column(String(50), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    measurements = relationship(
        "CustomerMeasurement",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    orders = relationship("Order", back_populates="customer")


class CustomerMeasurement(Base):
    """Named set of measurements associated with a customer."""

    __tablename__ = "customer_measurements"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    measurements = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    customer = relationship("Customer", back_populates="measurements")


class AuditLog(Base):
    """Immutable audit trail for privileged users."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)

    actor = relationship("User")
