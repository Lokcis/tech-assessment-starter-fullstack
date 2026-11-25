# Arquitectura del Sistema — Catálogo de Cuentas

> Diseño arquitectónico, decisiones técnicas, diagrama de arquitectura, diagrama de clases, diagramas de flujo y contratos REST para el desarrollo en paralelo de `api/` y `web/`.

## 1. Visión General y Decisiones Técnicas

### Stack Tecnológico

| Capa | Tecnología | Ubicación | Puerto |
| --- | --- | --- | :---: |
| Frontend | React 19 + Vite 8 + TypeScript | `web/` | `5173` |
| Backend | NestJS 12 + Express + TypeScript | `api/` | `3000` |
| Base de Datos | SQLite (esquema SQL portable) | `api/data/catalog.db` | — |
| Pruebas | Vitest + Supertest | `api/` | — |
| Linter | oxlint | `api/` y `web/` | — |

### Decisiones de Arquitectura (ADRs)

1. **Arquitectura por capas en `api/src/accounts/`:**
   - `domain/`: Entidad `Account`, enums (`AccountLevel`, `AccountNature`), reglas puras de negocio (cálculo de nivel por longitud, cálculo de `parentCode` por prefijo, constructor de árbol `buildAccountTree`) y puerto `IAccountRepository`. Sin dependencias de NestJS ni SQLite.
   - `application/`: `AccountsService` orquesta los casos de uso (`create`, `getTree`, `remove`) aplicando validaciones de negocio y lanzando excepciones semánticas.
   - `infrastructure/`: Implementación concreta `SqliteAccountRepository` (y `InMemoryAccountRepository` para tests unitarios).
   - `presentation/`: `AccountsController` y DTOs (`CreateAccountDto`, `AccountTreeNodeDto`).
2. **Construcción del árbol en $O(n)$:** `GET /accounts` obtiene la lista ordenada por `code` en una sola consulta SQL y arma el árbol anidado en memoria mediante un `Map<string, AccountTreeNode>`, calculando `allowsMovements = node.children.length === 0`.
3. **Contrato API estable para trabajo en paralelo:** Los tipos JSON de entrada/salida definidos en la sección 5 sirven como contrato único entre `api/` y `web/`.

---

## 2. Diagrama de Arquitectura

```mermaid
flowchart LR
    User["Usuario / Contador (Navegador)"]

    subgraph Frontend["web/ (React 19 + Vite 8 :5173)"]
        UI["Vistas: Árbol de Cuentas + Formulario Crear"]
        State["Estado / Hooks (useAccounts)"]
        ApiClient["Cliente HTTP tipado (accountsApi.ts)"]
        UI --> State --> ApiClient
    end

    subgraph Backend["api/ (NestJS 12 :3000)"]
        Controller["AccountsController (REST)"]
        Service["AccountsService (Casos de Uso)"]
        Domain["Dominio (Account, Reglas de Prefijo/Nivel, TreeBuilder)"]
        Port["IAccountRepository (Puerto)"]
        Repo["SqliteAccountRepository (Adaptador)"]
        Controller --> Service
        Service --> Domain
        Service --> Port
        Repo -.->|implementa| Port
    end

    subgraph Data["Persistencia"]
        DB[("SQLite (accounts)")]
    end

    User -->|Interacción UI| UI
    ApiClient -->|HTTP / JSON| Controller
    Repo -->|SQL + FK RESTRICT| DB
```

---

## 3. Diagrama de Clases

```mermaid
classDiagram
    class AccountLevel {
        <<enumeration>>
        CLASE
        GRUPO
        CUENTA
        SUBCUENTA
    }

    class AccountNature {
        <<enumeration>>
        DEBITO
        CREDITO
    }

    class Account {
        +string code
        +string name
        +AccountLevel level
        +AccountNature nature
        +string | null parentCode
        +string createdAt
        +resolveLevel(code: string)$ AccountLevel
        +resolveParentCode(code: string)$ string | null
    }

    class AccountTreeNode {
        +string code
        +string name
        +AccountLevel level
        +AccountNature nature
        +string | null parentCode
        +boolean allowsMovements
        +AccountTreeNode[] children
    }

    class CreateAccountDto {
        +string code
        +string name
        +AccountNature? nature
    }

    class IAccountRepository {
        <<interface>>
        +findAllOrdered() Promise~Account[]~
        +findByCode(code: string) Promise~Account | null~
        +hasChildren(code: string) Promise~boolean~
        +create(account: Account) Promise~Account~
        +deleteByCode(code: string) Promise~void~
    }

    class SqliteAccountRepository {
        -db: DatabaseSync
        +findAllOrdered() Promise~Account[]~
        +findByCode(code: string) Promise~Account | null~
        +hasChildren(code: string) Promise~boolean~
        +create(account: Account) Promise~Account~
        +deleteByCode(code: string) Promise~void~
    }

    class AccountsService {
        -repository: IAccountRepository
        +create(dto: CreateAccountDto) Promise~AccountTreeNode~
        +getTree() Promise~AccountTreeNode[]~
        +remove(code: string) Promise~void~
    }

    class AccountsController {
        -accountsService: AccountsService
        +getTree() Promise~AccountTreeNode[]~
        +create(dto: CreateAccountDto) Promise~AccountTreeNode~
        +remove(code: string) Promise~void~
    }

    Account --> AccountLevel
    Account --> AccountNature
    AccountTreeNode --> AccountLevel
    AccountTreeNode --> AccountNature
    AccountTreeNode o-- AccountTreeNode : children
    SqliteAccountRepository ..|> IAccountRepository : implementa
    AccountsService --> IAccountRepository : depende de
    AccountsService ..> Account : valida y crea
    AccountsService ..> AccountTreeNode : construye árbol
    AccountsController --> AccountsService : invoca
    AccountsController ..> CreateAccountDto : recibe
```

