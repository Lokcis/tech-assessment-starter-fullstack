# Seguimiento de Tarjetas — Catálogo de Cuentas

Tablero de seguimiento para organizar las partes a trabajar del proyecto en la rama `feat/tarjetas` (`feat/tarjetas` → `dev` → `main`).

## Leyenda de estados

- `[ ]` **Pendiente**
- `[-]` **En progreso**
- `[!]` **Bloqueado**
- `[x]` **Hecho**

**Prioridades:** `P0` (Crítica) · `P1` (Alta) · `P2` (Media) · `P3` (Baja)

---

## Resumen rápido

| ID | Tarjeta | Área | Prioridad | Estado |
| --- | --- | --- | :---: | :---: |
| T-01 | Documentar requerimientos, RN y casos de uso del catálogo | Docs | P0 | `[x]` Hecho |
| T-02 | Diseñar modelo relacional autoreferenciado y ERD (`accounts`) | DB | P0 | `[x]` Hecho |
| T-03 | Documentar arquitectura, clases, flujos y contrato REST | Arquitectura | P0 | `[x]` Hecho |
| T-04 | Implementar dominio puro del catálogo (niveles, prefijos, naturaleza, árbol) | Backend | P0 | `[x]` Hecho |
| T-05 | Implementar persistencia SQLite detrás de `IAccountRepository` | Backend | P0 | `[x]` Hecho |
| T-06 | Implementar `AccountsService`, `AccountsController` y validaciones HTTP | Backend | P0 | `[x]` Hecho |
| T-07 | Diseñar estructura de `web/` y cliente HTTP para `/accounts` | Frontend | P1 | `[x]` Hecho |
| T-08 | Implementar vista de árbol anidado, formulario de creación y eliminación | Frontend | P1 | `[x]` Hecho |
| T-09 | Escribir pruebas unitarias e integración (Vitest + Supertest) | QA | P1 | `[x]` Hecho |
| T-10 | Revisar lint, build, actualizar `README.md` e integrar `feat/tarjetas -> dev -> main` | Entrega | P2 | `[x]` Hecho |
| T-11 | Actualizar documentación con los 5 opcionales y contrato `PATCH /accounts/:code` | Docs | P1 | `[x]` Hecho |
| T-12 | Implementar endpoint `PATCH /accounts/:code` (renombrar) + pruebas unitarias y E2E | Backend | P1 | `[x]` Hecho |
| T-13 | Migrar estado del servidor en `web/` a caché e invalidación (TanStack Query) | Frontend | P1 | `[x]` Hecho |
| T-14 | Mostrar nivel y naturaleza en el árbol + búsqueda con auto-expansión de ramas | Frontend | P1 | `[x]` Hecho |
| T-15 | Crear hija desde nodo padre (código prellenado) + renombrar cuenta desde el árbol | Frontend | P1 | `[x]` Hecho |
| T-16 | Verificación integral de opcionales, `README.md` e integración `feat/opcionales -> dev -> main` | Entrega | P2 | `[ ]` Pendiente |

---

## Detalle por fase

### Fase 1: Análisis y Documentación (`docs/`)

- [x] **T-01 · Documentar requerimientos, RN y casos de uso del catálogo** (`P0`)
  - Contexto, actores, diagrama de casos de uso, `RF-01`..`RF-03`, `RN-01`..`RN-08` y alcance en [requerimientos.md](./requerimientos.md).

- [x] **T-02 · Diseñar modelo relacional autoreferenciado y ERD** (`P0`)
  - Tabla `accounts` con autoreferencia `parent_code`, `ON DELETE RESTRICT`, DDL, índices y estrategia SQLite en [base-de-datos.md](./base-de-datos.md).

- [x] **T-03 · Documentar arquitectura, clases, flujos y contrato REST** (`P0`)
  - Diagramas de arquitectura, clases y flujos (`POST`, `GET`, `DELETE`) + contrato JSON en [arquitectura.md](./arquitectura.md).

---

### Fase 2: Backend (`api/` — NestJS + TypeScript)

- [x] **T-04 · Dominio del Catálogo de Cuentas** (`P0`)
  - Definir `Account`, `AccountLevel` (`CLASE`, `GRUPO`, `CUENTA`, `SUBCUENTA`), `AccountNature` (`DEBITO`, `CREDITO`) y `AccountTreeNode`.
  - Implementar resolución de nivel por longitud (`1/2/4/6`), cálculo de `parentCode` por prefijo y validación numérica.
  - Implementar `buildAccountTree` con cálculo de `allowsMovements`.

- [x] **T-05 · Capa de Persistencia (SQLite + Puerto de Repositorio)** (`P0`)
  - Definir interfaz `IAccountRepository`.
  - Implementar `SqliteAccountRepository` con `PRAGMA foreign_keys = ON` y DDL idempotente.
  - Implementar `InMemoryAccountRepository` para pruebas unitarias.

