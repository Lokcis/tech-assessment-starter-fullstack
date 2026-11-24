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

Todos los cambios en el repositorio siguen [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, etc.).

