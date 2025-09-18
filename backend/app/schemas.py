from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from .models import OrderStatus, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class MeasurementItem(BaseModel):
    nombre: str = Field(..., description="Nombre de la medida, por ejemplo 'Pecho'")
    valor: str = Field(..., description="Valor de la medida")


class CustomerMeasurementBase(BaseModel):
    name: str = Field(..., description="Nombre del conjunto de medidas")
    measurements: List[MeasurementItem] = Field(default_factory=list)


class CustomerMeasurementCreate(CustomerMeasurementBase):
    pass


class CustomerMeasurementUpdate(CustomerMeasurementBase):
    pass


class CustomerMeasurementRead(CustomerMeasurementBase):
    id: int
    name: str = Field(..., validation_alias=AliasChoices("title", "name"))

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CustomerBase(BaseModel):
    full_name: str
    document_id: str
    phone: Optional[str] = None


class CustomerCreate(CustomerBase):
    measurements: List[CustomerMeasurementCreate] = Field(default_factory=list)


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    document_id: Optional[str] = None
    phone: Optional[str] = None
    measurements: Optional[List[CustomerMeasurementCreate]] = None


class CustomerSummary(CustomerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CustomerRead(CustomerSummary):
    measurements: List[CustomerMeasurementRead] = Field(default_factory=list)


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

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    order_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_document: Optional[str] = None
    customer_contact: Optional[str] = None
    status: OrderStatus = OrderStatus.EN_TIENDA_BATAN
    measurements: List[MeasurementItem] = Field(default_factory=list)
    notes: Optional[str] = None
    assigned_tailor_id: Optional[int] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_document: Optional[str] = None
    customer_contact: Optional[str] = None
    status: Optional[OrderStatus] = None
    measurements: Optional[List[MeasurementItem]] = None
    notes: Optional[str] = None
    assigned_tailor_id: Optional[int] = None


class OrderPublic(BaseModel):
    order_number: str
    customer_name: str
    customer_document: Optional[str]
    status: OrderStatus
    notes: Optional[str]
    updated_at: datetime
    measurements: List[MeasurementItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class OrderRead(OrderPublic):
    id: int
    customer_id: int
    customer_contact: Optional[str]
    customer: Optional[CustomerSummary]
    assigned_tailor: Optional[UserOut]
    created_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class AuditLogRead(BaseModel):
    id: int
    timestamp: datetime
    action: str
    entity_type: str
    entity_id: Optional[int]
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    actor: Optional[UserOut]

    model_config = ConfigDict(from_attributes=True)
