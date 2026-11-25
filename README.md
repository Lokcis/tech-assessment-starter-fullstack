# Catálogo de Cuentas — Aplicación Full-Stack

Aplicación full-stack para gestionar un **Catálogo de Cuentas Contables** jerárquico (Clase, Grupo, Cuenta y Subcuenta), construida con **NestJS + TypeScript + SQLite** en `api/` y **React 19 + Vite 8 + TypeScript** en `web/`.

## Funcionalidad implementada

- **Visualización en árbol jerárquico (`GET /accounts`):** muestra el catálogo completo ordenado por código con expandir/colapsar por nodo, acciones globales (**Expandir todo / Colapsar todo**) e indicadores de nivel (`CLASE`, `GRUPO`, `CUENTA`, `SUBCUENTA`), naturaleza (`DEBITO` / `CREDITO`) y si la cuenta admite movimientos contables (`allowsMovements`).
- **Creación de cuentas (`POST /accounts`):** formulario con validación previa al envío (`RN-01`..`RN-08`), vista previa en tiempo real del nivel detectado, cuenta padre y naturaleza heredada (selector habilitado solo para `CLASE` de 1 dígito), y errores de la API mostrados en pantalla junto al campo correspondiente (`code`, `name`, `nature` o error general).
- **Eliminación segura desde el árbol (`DELETE /accounts/:code`):** flujo de confirmación en interfaz que muestra de forma visible el error devuelto por la API cuando la cuenta tiene cuentas hijas (`409 Conflict`) o no existe (`404 Not Found`), actualizando automáticamente el estado `allowsMovements` del padre tras eliminar.
- **Estados de carga, error y recuperación:** spinners, barras no destructivas de recarga/eliminación, banners de error con botón **Reintentar** y `ErrorBoundary` en React para evitar pantallas en blanco o errores visibles únicamente en consola.

---

## Requisitos

- **Node.js 22** (definido en `.nvmrc`; puedes usar `nvm use`).
- **npm 10 o superior** (verifica con `npm -v`).

---

## Cómo correr el proyecto

1. **Instalar dependencias** (raíz, `api/` y `web/`):

```bash
npm install
```

2. **Configurar variables de entorno (opcional):**
   - Frontend (`web/.env`, ver [web/.env.example](./web/.env.example)):
     - `VITE_API_URL` — URL base de la API (por defecto `http://localhost:3000`).
   - Backend (`api/`):
     - `WEB_ORIGIN` — origen permitido por CORS (por defecto `http://localhost:5173`).

3. **Levantar backend y frontend en paralelo:**

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Scripts disponibles (desde la raíz)

| Script | Descripción |
| --- | --- |
| `npm run dev` | Levanta `api/` (`:3000`) y `web/` (`:5173`) en paralelo en modo watch. |
| `npm run dev:api` | Levanta únicamente el backend NestJS. |
| `npm run dev:web` | Levanta únicamente el frontend React/Vite. |
| `npm run build` | Verifica tipos TypeScript y genera los builds de producción de `api/` y `web/`. |
| `npm test` | Ejecuta las pruebas unitarias e integración de `api/` con Vitest. |
| `npm run lint` | Ejecuta `oxlint` en `api/` y `web/`. |

---

## Arquitectura y decisiones técnicas

### Estructura del Frontend (`web/src/`)

Se optó por una arquitectura modular por responsabilidad, sin dependencias externas de UI ni manejo de estado global, manteniendo el bundle ligero y el código fácil de seguir:

```text
web/src/
├── api.ts                         # Helper de base URL (VITE_API_URL)
├── types/account.ts               # Contratos TypeScript alineados a la API REST
├── domain/accountRules.ts         # Reglas puras en cliente (nivel, padre, validaciones y mapeo de errores API por campo)
├── services/
│   ├── httpClient.ts              # Cliente fetch tipado, parseo seguro de JSON y errores NestJS (ApiError)
│   └── accountsApi.ts             # Operaciones GET /accounts, POST /accounts y DELETE /accounts/:code
├── hooks/useAccounts.ts           # Estado centralizado del catálogo (loading, creating, deletingCode, errores y recarga)
├── components/
│   ├── AccountTree.tsx            # Árbol de cuentas con toolbar, expandir/colapsar todo y feedback de borrado
│   ├── AccountTreeItem.tsx        # Fila recursiva del árbol con badges y error inline por nodo
│   ├── CreateAccountForm.tsx      # Formulario controlado con validación previa y errores junto a cada campo
│   ├── ConfirmDeleteModal.tsx     # Diálogo accesible de confirmación de borrado
│   ├── FeedbackStates.tsx         # LoadingState, RefreshingBar y ErrorBanner reutilizables
│   └── ErrorBoundary.tsx          # Captura de errores inesperados de renderizado
└── styles/tokens.css              # Tokens CSS (paleta, tipografía, badges y espaciado)
```

