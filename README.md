# Catálogo de Cuentas Contables — Prueba Técnica Full-Stack

Aplicación full-stack para gestionar un **Catálogo de Cuentas Contables** jerárquico (Plan de Cuentas: Clase, Grupo, Cuenta y Subcuenta), construida con **NestJS + TypeScript + SQLite** (`api/`) y **React 19 + Vite 8 + TypeScript** (`web/`).

## Reglas de negocio y funcionalidad implementada

- **Identificación clave-valor:** Cada cuenta tiene un código numérico único (`code`) y un nombre (`name`).
- **Niveles por longitud de código:** `1` dígito → `CLASE`, `2` dígitos → `GRUPO`, `4` dígitos → `CUENTA`, `6` dígitos → `SUBCUENTA`.
- **Jerarquía por prefijo:** El padre de `110505` es `1105`, el de `1105` es `11`, el de `11` es `1`; las clases (`1` dígito) no tienen padre.
- **Integridad de creación:** No se puede crear una cuenta si su padre no existe (`422`) ni duplicar un código existente (`409`).
- **Naturaleza contable heredada:** Cada `CLASE` define su naturaleza (`DEBITO` o `CREDITO`) y todos sus descendientes la heredan automáticamente (rechazando cualquier naturaleza incompatible con `422`).
- **Admisión de movimientos:** Solo las cuentas sin hijas (nodos hoja) admiten movimientos contables (`allowsMovements: true`), calculado dinámicamente al construir el árbol.
- **Protección al eliminar:** No se puede eliminar una cuenta que tenga cuentas hijas (`409 Conflict`).
- **Interfaz web completa (`web/`):**
  - Árbol jerárquico con expandir/colapsar por nodo, botones globales (**Expandir todo / Colapsar todo**) e indicadores de nivel, naturaleza y `Admite movimientos`.
  - Formulario de creación con validación previa al envío, vista previa en tiempo real de nivel/padre/naturaleza heredada y errores de la API mostrados junto al campo correspondiente (`code`, `name`, `nature` o error general).
  - Eliminación desde el árbol con modal de confirmación y visualización clara del error cuando la cuenta tiene hijas.
  - Estados de carga, recarga no destructiva, banners de error con reintento y `ErrorBoundary` para evitar pantallas en blanco o errores solo en consola.

---

## Requisitos

- **Node.js 22** (definido en `.nvmrc`; puedes usar `nvm use`).
- **npm 10 o superior** (verifica con `npm -v`).

## Cómo correr el proyecto

```bash
# 1. Instalar dependencias (raíz, api/ y web/)
npm install

# 2. Levantar API (:3000) y Frontend (:5173) juntos
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000

### Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta `api/` (`:3000`) y `web/` (`:5173`) en modo watch |
| `npm run dev:api` | Levanta solo la API (`:3000`) |
| `npm run dev:web` | Levanta solo el frontend (`:5173`) |
| `npm run build` | Compila TypeScript y genera builds de producción de `api/` y `web/` |
| `npm test` | Ejecuta pruebas unitarias de la API con Vitest |
| `npm run test:e2e --prefix api` | Ejecuta pruebas E2E HTTP con Supertest |
| `npm run lint` | Ejecuta `oxlint` en `api/` y `web/` |

### Variables de entorno

| Variable | Ubicación | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `PORT` | `api/` | `3000` | Puerto HTTP de la API |
| `WEB_ORIGIN` | `api/` | `http://localhost:5173` | Origen permitido por CORS |
| `ACCOUNTS_DB_PATH` | `api/` | `api/data/catalog.db` | Ruta del archivo SQLite (o `:memory:`) |
| `VITE_API_URL` | `web/` | `http://localhost:3000` | URL base de la API consumida por el front (ver [web/.env.example](./web/.env.example)) |

---

## Endpoints principales

| Método | Ruta | Descripción | Códigos HTTP |
| :---: | --- | --- | --- |
| `GET` | `/accounts` | Retorna el catálogo completo como árbol anidado ordenado por código. | `200` |
| `POST` | `/accounts` | Crea una cuenta validando código, unicidad, padre y naturaleza. | `201`, `400`, `409`, `422` |
| `DELETE` | `/accounts/:code` | Elimina una cuenta hoja; rechaza si tiene hijas o no existe. | `204`, `404`, `409` |

