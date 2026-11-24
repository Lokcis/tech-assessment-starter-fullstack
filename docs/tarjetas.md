# Seguimiento de Tarjetas

Tablero de seguimiento para organizar las partes a trabajar del proyecto.

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
| T-01 | Definir requerimientos y reglas de negocio | Docs | P0 | `[ ]` Pendiente |
| T-02 | Diseñar modelo de base de datos y ERD | DB | P0 | `[ ]` Pendiente |
| T-03 | Definir arquitectura, clases y flujos | Arquitectura | P0 | `[ ]` Pendiente |
| T-04 | Configurar capa de persistencia / DB en `api/` | Backend | P0 | `[ ]` Pendiente |
| T-05 | Implementar módulos, entidades y lógica de dominio | Backend | P0 | `[ ]` Pendiente |
| T-06 | Exponer endpoints REST y validaciones (DTOs) | Backend | P0 | `[ ]` Pendiente |
| T-07 | Diseñar estructura del frontend y cliente API en `web/` | Frontend | P1 | `[ ]` Pendiente |
| T-08 | Implementar vistas, formularios y manejo de estado | Frontend | P1 | `[ ]` Pendiente |
| T-09 | Escribir pruebas unitarias e integración (`api/` y `web/`) | QA | P1 | `[ ]` Pendiente |
| T-10 | Revisar lint, build y actualizar `README.md` de entrega | Entrega | P2 | `[ ]` Pendiente |

---

## Detalle por fase

### Fase 1: Análisis y Documentación (`docs/`)

- [ ] **T-01 · Definir requerimientos y reglas de negocio** (`P0`)
  - Documentar objetivo del sistema, actores y diagrama de casos de uso en [requerimientos.md](./requerimientos.md).
  - Listar requerimientos funcionales (RF), no funcionales (RNF) y reglas de negocio (RN).
  - Definir criterios de aceptación y alcance (qué entra y qué queda fuera).

- [ ] **T-02 · Diseñar modelo de base de datos y ERD** (`P0`)
  - Elegir motor de base de datos / persistencia y justificar la decisión en [base-de-datos.md](./base-de-datos.md).
  - Completar diagrama Entidad-Relación (ERD) y diccionario de datos.
  - Definir índices, llaves foráneas, migraciones y datos semilla (seeds).

- [ ] **T-03 · Definir arquitectura, clases y flujos** (`P0`)
  - Documentar estructura de capas en `api/` y `web/` en [arquitectura.md](./arquitectura.md).
  - Actualizar diagrama de arquitectura, diagrama de clases y diagramas de flujo con el dominio real.
  - Definir contrato de endpoints (rutas, métodos, payloads y códigos HTTP).

---

### Fase 2: Backend (`api/` — NestJS + TypeScript)

- [ ] **T-04 · Configurar capa de persistencia / DB** (`P0`)
  - Instalar dependencias necesarias (ORM / driver / validación).
  - Configurar conexión, variables de entorno y migraciones/seeds.

- [ ] **T-05 · Implementar módulos, entidades y lógica de dominio** (`P0`)
  - Crear estructura de carpetas (módulos, entidades, repositorios, servicios).
  - Implementar casos de uso y reglas de negocio.

- [ ] **T-06 · Exponer endpoints REST y validaciones** (`P0`)
  - Implementar controladores, DTOs y pipes de validación.
  - Configurar manejo centralizado de errores HTTP.

---

### Fase 3: Frontend (`web/` — React + Vite + TypeScript)

- [ ] **T-07 · Diseñar estructura del frontend y cliente API** (`P1`)
  - Reemplazar la pantalla inicial de prueba en `web/src/App.tsx`.
  - Organizar carpetas (`components/`, `pages/`, `services/`, `types/`, etc.).
  - Implementar capa de consumo HTTP tipada sobre `VITE_API_URL`.

- [ ] **T-08 · Implementar vistas, formularios y manejo de estado** (`P1`)
  - Construir las pantallas principales según los requerimientos funcionales.
  - Manejar estados de carga, error, vacío y confirmaciones de usuario.

---

### Fase 4: Calidad y Entrega

- [ ] **T-09 · Pruebas automatizadas** (`P1`)
  - Escribir pruebas unitarias y e2e en `api/` con Vitest (`npm test`).
  - Validar flujos críticos de punta a punta entre `web/` y `api/`.

- [ ] **T-10 · Verificación final y documentación de entrega** (`P2`)
  - Ejecutar `npm run lint` y `npm run build` sin errores.
  - Reemplazar `README.md` raíz con instrucciones de ejecución, decisiones técnicas, trade-offs y mejoras futuras.
