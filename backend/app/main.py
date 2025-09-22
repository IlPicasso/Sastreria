import math
from typing import List, Optional, Tuple

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .config import get_settings
from .database import Base, engine, get_db
from .dependencies import admin_required, staff_required, vendor_or_admin_required

settings = get_settings()

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 200


def resolve_pagination(
    *,
    skip: Optional[int],
    limit: Optional[int],
    page: int,
    page_size: int,
    default_size: int = DEFAULT_PAGE_SIZE,
) -> Tuple[int, int, int]:
    effective_page_size = limit if limit is not None else page_size
    if effective_page_size is None or effective_page_size <= 0:
        effective_page_size = default_size
    skip_value = skip if skip is not None else (page - 1) * effective_page_size
    if skip_value < 0:
        skip_value = 0
    current_page = (skip_value // effective_page_size) + 1 if effective_page_size else 1
    return skip_value, effective_page_size, current_page

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


def _validate_assigned_tailor(
    db: Session, assigned_tailor_id: Optional[int]
) -> Optional[models.User]:
    """Ensure the provided tailor id exists and belongs to a tailor user."""

    if assigned_tailor_id is None:
        return None
    tailor = crud.get_user(db, assigned_tailor_id)
    if not tailor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El sastre asignado no existe",
        )
    if tailor.role != models.UserRole.SASTRE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario asignado no es un sastre",
        )
    return tailor


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}


@app.post("/auth/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    access_token = auth.create_access_token({"sub": user.username})
    return schemas.Token(access_token=access_token)


@app.get("/statuses", response_model=List[str])
def list_statuses() -> List[str]:
    return [status.value for status in models.OrderStatus]


@app.post(
    "/users",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required()),
):
    existing = crud.get_user_by_username(db, user_in.username)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario ya existe")
    user = crud.create_user(db, user_in)
    crud.create_audit_log(
        db,
        actor=current_user,
        action="create",
        entity_type="user",
        entity_id=user.id,
        after=crud.serialize_user(user),
    )
    return user


@app.get("/users/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/users", response_model=List[schemas.UserOut])
def read_users(
    role: Optional[models.UserRole] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required()),
):
    _ = current_user
    return crud.get_users(db, role=role)


@app.get("/users/tailors", response_model=List[schemas.UserOut])
def read_tailors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    _ = current_user
    return crud.get_users(db, role=models.UserRole.SASTRE)


@app.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required()),
):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    before = crud.serialize_user(db_user)
    updated_user = crud.update_user(db, db_user, user_update)
    crud.create_audit_log(
        db,
        actor=current_user,
        action="update",
        entity_type="user",
        entity_id=updated_user.id,
        before=before,
        after=crud.serialize_user(updated_user),
    )
    return updated_user


@app.get("/public/orders", response_model=List[schemas.OrderPublic])
def search_public_orders(
    order_number: Optional[str] = Query(default=None),
    customer_document: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    if not order_number and not customer_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar el número de orden o la cédula del cliente",
        )
    return crud.search_orders(db, order_number=order_number, customer_document=customer_document)