- [x] **T-06 · Servicio, Controlador y Módulo NestJS (`AccountsModule`)** (`P0`)
  - `POST /accounts`: validar formato, unicidad (`409`), existencia de padre (`422`), naturaleza en clase (`400`) y herencia/consistencia en hijas (`422`).
  - `GET /accounts`: retornar catálogo completo en árbol anidado ordenado por código.
  - `DELETE /accounts/:code`: validar existencia (`404`) y rechazar si tiene hijas (`409`).

---

### Fase 3: Frontend (`web/` — React + Vite + TypeScript) *(rama `feat/web` → `dev` → `main`)*

- [x] **T-07 / T-08 · Plan de 5 Tareas de Frontend y Entrega (`feat/web`)** (`P1`)
  - [x] **Tarea 1 (`FW-01`):** Pantalla que muestra el catálogo de cuentas como árbol anidado, con expandir y colapsar (incluye estructura base de `web/src/`, tipos del contrato REST, cliente HTTP inicial y estilos base).
  - [x] **Tarea 2 (`FW-02`):** Formulario para crear una cuenta, con validación previa al envío y errores de la API visibles en pantalla junto al campo correspondiente (`code`, `name`, `nature` o error general).
  - [x] **Tarea 3 (`FW-03`):** Eliminar una cuenta desde el árbol con confirmación, mostrando el error en pantalla cuando la cuenta tiene hijas (`409 Conflict`) o no existe (`404`).
  - [x] **Tarea 4 (`FW-04`):** Estados de carga y de error completos en las operaciones (lectura, creación y eliminación), sin pantallas en blanco ni errores solo en consola, con reintento y feedback visual consistente.
  - [x] **Tarea 5 (`FW-05`):** Actualizar `README.md` raíz con el apartado de entregables (cómo correr el proyecto, decisiones técnicas, qué quedó fuera y mejoras futuras), validar `lint` y `build` en verde e integrar `feat/web` → `dev` → `main`.

---

### Fase 4: Calidad y Entrega

- [x] **T-09 · Pruebas automatizadas (`api/`)** (`P1`)
  - Pruebas unitarias de reglas de dominio (`resolveLevel`, `resolveParentCode`, `buildAccountTree`, `AccountsService`).
  - Pruebas e2e con Supertest cubriendo casos felices y errores (`400`, `404`, `409`, `422`).

- [x] **T-10 · Verificación final y entrega** (`P2`)
  - `npm test`, `npm run lint` y `npm run build` en verde.
  - Actualizar `README.md` raíz con decisiones técnicas, ejecución y mejoras futuras.
  - Integrar cambios `feat/tarjetas` → `dev` → `main`.

---

### Fase 5: Funcionalidades Opcionales (`feat/opcionales` → `dev` → `main`)

- [x] **T-11 · Documentación de opcionales (`docs/`)** (`P1`)
  - Actualizar [requerimientos.md](./requerimientos.md) (`RF-04`..`RF-07`, `RN-09`, `RN-10`, `RNF-06` y diagrama de casos de uso).
  - Actualizar [arquitectura.md](./arquitectura.md) (TanStack Query, diagrama de clases, flujo `PATCH /accounts/:code` y contrato REST).
  - Actualizar [base-de-datos.md](./base-de-datos.md) con la operación segura de renombrado.

- [x] **T-12 · Endpoint `PATCH /accounts/:code` en `api/`** (`P1`)
  - Agregar `updateName(code, name)` a `IAccountRepository`, `SqliteAccountRepository` e `InMemoryAccountRepository`.
  - Implementar `RenameAccountDto`, `AccountsService.rename()` y `@Patch(':code')` en `AccountsController`.
  - Agregar pruebas unitarias (servicio + repositorio) y pruebas E2E (`200`, `400`, `404`).

- [x] **T-13 · Caché e invalidación en `web/` (TanStack Query)** (`P1`)
  - Instalar `@tanstack/react-query` y configurar `QueryClientProvider`.
  - Migrar lectura (`useQuery(['accounts'])`) y mutaciones (`create`, `rename`, `delete`) usando `invalidateQueries(['accounts'])`.

- [x] **T-14 · Badges de nivel/naturaleza y búsqueda en el árbol (`web/`)** (`P1`)
  - Mostrar nivel (`CLASE`, `GRUPO`, `CUENTA`, `SUBCUENTA`) y naturaleza (`DEBITO`, `CREDITO`) en cada nodo del árbol.
  - Agregar buscador por código o nombre que abra automáticamente las ramas donde haya coincidencia y resalte los resultados.

- [x] **T-15 · Acciones contextuales en el árbol (`web/`)** (`P1`)
  - Botón "Crear hija" en nodos `CLASE`, `GRUPO` y `CUENTA` (oculto/deshabilitado en `SUBCUENTA`) que prellena el código del padre en el formulario.
  - Acción "Renombrar" desde el nodo del árbol conectada a `PATCH /accounts/:code` con validación e invalidación de caché.

- [ ] **T-16 · Verificación integral e integración (`feat/opcionales` → `dev` → `main`)** (`P2`)
  - Ejecutar `npm test`, `npm run test:e2e --prefix api`, `npm run lint` y `npm run build` en verde.
  - Actualizar `README.md` con los opcionales implementados e integrar hacia `dev` y `main`.