---

## Arquitectura y decisiones técnicas

### Backend (`api/src/accounts/`)

1. **Arquitectura por capas:**
   - `domain/`: Tipos, reglas puras (nivel por longitud, prefijo de padre, herencia de naturaleza), constructor de árbol en $O(n)$ y puerto `IAccountRepository`, sin acoplamiento a NestJS ni SQLite.
   - `application/`: `AccountsService` orquesta los casos de uso y traduce reglas de dominio a excepciones HTTP semánticas.
   - `infrastructure/`: `SqliteAccountRepository` usando `node:sqlite` (nativo de Node 22, sin compilación nativa ni contenedores externos) e `InMemoryAccountRepository` para tests unitarios.
   - `presentation/`: `AccountsController` y DTOs REST.
2. **Integridad en dos capas:** Las reglas críticas (unicidad de código, padre existente y bloqueo de borrado si tiene hijas) se validan tanto en `AccountsService` como en SQLite mediante `PRIMARY KEY`, `FOREIGN KEY ... ON DELETE RESTRICT` y `CHECK` constraints.
3. **`allowsMovements` derivado dinámicamente:** No se almacena como booleano mutable en BD para evitar desincronizaciones; se calcula a partir de `children.length === 0`.
4. **Código como `string` de dígitos:** Preserva longitud exacta y posibles ceros iniciales, evitando problemas de coerción numérica.

### Frontend (`web/src/`)

Se optó por una organización modular por responsabilidad, sin dependencias externas de UI ni manejo de estado global, manteniendo el bundle ligero y el código fácil de mantener:

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

- **Doble barrera de validación:** el formulario valida en cliente antes de enviar y además clasifica cualquier error devuelto por la API (`400`, `409`, `422`) junto al campo exacto (`code`, `name`, `nature`).
- **Estado de colapso por conjunto (`collapsedCodes`):** mantiene los nodos recién creados visibles/expandidos mientras conserva colapsados aquellos que el usuario cerró manualmente.

---

## Documentación técnica

Toda la documentación de análisis, diagramas y seguimiento está en [`docs/`](./docs/README.md):

- [Requerimientos y Diagrama de Casos de Uso](./docs/requerimientos.md)
- [Arquitectura, Diagrama de Clases, Diagramas de Flujo y Contratos API](./docs/arquitectura.md)
- [Modelo de Base de Datos y ERD](./docs/base-de-datos.md)
- [Tablero de Tarjetas](./docs/tarjetas.md)

## Convención de commits

Todos los commits del repositorio siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) con el formato `<tipo>(<alcance opcional>): <descripción>` (por ejemplo: `feat(api): ...`, `feat(web): ...`, `fix(web): ...`, `docs: ...`).

---

## Qué se dejó fuera y qué haríamos con más tiempo

### Fuera de alcance
- Registro de asientos/movimientos contables y saldos por cuenta.
- Edición de nombre o recodificación masiva de cuentas.
- Autenticación, autorización por roles y soporte multi-empresa.
- Importación/exportación masiva (CSV/Excel).
- Pruebas automatizadas de componentes en `web/` (las pruebas unitarias y E2E cubren `api/`).

### Mejoras con más tiempo
- **Pruebas de frontend** con Vitest + React Testing Library cubriendo validación, errores por campo, expandir/colapsar y flujo de borrado.
- **Migrar `IAccountRepository` a PostgreSQL** con migraciones versionadas manteniendo intacto el dominio.
- **Búsqueda y filtrado** en el árbol (por código, nombre, naturaleza o cuentas que admiten movimientos) y seed opcional de PUC estándar.
- **Documentación OpenAPI/Swagger** autogenerada en `/docs`.
- **Pipeline CI (GitHub Actions)** ejecutando `lint`, `test`, `test:e2e` y `build` en cada PR hacia `dev` y `main`.
