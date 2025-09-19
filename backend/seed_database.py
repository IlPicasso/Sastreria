"""Herramienta CLI para poblar la base de datos con datos de ejemplo."""

from __future__ import annotations

import argparse
import random
import re
import secrets
import string
from collections import Counter
from datetime import date, timedelta
from typing import Iterable, List, Sequence, Tuple

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.timezone import now
from app.database import Base, SessionLocal, engine

FIRST_NAMES: Sequence[str] = (
    "Andrés",
    "Lucía",
    "Mateo",
    "Valentina",
    "Santiago",
    "Camila",
    "Gabriel",
    "Daniela",
    "Emilio",
    "Carolina",
    "Diego",
    "María",
)

LAST_NAMES: Sequence[str] = (
    "Salazar",
    "Paredes",
    "Rivas",
    "Cedeño",
    "Mendoza",
    "Narváez",
    "Guzmán",
    "Mora",
    "Yánez",
    "Bermúdez",
    "García",
    "Pérez",
)

MEASUREMENT_NAMES: Sequence[str] = (
    "Hombros",
    "Pecho",
    "Cintura",
    "Cadera",
    "Largo de manga",
    "Largo de pantalón",
    "Tiro",
    "Puño",
    "Cuello",
)

MEASUREMENT_SET_TITLES: Sequence[str] = (
    "Medidas iniciales",
    "Traje ceremonial",
    "Uniforme",
    "Ajustes especiales",
)

ORDER_NOTES: Sequence[str] = (
    "Cliente solicita entrega urgente",
    "Revisar dobladillo adicional",
    "Confirmar botones metálicos",
    "Entregar con funda protectora",
    "Preferencia por corte slim",
)

CONFIRM_POSITIVES = {"y", "yes", "s", "si", "sí"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera usuarios, clientes y órdenes de ejemplo para el entorno local."
    )
    parser.add_argument("--users", type=int, default=5, help="Cantidad de usuarios a crear")
    parser.add_argument(
        "--customers", type=int, default=15, help="Cantidad de clientes a crear"
    )
    parser.add_argument("--orders", type=int, default=20, help="Cantidad de órdenes a crear")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Vacía las tablas antes de crear los registros",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirma automáticamente las operaciones destructivas",
    )
    return parser.parse_args()


def confirm_reset(args: argparse.Namespace) -> bool:
    if not args.reset:
        return False
    if args.yes:
        return True
    prompt = (
        "Esto eliminará usuarios, clientes, medidas y órdenes existentes. "
        "¿Deseas continuar? [s/N]: "
    )
    answer = input(prompt).strip().lower()
    return answer in CONFIRM_POSITIVES


def reset_tables(db: Session) -> None:
    with db.begin():
        db.execute(delete(models.Order))
        db.execute(delete(models.CustomerMeasurement))
        db.execute(delete(models.Customer))
        db.execute(delete(models.AuditLog))
        db.execute(delete(models.User))


def unique_identifier(existing: set[str], generator: Iterable[str]) -> str:
    for candidate in generator:
        if candidate not in existing:
            existing.add(candidate)
            return candidate
    raise RuntimeError("No se pudo generar un identificador único")


def username_candidates(first: str, last: str) -> Iterable[str]:
    base = f"{first[0]}{last}".lower()
    base = re.sub(r"[^a-z0-9]", "", base)
    if not base:
        base = secrets.token_hex(3)
    yield base
    for idx in range(1, 1000):
        yield f"{base}{idx}"


def document_candidates() -> Iterable[str]:
    while True:
        yield "".join(secrets.choice(string.digits) for _ in range(10))


def order_number_candidates(year: int) -> Iterable[str]:
    counter = 1
    while True:
        suffix = secrets.token_hex(3).upper()
        yield f"ORD-{year}-{suffix}-{counter:03d}"
        counter += 1


def random_person() -> Tuple[str, str]:
    return random.choice(FIRST_NAMES), random.choice(LAST_NAMES)


def random_phone() -> str:
    return "09" + "".join(secrets.choice(string.digits) for _ in range(8))


def random_contact(full_name: str) -> str:
    if random.random() < 0.6:
        return random_phone()
    normalized = re.sub(r"[^a-z]", "", full_name.lower()) or "cliente"
    return f"{normalized[:8]}@ejemplo.com"


def generate_measurement_items() -> List[schemas.MeasurementItem]:
    total = random.randint(4, min(6, len(MEASUREMENT_NAMES)))
    chosen = random.sample(MEASUREMENT_NAMES, k=total)
    items: List[schemas.MeasurementItem] = []
    for name in chosen:
        value = f"{random.randint(30, 120)} cm"
        items.append(schemas.MeasurementItem(nombre=name, valor=value))
    return items


def generate_customer_measurements() -> List[schemas.CustomerMeasurementCreate]:
    total_sets = random.randint(1, min(3, len(MEASUREMENT_SET_TITLES)))
    titles = random.sample(list(MEASUREMENT_SET_TITLES), k=total_sets)
    result: List[schemas.CustomerMeasurementCreate] = []
    for title in titles:
        result.append(
            schemas.CustomerMeasurementCreate(
                name=title, measurements=generate_measurement_items()
            )
        )
    return result


