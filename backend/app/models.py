import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
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
    customer_name = Column(String(100), nullable=False)
    customer_contact = Column(String(255), nullable=True)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.EN_TIENDA_BATAN)
    measurements = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    assigned_tailor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    assigned_tailor = relationship("User", back_populates="assigned_orders")
