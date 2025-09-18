from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .config import get_settings
from .database import Base, engine, get_db
from .dependencies import admin_required, staff_required, vendor_or_admin_required

settings = get_settings()

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
    _: models.User = Depends(admin_required()),
):
    existing = crud.get_user_by_username(db, user_in.username)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario ya existe")
    user = crud.create_user(db, user_in)
    return user


@app.get("/users/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/users", response_model=List[schemas.UserOut])
def read_users(
    role: Optional[models.UserRole] = Query(default=None),
    db: Session = Depends(get_db),
    _: models.User = Depends(admin_required()),
):
    return crud.get_users(db, role=role)


@app.get("/users/tailors", response_model=List[schemas.UserOut])
def read_tailors(
    db: Session = Depends(get_db),
    _: models.User = Depends(staff_required()),
):
    return crud.get_users(db, role=models.UserRole.SASTRE)


@app.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(admin_required()),
):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return crud.update_user(db, db_user, user_update)


@app.get("/public/orders/{order_number}", response_model=schemas.OrderPublic)
def get_order_public(order_number: str, db: Session = Depends(get_db)):
    order = crud.get_order_by_number(db, order_number)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    return order


@app.get("/orders", response_model=List[schemas.OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    _: models.User = Depends(staff_required()),
):
    return crud.get_orders(db)


@app.post("/orders", response_model=schemas.OrderRead, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(vendor_or_admin_required()),
):
    if crud.get_order_by_number(db, order_in.order_number):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una orden con ese número")
    return crud.create_order(db, order_in)


@app.get("/orders/{order_id}", response_model=schemas.OrderRead)
def get_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(staff_required()),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    return order


@app.patch("/orders/{order_id}", response_model=schemas.OrderRead)
def update_order_endpoint(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(staff_required()),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    return crud.update_order(db, order, order_update)


@app.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(admin_required()),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    crud.delete_order(db, order)
    return None