def pick_measurements_from_customer(
    customer: models.Customer,
) -> List[schemas.MeasurementItem]:
    if customer.measurements:
        measurement = random.choice(customer.measurements)
        try:
            return [
                schemas.MeasurementItem.model_validate(item)
                for item in measurement.measurements or []
            ]
        except Exception:
            pass
    return generate_measurement_items()


def random_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def random_delivery_date(status: models.OrderStatus) -> date | None:
    today = now().date()
    if status == models.OrderStatus.ENTREGADO:
        return today - timedelta(days=random.randint(1, 30))
    if status in {
        models.OrderStatus.LISTO_ENTREGA_BATAN,
        models.OrderStatus.LISTO_ENTREGA_URDESA,
        models.OrderStatus.LISTO_ENVIAR_BATAN,
    }:
        return today + timedelta(days=random.randint(1, 15))
    if random.random() < 0.3:
        return today + timedelta(days=random.randint(1, 20))
    return None


def seed_users(db: Session, count: int) -> List[Tuple[models.User, str]]:
    if count <= 0:
        return []
    existing_usernames = set(db.execute(select(models.User.username)).scalars())
    role_sequence = list(models.UserRole)
    random.shuffle(role_sequence)
    created: List[Tuple[models.User, str]] = []
    for index in range(count):
        first, last = random_person()
        username = unique_identifier(
            existing_usernames, username_candidates(first, last)
        )
        password = random_password()
        role = role_sequence[index % len(role_sequence)]
        user_in = schemas.UserCreate(
            username=username,
            full_name=f"{first} {last}",
            role=role,
            password=password,
        )
        created_user = crud.create_user(db, user_in)
        created.append((created_user, password))
    return created


def seed_customers(db: Session, count: int) -> List[models.Customer]:
    if count <= 0:
        return []
    existing_documents = set(db.execute(select(models.Customer.document_id)).scalars())
    customers: List[models.Customer] = []
    for _ in range(count):
        first, last = random_person()
        full_name = f"{first} {last}"
        document_id = unique_identifier(existing_documents, document_candidates())
        measurements = generate_customer_measurements()
        customer_in = schemas.CustomerCreate(
            full_name=full_name,
            document_id=document_id,
            phone=random_phone(),
            measurements=measurements,
        )
        customer = crud.create_customer(db, customer_in)
        customers.append(customer)
    return customers


def seed_orders(
    db: Session,
    count: int,
    customers: Sequence[models.Customer],
    tailors: Sequence[models.User],
) -> List[models.Order]:
    if count <= 0 or not customers:
        return []
    existing_order_numbers = set(db.execute(select(models.Order.order_number)).scalars())
    year = now().year
    orders: List[models.Order] = []
    for _ in range(count):
        customer = random.choice(customers)
        measurements = pick_measurements_from_customer(customer)
        status = random.choice(list(models.OrderStatus))
        assigned_tailor_id = None
        if tailors and random.random() < 0.8:
            assigned_tailor_id = random.choice(tailors).id
        contact = customer.phone if random.random() < 0.7 else random_contact(customer.full_name)
        order_in = schemas.OrderCreate(
            order_number=unique_identifier(
                existing_order_numbers, order_number_candidates(year)
            ),
            customer_id=customer.id,
            customer_name=customer.full_name,
            customer_document=customer.document_id,
            customer_contact=contact,
            status=status,
            measurements=measurements,
            notes=random.choice(ORDER_NOTES) if random.random() < 0.7 else None,
            assigned_tailor_id=assigned_tailor_id,
            delivery_date=random_delivery_date(status),
        )
        order = crud.create_order(db, order_in)
        orders.append(order)
    return orders


def summarize(
    users: Sequence[Tuple[str, str, str]],
    customers_total: int,
    orders_total: int,
    status_counter: Counter[str],
) -> None:
    print("\nResumen de datos generados")
    print(f"  Usuarios creados : {len(users)}")
    for username, role, password in list(users)[:5]:
        print(f"    - {username} ({role}) contraseña: {password}")
    if len(users) > 5:
        print("    - ...")
    print(f"  Clientes creados : {customers_total}")
    print(f"  Órdenes creadas  : {orders_total}")
    if status_counter:
        print("    Estados distribuidos:")
        for status, total in status_counter.most_common():
            print(f"      * {status}: {total}")


def main() -> None:
    args = parse_args()

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if args.reset:
            if confirm_reset(args):
                reset_tables(db)
                print("Tablas vaciadas correctamente.")
            else:
                print("Operación cancelada por el usuario.")
                return

        users = seed_users(db, args.users)
        customers = seed_customers(db, args.customers)
        tailors = [user for user, _ in users if user.role == models.UserRole.SASTRE]
        orders = seed_orders(db, args.orders, customers, tailors)

        user_summary = [(user.username, user.role.value, password) for user, password in users]
        customers_total = len(customers)
        orders_total = len(orders)
        status_counter = Counter(order.status.value for order in orders)

    summarize(user_summary, customers_total, orders_total, status_counter)


if __name__ == "__main__":
    main()
