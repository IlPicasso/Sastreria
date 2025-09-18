# Portal de Sastrería

Aplicación completa para gestionar y consultar órdenes de un taller de sastrería. El proyecto incluye un backend basado en FastAPI con autenticación JWT y un frontend ligero en HTML/JavaScript para clientes y personal interno.

## Requisitos

### Backend
- Python 3.10+
- Entorno virtual recomendado

### Frontend
- Cualquier servidor web estático (por ejemplo `python -m http.server`)

## Puesta en marcha

### 1. Preparar el backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

Crear el primer usuario administrador:

```bash
python create_admin.py --username admin --password cambialo --full-name "Administrador"
```

Iniciar la API:

```bash
uvicorn app.main:app --reload
```

La documentación interactiva estará disponible en `http://localhost:8000/docs`.

### 2. Preparar el frontend

El frontend es una SPA ligera sin dependencias externas. Desde la carpeta `frontend` ejecuta:

```bash
python -m http.server 5173
```

Luego visita `http://localhost:5173` en tu navegador. Asegúrate de que el backend esté funcionando en `http://localhost:8000`.

## Roles disponibles

- **Administrador**: crear usuarios, gestionar clientes y órdenes, consultar la bitácora y eliminar registros.
- **Vendedor**: crear clientes, registrar nuevas órdenes y actualizar sus datos.
- **Sastre**: consultar clientes y órdenes, actualizar los arreglos y estados (sin crear órdenes).

## Funcionalidades principales

- Consulta pública del estado de una orden por número de orden **o** cédula del cliente.
- Catálogo reutilizable de clientes con teléfono y conjuntos de medidas guardadas.
- Gestión interna de órdenes: creación (según rol), actualización de estado, notas y asignación de sastre.
- Aplicación rápida de las medidas guardadas del cliente al generar una orden.
- Bitácora de auditoría inmutable accesible para administradores.
- Gestión de usuarios con control de permisos (Administrador, Vendedor, Sastre).

## Estructura del proyecto

```
backend/       # API FastAPI + SQLAlchemy + SQLite
frontend/      # Portal HTML/JS/CSS
```

## Variables útiles

Si necesitas cambiar la URL del backend para el frontend, define `API_BASE_URL` antes de cargar `app.js`:

```html
<script>
  window.API_BASE_URL = 'http://tu-servidor:8000';
</script>
<script src="app.js"></script>
```

## Comandos recomendados

| Acción | Comando |
|--------|---------|
| Ejecutar pruebas manuales | `uvicorn app.main:app --reload` |
| Servir frontend | `python -m http.server 5173` |

¡Listo! Ya puedes gestionar las órdenes de tu sastrería y ofrecer a tus clientes un portal de consulta.
