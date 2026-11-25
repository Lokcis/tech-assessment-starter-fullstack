# Documentación del Proyecto

Esta carpeta centraliza el análisis, diseño y seguimiento del proyecto full-stack (**NestJS** en `api/` + **React/Vite** en `web/`).

## Índice

| Documento | Descripción |
| --- | --- |
| [tarjetas.md](./tarjetas.md) | Tablero de seguimiento de tareas por fase, estado y prioridad. |
| [requerimientos.md](./requerimientos.md) | Requerimientos funcionales, no funcionales, diagrama de casos de uso, reglas de negocio y alcance. |
| [arquitectura.md](./arquitectura.md) | Arquitectura del sistema, decisiones técnicas, diagrama de arquitectura, diagrama de clases y diagrama de flujos. |
| [base-de-datos.md](./base-de-datos.md) | Modelo de datos, diagrama Entidad-Relación (ERD), diccionario de datos y estrategia de persistencia. |

## Flujo de trabajo sugerido

1. Completar [requerimientos.md](./requerimientos.md) con el enunciado y reglas de negocio.
2. Definir el modelo de persistencia en [base-de-datos.md](./base-de-datos.md).
3. Detallar capas, componentes y diagramas en [arquitectura.md](./arquitectura.md).
4. Desglosar y hacer seguimiento de cada entregable en [tarjetas.md](./tarjetas.md).

## Convención de commits

Todos los cambios en el repositorio **deben seguir obligatoriamente** la especificación [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/).

### Formato

```text
<tipo>(<alcance opcional>): <descripción>
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
| --- | --- |
| `feat` | Nueva funcionalidad para el usuario o la API. |
| `fix` | Corrección de un error o bug. |
| `docs` | Cambios únicamente en la documentación. |
| `refactor` | Refactorización de código que no corrige un bug ni agrega funcionalidad. |
| `test` | Adición o actualización de pruebas unitarias o de integración. |
| `chore` | Tareas de mantenimiento, configuración, dependencias o tooling. |
| `style` | Cambios de formato que no afectan la lógica (espacios, punto y coma, etc.). |
| `perf` | Mejoras de rendimiento. |
| `build` | Cambios en el sistema de compilación o dependencias externas. |
| `ci` | Cambios en archivos o scripts de integración continua. |

### Reglas y alcances recomendados

- **Alcances sugeridos:** `api`, `web`, `docs`, `db`.
- **Descripción:** breve, clara, en minúscula inicial y sin punto final.
- **Cambios incompatibles (Breaking Changes):** añadir `!` después del tipo/alcance (por ejemplo, `feat(api)!: ...`) o incluir el pie `BREAKING CHANGE: <detalle>`.

### Ejemplos

```text
feat(api): implementar dominio del catálogo de cuentas y pruebas unitarias
feat(web): implementar vista del catálogo de cuentas en árbol con expandir y colapsar
fix(api): validar herencia de naturaleza al crear subcuentas
docs: agregar guía de Conventional Commits en la documentación
test(api): cubrir validaciones de eliminación en pruebas e2e
chore: configurar scripts de lint y build en el monorepo
```

