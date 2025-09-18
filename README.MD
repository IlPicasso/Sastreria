# Portal de Sastrería

Aplicación completa para gestionar y consultar órdenes de un taller de sastrería. El proyecto incluye un backend basado en FastAPI con autenticación y un frontend ligero en HTML/JavaScript para clientes y personal interno.

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

- **Administrador**: crear usuarios, gestionar órdenes y eliminar registros.
- **Vendedor**: crear y actualizar órdenes.
- **Sastre**: consultar y actualizar el estado de las órdenes asignadas.

## Funcionalidades principales

- Consulta pública del estado de una orden por número.
- Gestión interna de órdenes: creación, actualización de estado, notas y asignación de sastre.
- Registro de medidas del cliente por orden.
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