---

## 4. Diagramas de Flujo

### 4.1 Flujo de Creación de Cuenta (`POST /accounts`)

```mermaid
flowchart TD
    Start(["POST /accounts"]) --> ValidateFmt{"¿code es numérico (/^\\d+$/), longitud 1/2/4/6 y name válido?"}
    ValidateFmt -- No --> Err400["400 Bad Request"]
    ValidateFmt -- Sí --> CheckDup{"¿Existe cuenta con ese code?"}
    CheckDup -- Sí --> Err409["409 Conflict (Código ya existe)"]
    CheckDup -- No --> IsClass{"¿Es CLASE (1 dígito)?"}

    IsClass -- Sí --> CheckNature{"¿nature es DEBITO o CREDITO?"}
    CheckNature -- No --> Err400Nat["400 Bad Request (Naturaleza requerida en clase)"]
    CheckNature -- Sí --> Save["Persistir cuenta en BD"]

    IsClass -- No --> FindParent["Buscar padre por prefijo (1, 2 o 4 dígitos)"]
    FindParent --> ParentExists{"¿Existe la cuenta padre?"}
    ParentExists -- No --> Err422Parent["422 Unprocessable Entity (Padre no existe)"]
    ParentExists -- Sí --> CheckInherit{"¿Se envió nature distinta a la del padre?"}
    CheckInherit -- Sí --> Err422Nat["422 Unprocessable Entity (Naturaleza debe coincidir con la clase)"]
    CheckInherit -- No --> Inherit["Heredar nature del padre"] --> Save

    Save --> Ok201(["201 Created (Cuenta con allowsMovements: true)"])
```

### 4.2 Flujo de Consulta en Árbol (`GET /accounts`)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant W as Frontend (web/)
    participant C as AccountsController
    participant S as AccountsService
    participant R as IAccountRepository
    participant DB as SQLite

    U->>W: Abre vista Catálogo de Cuentas
    W->>C: GET /accounts
    C->>S: getTree()
    S->>R: findAllOrdered()
    R->>DB: SELECT * FROM accounts ORDER BY code ASC
    DB-->>R: Filas planas ordenadas
    R-->>S: Account[]
    S->>S: buildAccountTree() + calcula allowsMovements
    S-->>C: AccountTreeNode[]
    C-->>W: 200 OK (Árbol JSON)
    W-->>U: Renderiza árbol jerárquico
```

### 4.3 Flujo de Eliminación de Cuenta (`DELETE /accounts/:code`)

```mermaid
flowchart TD
    Start(["DELETE /accounts/:code"]) --> Exists{"¿Existe la cuenta?"}
    Exists -- No --> Err404["404 Not Found"]
    Exists -- Sí --> HasKids{"¿Tiene cuentas hijas?"}
    HasKids -- Sí --> Err409["409 Conflict (No se puede eliminar cuenta con hijas)"]
    HasKids -- No --> Del["Eliminar cuenta de BD"]
    Del --> Ok204(["204 No Content"])
```

---

## 5. Contratos de API (Endpoints)

Base URL local: `http://localhost:3000`

| Método | Ruta | Descripción | Respuestas |
| :---: | --- | --- | --- |
| `GET` | `/accounts` | Devuelve el catálogo completo como árbol anidado. | `200 OK` |
| `POST` | `/accounts` | Crea una nueva cuenta aplicando todas las reglas del catálogo. | `201 Created`, `400 Bad Request`, `409 Conflict`, `422 Unprocessable Entity` |
| `DELETE` | `/accounts/:code` | Elimina una cuenta si no tiene hijas. | `204 No Content`, `404 Not Found`, `409 Conflict` |

### `POST /accounts`

**Request Body (Clase — 1 dígito):**
```json
{
  "code": "1",
  "name": "Activo",
  "nature": "DEBITO"
}
```

**Request Body (Grupo / Cuenta / Subcuenta — `nature` opcional, se hereda del padre):**
```json
{
  "code": "1105",
  "name": "Caja"
}
```

**Response `201 Created`:**
```json
{
  "code": "1105",
  "name": "Caja",
  "level": "CUENTA",
  "nature": "DEBITO",
  "parentCode": "11",
  "allowsMovements": true,
  "children": []
}
```

### `GET /accounts`

**Response `200 OK`:**
```json
[
  {
    "code": "1",
    "name": "Activo",
    "level": "CLASE",
    "nature": "DEBITO",
    "parentCode": null,
    "allowsMovements": false,
    "children": [
      {
        "code": "11",
        "name": "Disponible",
        "level": "GRUPO",
        "nature": "DEBITO",
        "parentCode": "1",
        "allowsMovements": false,
        "children": [
          {
            "code": "1105",
            "name": "Caja",
            "level": "CUENTA",
            "nature": "DEBITO",
            "parentCode": "11",
            "allowsMovements": false,
            "children": [
              {
                "code": "110505",
                "name": "Caja general",
                "level": "SUBCUENTA",
                "nature": "DEBITO",
                "parentCode": "1105",
                "allowsMovements": true,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
]
```

### Formato de Error Estándar (NestJS)

```json
{
  "statusCode": 409,
  "message": "No se puede eliminar la cuenta '1105' porque tiene cuentas hijas.",
  "error": "Conflict"
}
```