@app.get("/customers", response_model=schemas.PaginatedCustomers)
def list_customers(
    skip: Optional[int] = Query(default=None, ge=0),
    limit: Optional[int] = Query(default=None, ge=1, le=MAX_PAGE_SIZE),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    _ = current_user
    trimmed_search = search.strip() if search else None
    skip_value, limit_value, page_value = resolve_pagination(
        skip=skip, limit=limit, page=page, page_size=page_size
    )
    customers, total = crud.get_customers(
        db,
        skip=skip_value,
        limit=limit_value,
        search=trimmed_search,
    )
    if total and skip_value >= total and page_value > 1:
        max_page = max(math.ceil(total / limit_value), 1)
        skip_value = (max_page - 1) * limit_value
        customers, total = crud.get_customers(
            db,
            skip=skip_value,
            limit=limit_value,
            search=trimmed_search,
        )
        page_value = max_page
    if total == 0:
        page_value = 1
    return {
        "items": customers,
        "total": total,
        "page": page_value,
        "page_size": limit_value,
    }


@app.post("/customers", response_model=schemas.CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer_endpoint(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    if crud.get_customer_by_document(db, customer_in.document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un cliente con esa identificación")
    customer = crud.create_customer(db, customer_in)
    crud.create_audit_log(
        db,
        actor=current_user,
        action="create",
        entity_type="customer",
        entity_id=customer.id,
        after=crud.serialize_customer(customer),
    )
    return customer


@app.get("/customers/{customer_id}", response_model=schemas.CustomerRead)
def get_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    _ = current_user
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return customer


@app.patch("/customers/{customer_id}", response_model=schemas.CustomerRead)
def update_customer_endpoint(
    customer_id: int,
    customer_update: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    if (
        customer_update.document_id
        and customer_update.document_id != customer.document_id
        and (existing := crud.get_customer_by_document(db, customer_update.document_id))
        and existing.id != customer.id
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un cliente con esa identificación")
    before = crud.serialize_customer(customer)
    updated_customer = crud.update_customer(db, customer, customer_update)
    crud.create_audit_log(
        db,
        actor=current_user,
        action="update",
        entity_type="customer",
        entity_id=updated_customer.id,
        before=before,
        after=crud.serialize_customer(updated_customer),
    )
    return updated_customer


@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required()),
):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    before = crud.serialize_customer(customer)
    crud.delete_customer(db, customer)
    crud.create_audit_log(
        db,
        actor=current_user,
        action="delete",
        entity_type="customer",
        entity_id=customer_id,
        before=before,
    )
    return None


@app.get("/orders", response_model=schemas.PaginatedOrders)
def list_orders(
    skip: Optional[int] = Query(default=None, ge=0),
    limit: Optional[int] = Query(default=None, ge=1, le=MAX_PAGE_SIZE),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    search: Optional[str] = Query(default=None),
    customer_id: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    _ = current_user
    trimmed_search = search.strip() if search else None
    skip_value, limit_value, page_value = resolve_pagination(
        skip=skip, limit=limit, page=page, page_size=page_size
    )
    orders, total = crud.get_orders(
        db,
        skip=skip_value,
        limit=limit_value,
        search=trimmed_search,
        customer_id=customer_id,
    )
    if total and skip_value >= total and page_value > 1:
        max_page = max(math.ceil(total / limit_value), 1)
        skip_value = (max_page - 1) * limit_value
        orders, total = crud.get_orders(
            db,
            skip=skip_value,
            limit=limit_value,
            search=trimmed_search,
            customer_id=customer_id,
        )
        page_value = max_page
    if total == 0:
        page_value = 1
    return {
        "items": orders,
        "total": total,
        "page": page_value,
        "page_size": limit_value,
    }


@app.post("/orders", response_model=schemas.OrderRead, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(vendor_or_admin_required()),
):
    if current_user.role not in {models.UserRole.ADMIN, models.UserRole.VENDEDOR}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción",
        )
    if crud.get_order_by_number(db, order_in.order_number):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una orden con ese número")
    customer = crud.get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    order_data = order_in.model_dump()
    if not order_data.get("customer_name"):
        order_data["customer_name"] = customer.full_name
    if not order_data.get("customer_document"):
        order_data["customer_document"] = customer.document_id
    if order_data.get("customer_contact") in (None, ""):
        order_data["customer_contact"] = customer.phone
    _validate_assigned_tailor(db, order_data.get("assigned_tailor_id"))
    order = crud.create_order(db, schemas.OrderCreate(**order_data))
    crud.create_audit_log(
        db,
        actor=current_user,
        action="create",
        entity_type="order",
        entity_id=order.id,
        after=crud.serialize_order(order),
    )
    return order


@app.get("/orders/{order_id}", response_model=schemas.OrderRead)
def get_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    _ = current_user
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    return order


@app.patch("/orders/{order_id}", response_model=schemas.OrderRead)
def update_order_endpoint(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(staff_required()),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    update_data = order_update.model_dump(exclude_unset=True)
    if "customer_id" in update_data and update_data["customer_id"] != order.customer_id:
        new_customer = crud.get_customer(db, update_data["customer_id"])
        if not new_customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        if not update_data.get("customer_name"):
            update_data["customer_name"] = new_customer.full_name
        if not update_data.get("customer_document"):
            update_data["customer_document"] = new_customer.document_id
        if update_data.get("customer_contact") in (None, ""):
            update_data["customer_contact"] = new_customer.phone
    if "assigned_tailor_id" in update_data:
        _validate_assigned_tailor(db, update_data["assigned_tailor_id"])
    before = crud.serialize_order(order)
    updated_order = crud.update_order(db, order, schemas.OrderUpdate(**update_data))
    crud.create_audit_log(
        db,
        actor=current_user,
        action="update",
        entity_type="order",
        entity_id=updated_order.id,
        before=before,
        after=crud.serialize_order(updated_order),
    )
    return updated_order


@app.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required()),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    before = crud.serialize_order(order)
    crud.delete_order(db, order)
    crud.create_audit_log(
        db,
        actor=current_user,
        action="delete",
        entity_type="order",
        entity_id=order_id,
        before=before,
    )
    return None


@app.get("/audit-logs", response_model=List[schemas.AuditLogRead])
def list_audit_logs_endpoint(
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required()),
):
    _ = current_user
    return crud.list_audit_logs(db, limit=limit)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )
