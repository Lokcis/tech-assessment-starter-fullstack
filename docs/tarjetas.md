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
| T-05 | Implementar persistencia SQLite detrás de `IAccountRepository` | Backend | P0 | `[ ]` Pendiente |
| T-06 | Implementar `AccountsService`, `AccountsController` y validaciones HTTP | Backend | P0 | `[ ]` Pendiente |
| T-07 | Diseñar estructura de `web/` y cliente HTTP para `/accounts` | Frontend | P1 | `[ ]` Pendiente |
| T-08 | Implementar vista de árbol anidado, formulario de creación y eliminación | Frontend | P1 | `[ ]` Pendiente |
| T-09 | Escribir pruebas unitarias e integración (Vitest + Supertest) | QA | P1 | `[ ]` Pendiente |
| T-10 | Revisar lint, build, actualizar `README.md` e integrar `feat/tarjetas -> dev -> main` | Entrega | P2 | `[ ]` Pendiente |

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

- [ ] **T-05 · Capa de Persistencia (SQLite + Puerto de Repositorio)** (`P0`)
  - Definir interfaz `IAccountRepository`.
  - Implementar `SqliteAccountRepository` con `PRAGMA foreign_keys = ON` y DDL idempotente.
  - Implementar `InMemoryAccountRepository` para pruebas unitarias.

- [ ] **T-06 · Servicio, Controlador y Módulo NestJS (`AccountsModule`)** (`P0`)
  - `POST /accounts`: validar formato, unicidad (`409`), existencia de padre (`422`), naturaleza en clase (`400`) y herencia/consistencia en hijas (`422`).
  - `GET /accounts`: retornar catálogo completo en árbol anidado ordenado por código.
  - `DELETE /accounts/:code`: validar existencia (`404`) y rechazar si tiene hijas (`409`).

---

### Fase 3: Frontend (`web/` — React + Vite + TypeScript) *(rama `feat/web` → `dev` → `main`)*

- [ ] **T-07 / T-08 · Plan de 5 Tareas de Frontend y Entrega (`feat/web`)** (`P1`)
  - [x] **Tarea 1 (`FW-01`):** Pantalla que muestra el catálogo de cuentas como árbol anidado, con expandir y colapsar (incluye estructura base de `web/src/`, tipos del contrato REST, cliente HTTP inicial y estilos base).
  - [ ] **Tarea 2 (`FW-02`):** Formulario para crear una cuenta, con validación previa al envío y errores de la API visibles en pantalla junto al campo correspondiente (`code`, `name`, `nature` o error general).
  - [ ] **Tarea 3 (`FW-03`):** Eliminar una cuenta desde el árbol con confirmación, mostrando el error en pantalla cuando la cuenta tiene hijas (`409 Conflict`) o no existe (`404`).
  - [ ] **Tarea 4 (`FW-04`):** Estados de carga y de error completos en las operaciones (lectura, creación y eliminación), sin pantallas en blanco ni errores solo en consola, con reintento y feedback visual consistente.
  - [ ] **Tarea 5 (`FW-05`):** Actualizar `README.md` raíz con el apartado de entregables (cómo correr el proyecto, decisiones técnicas, qué quedó fuera y mejoras futuras), validar `lint` y `build` en verde e integrar `feat/web` → `dev` → `main`.

---

### Fase 4: Calidad y Entrega

- [ ] **T-09 · Pruebas automatizadas (`api/`)** (`P1`)
  - Pruebas unitarias de reglas de dominio (`resolveLevel`, `resolveParentCode`, `buildAccountTree`, `AccountsService`).
  - Pruebas e2e con Supertest cubriendo casos felices y errores (`400`, `404`, `409`, `422`).

- [ ] **T-10 · Verificación final y entrega** (`P2`)
  - `npm test`, `npm run lint` y `npm run build` en verde.
  - Actualizar `README.md` raíz con decisiones técnicas, ejecución y mejoras futuras.
  - Integrar cambios `feat/tarjetas` → `dev` → `main`.