### Decisiones clave

1. **Contrato REST único y explícito:** `web/` y `api/` comparten el contrato documentado en [docs/arquitectura.md](./docs/arquitectura.md):
   - `GET /accounts` → `200 OK` (`AccountTreeNode[]`)
   - `POST /accounts` → `201 Created` | `400 Bad Request` | `409 Conflict` | `422 Unprocessable Entity`
   - `DELETE /accounts/:code` → `204 No Content` | `404 Not Found` | `409 Conflict`
2. **Doble barrera de validación (cliente + servidor):** el formulario valida formato numérico, longitudes válidas (`1/2/4/6`), duplicados, existencia del padre y naturaleza obligatoria en `CLASE` antes de enviar; al mismo tiempo, cualquier error devuelto por la API (`400`, `409`, `422`) se clasifica y se muestra junto al campo correspondiente (`code`, `name` o `nature`).
3. **Estado de colapso por conjunto (`collapsedCodes`):** guardar los nodos colapsados en lugar de los expandidos permite que el árbol inicie legible y que al crear nuevas cuentas las ramas recién agregadas aparezcan expandidas sin perder el estado de los nodos que el usuario cerró manualmente.
4. **Cero librerías de UI / estado innecesarias:** con CSS estructurado mediante variables en `tokens.css` y un custom hook (`useAccounts`) se cubre todo el flujo sin sobrecargar dependencias ni complejidad accidental.
5. **Persistencia y dominio desacoplados en `api/`:** el backend separa dominio puro, casos de uso (`AccountsService`) y persistencia SQLite detrás de `IAccountRepository`, con `allowsMovements` calculado dinámicamente al construir el árbol en $O(n)$ para evitar inconsistencias.

---

## Qué se dejó afuera

- Registro de asientos o movimientos contables (solo se calcula y expone si cada cuenta admite movimientos).
- Edición de nombre o recodificación de cuentas existentes.
- Autenticación, roles de usuario y soporte multi-empresa.
- Importación y exportación masiva (CSV / Excel).
- Pruebas automatizadas de componentes en `web/` (las pruebas unitarias y e2e se concentran en `api/`).

---

## Qué haríamos con más tiempo

1. **Pruebas de frontend con Vitest + React Testing Library:** cubrir validación del formulario, mapeo de errores por campo, expandir/colapsar árbol y flujo de confirmación/error al eliminar.
2. **Búsqueda y filtrado en el árbol:** filtrar por código, nombre, naturaleza o solo cuentas que admiten movimientos, resaltando las coincidencias y expandiendo automáticamente sus ancestros.
3. **Edición de cuentas y carga de plan semilla:** permitir renombrar cuentas existentes y ofrecer un botón para cargar un plan de cuentas base de ejemplo.
4. **Virtualización / escalabilidad:** para catálogos con miles de subcuentas, incorporar virtualización de lista en el árbol y atajos de teclado completos (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` según WAI-ARIA TreeView).
5. **Internacionalización y tema oscuro:** soporte explícito para modo oscuro mediante los tokens CSS ya preparados en `web/src/styles/tokens.css`.

---

## Documentación adicional

- [docs/README.md](./docs/README.md) — Índice general de documentación y convenciones.
- [docs/requerimientos.md](./docs/requerimientos.md) — Requerimientos funcionales (`RF`), no funcionales (`RNF`), reglas de negocio (`RN-01`..`RN-08`) y diagrama de casos de uso.
- [docs/arquitectura.md](./docs/arquitectura.md) — Diagramas de arquitectura, clases, secuencias, flujos y contrato JSON.
- [docs/base-de-datos.md](./docs/base-de-datos.md) — Modelo relacional autoreferenciado, ERD y DDL.
- [docs/tarjetas.md](./docs/tarjetas.md) — Tablero de seguimiento de tareas del proyecto.
