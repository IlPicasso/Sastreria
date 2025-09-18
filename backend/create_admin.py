"""Utility script to bootstrap an administrator user."""

import argparse

from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import Base, SessionLocal, engine


def main() -> None:
    parser = argparse.ArgumentParser(description="Crear un usuario inicial")
    parser.add_argument("--username", required=True, help="Usuario de inicio de sesión")
    parser.add_argument("--password", required=True, help="Contraseña del usuario")
    parser.add_argument("--full-name", required=True, help="Nombre completo")
    parser.add_argument(
        "--role",
        choices=[role.value for role in models.UserRole],
        default=models.UserRole.ADMIN.value,
        help="Rol del usuario",
    )
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)

    role = models.UserRole(args.role)
    user_in = schemas.UserCreate(
        username=args.username,
        password=args.password,
        full_name=args.full_name,
        role=role,
    )

    db: Session = SessionLocal()
    try:
        if crud.get_user_by_username(db, user_in.username):
            print("El usuario ya existe. Nada que hacer.")
            return
        crud.create_user(db, user_in)
        print("Usuario creado correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
