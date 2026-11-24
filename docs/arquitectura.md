# Arquitectura del Sistema

> Documento de diseño arquitectónico para el proyecto full-stack (`api/` en NestJS + `web/` en React/Vite).

## 1. Visión General y Decisiones Técnicas

### Stack Tecnológico

| Capa | Tecnología | Ubicación | Puerto |
| --- | --- | --- | :---: |
| Frontend | React 19 + Vite 8 + TypeScript | `web/` | `5173` |
| Backend | NestJS 12 + Express + TypeScript | `api/` | `3000` |
| Pruebas | Vitest + Supertest | `api/` | — |
| Linter | oxlint | `api/` y `web/` | — |
| Base de Datos | _[Por definir: PostgreSQL / SQLite / etc.]_ | _[Local / Docker]_ | — |

### Decisiones de Arquitectura (ADRs)

1. **Separación por capas en `api/`:** _[Ej. Arquitectura modular por dominio (controllers -> services/use-cases -> repositories -> entities/DTOs)]_.
2. **Estructura en `web/`:** _[Ej. Organización por features/páginas, servicios HTTP desacoplados y tipos compartidos]_.
3. **Comunicación:** API REST sobre HTTP/JSON con CORS restringido a `WEB_ORIGIN`.
4. **Manejo de errores y validación:** _[Ej. ValidationPipe global + filtro de excepciones HTTP consistentes]_.

---

## 2. Diagrama de Arquitectura

```mermaid
flowchart LR
    User["Usuario (Navegador)"]

    subgraph Frontend["web/ (React + Vite :5173)"]
        UI["Vistas y Componentes"]
        State["Estado / Hooks"]
        ApiClient["Cliente HTTP (api.ts)"]
        UI --> State --> ApiClient
    end

    subgraph Backend["api/ (NestJS :3000)"]
        Controller["Controllers (REST + DTOs)"]
        Service["Services / Casos de Uso"]
        Domain["Entidades y Reglas de Negocio"]
        Repo["Repositories (Persistencia)"]
        Controller --> Service
        Service --> Domain
        Service --> Repo
    end

    subgraph Data["Capa de Datos"]
        DB[("Base de Datos")]
    end

    User -->|Interacción UI| UI
    ApiClient -->|HTTP / JSON| Controller
    Repo -->|Consultas / ORM| DB
```

---

## 3. Diagrama de Clases

> Plantilla base orientada a capas. Reemplazar `EntidadPrincipal` y sus propiedades/métodos con las entidades reales del dominio una vez definidos los requerimientos.

```mermaid
classDiagram
    class EntidadPrincipal {
        +string id
        +string nombre
        +string estado
        +Date createdAt
        +Date updatedAt
        +validarReglas() void
    }

    class CreateEntidadDto {
        +string nombre
    }

    class UpdateEntidadDto {
        +string nombre
        +string estado
    }

    class IEntidadRepository {
        <<interface>>
        +findAll() Promise~EntidadPrincipal[]~
        +findById(id: string) Promise~EntidadPrincipal | null~
        +create(data: EntidadPrincipal) Promise~EntidadPrincipal~
        +update(id: string, data: Partial~EntidadPrincipal~) Promise~EntidadPrincipal~
        +delete(id: string) Promise~void~
    }

    class EntidadRepository {
        +findAll() Promise~EntidadPrincipal[]~
        +findById(id: string) Promise~EntidadPrincipal | null~
        +create(data: EntidadPrincipal) Promise~EntidadPrincipal~
        +update(id: string, data: Partial~EntidadPrincipal~) Promise~EntidadPrincipal~
        +delete(id: string) Promise~void~
    }

    class EntidadService {
        -repository: IEntidadRepository
        +listar() Promise~EntidadPrincipal[]~
        +obtenerPorId(id: string) Promise~EntidadPrincipal~
        +crear(dto: CreateEntidadDto) Promise~EntidadPrincipal~
        +actualizar(id: string, dto: UpdateEntidadDto) Promise~EntidadPrincipal~
        +eliminar(id: string) Promise~void~
    }

    class EntidadController {
        -service: EntidadService
        +getAll() Promise~EntidadPrincipal[]~
        +getById(id: string) Promise~EntidadPrincipal~
        +create(dto: CreateEntidadDto) Promise~EntidadPrincipal~
        +update(id: string, dto: UpdateEntidadDto) Promise~EntidadPrincipal~
        +remove(id: string) Promise~void~
    }

    EntidadRepository ..|> IEntidadRepository : implementa
    EntidadService --> IEntidadRepository : depende de
    EntidadService ..> EntidadPrincipal : gestiona
    EntidadController --> EntidadService : invoca
    EntidadController ..> CreateEntidadDto : recibe
    EntidadController ..> UpdateEntidadDto : recibe
```

---

## 4. Diagramas de Flujo

### 4.1 Flujo general de una petición (Secuencia)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant W as Frontend (web/)
    participant C as Controller (api/)
    participant S as Service (api/)
    participant R as Repository (api/)
    participant DB as Base de Datos

    U->>W: Ejecuta acción en la interfaz
    W->>C: HTTP Request (JSON)
    C->>C: Valida DTO y parámetros
    alt Datos inválidos
        C-->>W: 400 Bad Request
        W-->>U: Muestra errores de validación
    else Datos válidos
        C->>S: Invoca caso de uso
        S->>S: Aplica reglas de negocio
        S->>R: Solicita operación de persistencia
        R->>DB: Ejecuta query / transacción
        DB-->>R: Resultado
        R-->>S: Entidad / colección
        S-->>C: Respuesta de dominio
        C-->>W: 200 OK / 201 Created (JSON)
        W-->>U: Actualiza vista y estado
    end
```

### 4.2 Flujo funcional principal (Actividad)

> Reemplazar los pasos con el flujo clave del dominio (por ejemplo: registro, aprobación, reserva, compra, etc.).

```mermaid
flowchart TD
    Start(["Inicio"]) --> Input["Usuario ingresa datos en UI"]
    Input --> ClientCheck{"¿Validación básica OK?"}
    ClientCheck -- No --> ShowClientErr["Mostrar error en formulario"] --> Input
    ClientCheck -- Sí --> ApiCall["Enviar petición a API"]
    ApiCall --> BizCheck{"¿Cumple reglas de negocio?"}
    BizCheck -- No --> ShowApiErr["Mostrar error de negocio (4xx)"] --> Input
    BizCheck -- Sí --> Persist["Guardar en Base de Datos"]
    Persist --> Refresh["Actualizar estado y vista"]
    Refresh --> End(["Fin"])
```

---

## 5. Contratos de API (Endpoints)

| Método | Ruta | Descripción | Request Body / Query | Respuestas |
| :---: | --- | --- | --- | --- |
| `GET` | `/health` _(o `/`)_ | Verificación de estado de la API | — | `200 OK` |
| `GET` | `/api/v1/[recurso]` | Listar registros | `?page=&limit=` | `200 OK` |
| `GET` | `/api/v1/[recurso]/:id` | Obtener detalle por ID | — | `200 OK`, `404 Not Found` |
| `POST` | `/api/v1/[recurso]` | Crear registro | `CreateDto` | `201 Created`, `400 Bad Request` |
| `PATCH` | `/api/v1/[recurso]/:id` | Actualizar registro | `UpdateDto` | `200 OK`, `400`, `404` |
| `DELETE` | `/api/v1/[recurso]/:id` | Eliminar registro | — | `204 No Content`, `404` |
