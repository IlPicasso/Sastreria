from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .models import OrderStatus, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class MeasurementItem(BaseModel):
    nombre: str = Field(..., description="Nombre de la medida, por ejemplo 'Pecho'")
    valor: str = Field(..., description="Valor de la medida")


class UserBase(BaseModel):
    username: str
    full_name: str
    role: UserRole


class UserCreate(BaseModel):
    username: str
    full_name: str
    role: UserRole
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str]
    role: Optional[UserRole]
    password: Optional[str]


class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


class OrderBase(BaseModel):
    order_number: str
    customer_name: str
    customer_contact: Optional[str] = None
    status: OrderStatus = OrderStatus.EN_TIENDA_BATAN
    measurements: List[MeasurementItem] = Field(default_factory=list)
    notes: Optional[str] = None
    assigned_tailor_id: Optional[int] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    status: Optional[OrderStatus] = None
    measurements: Optional[List[MeasurementItem]] = None
    notes: Optional[str] = None
    assigned_tailor_id: Optional[int] = None


class OrderPublic(BaseModel):
    order_number: str
    customer_name: str
    status: OrderStatus
    notes: Optional[str]
    updated_at: datetime

    class Config:
        orm_mode = True


class OrderRead(OrderPublic):
    id: int
    customer_contact: Optional[str]
    measurements: List[MeasurementItem]
    assigned_tailor: Optional[UserOut]
    created_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str
