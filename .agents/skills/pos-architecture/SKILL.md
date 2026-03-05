---
name: pos-architect
description: Arquitectura limpia y buenas prácticas Angular 18 para el POS
version: 1.0
---

# Angular 18 + Clean Architecture + DDD - Reglas del Proyecto

## 1. Reglas Generales de Angular 18+

- Usar Standalone Components (NO NgModules nuevos).
- Preferir `provideHttpClient` en app.config.ts.
- Usar `inject()` en lugar de constructor injection cuando sea apropiado.
- No usar subscribe manual en components (usar async pipe o signals).
- No usar lógica pesada dentro del component.
- Usar ChangeDetectionStrategy.OnPush siempre.
- No usar any.
- No usar console.log (usar LoggerService).

## 2. Arquitectura Limpia (Obligatorio)

Este proyecto sigue Clean Architecture estricta.

### Capas:

Presentation
Application
Domain
Infrastructure
Core (transversal)

### Reglas Inquebrantables:

- Domain NO depende de Angular.
- Domain NO importa nada de Infrastructure.
- Application solo depende de Domain.
- Infrastructure implementa puertos definidos en Domain.
- Presentation solo usa UseCases.
- Components NO deben usar HttpClient directamente.
- Components NO deben usar repositorios directamente.

Flujo correcto:

Component → UseCase → Repository (Puerto) → RepositoryImpl → HttpClient

Flujo incorrecto:

Component → HttpClient
Component → RepositoryImpl
Domain → Angular

## 3. Domain-Driven Design (DDD)

### Entidades
- Son inmutables.
- Contienen comportamiento.
- No contienen lógica de infraestructura.
- No usan decoradores Angular.

### Value Objects
- Son inmutables.
- Representan conceptos del dominio.
- No exponen setters.

### Repositories
- En Domain solo se definen como interfaces (puertos).
- Nunca implementar lógica HTTP en Domain.

### UseCases
- Contienen lógica de aplicación.
- No contienen lógica de UI.
- No contienen lógica de infraestructura directa.
- Solo orquestan entidades y repositorios.

## 4. Estado y Reactividad

- Preferir Signals para estado local.
- Usar RxJS solo cuando sea necesario (HTTP, streams externos).
- No mezclar signals y subjects sin justificación.
- No usar BehaviorSubject para todo.
- Evitar subscribes manuales.

## 5. HTTP

- Toda llamada HTTP debe pasar por RepositoryImpl.
- Nunca usar HttpClient en components.
- Interceptors deben ser puros y pequeños.
- No duplicar lógica de retry.
- No hardcodear status codes.

## 6. Manejo de Errores

- Centralizar en http-error.interceptor.ts.
- No capturar errores en components si ya están centralizados.
- Usar LoggerService para registrar errores.

## 7. Performance

- Siempre usar ChangeDetectionStrategy.OnPush.
- Evitar funciones en template.
- Evitar getters costosos.
- No crear objetos nuevos en template.

## 8. Cuando se cree una nueva feature

Debe respetar esta estructura:

feature-name/
  domain/
  application/
  infrastructure/
  presentation/

No mezclar carpetas.
No omitir capas.
No saltarse usecases.

## 9. Anti-Patterns Prohibidos

- Lógica de negocio en components
- HttpClient fuera de infrastructure
- Acceso directo a localStorage
- Usar any
- Mezclar DTO con entidades
- Duplicar mappers
- Hacer refresh token manual en components

## 10. Modo Arquitecto

Cuando propongas código:

1. Explica qué capa estás modificando.
2. Justifica por qué esa capa es la correcta.
3. Verifica que no se rompa Clean Architecture.
4. Sugiere mejoras si detectas code smells.
5. Prioriza mantenibilidad sobre rapidez.

## 11. Decisiones Arquitectónicas

- Se usa Clean Architecture para desacoplar dominio.
- Se usa DDD para modelar reglas del negocio.
- Se usa interceptor para manejo automático de JWT.
- Se usa retry strategy centralizada.
- Se desacopla almacenamiento mediante StoragePort.

## 12. Regla de Dependencias (Dependency Rule)

Las dependencias solo pueden apuntar hacia adentro:

Presentation → Application → Domain  
Infrastructure → Domain  
Core → No depende de Features  

Domain nunca depende de ninguna otra capa.

Si una clase necesita algo externo, debe depender de un puerto (interface).

## 13. DTO vs Entidades

- DTO solo existe en Application e Infrastructure.
- Entidades solo existen en Domain.
- Nunca exponer DTOs a Presentation.
- Siempre mapear DTO → Entidad mediante Mapper.
- Nunca usar Entidades como modelos HTTP directos.

## 14. Estado Global

- El estado de sesión se maneja exclusivamente en SessionStateService.
- Nunca acceder directamente a LocalStorageService desde components.
- No almacenar tokens en múltiples lugares.
- El estado debe tener una única fuente de verdad.

## 16. Testing

- Domain debe poder probarse sin Angular.
- UseCases deben probarse sin HttpClient real.
- Infrastructure puede usar mocks.
- Nunca probar lógica de negocio dentro de components.

## 17. Escalabilidad

- Cada nueva feature debe ser independiente.
- No compartir lógica entre features directamente.
- Si algo es transversal, moverlo a Core.
- No crear dependencias cruzadas entre features.

## 18. Principios de Diseño

- Priorizar bajo acoplamiento.
- Priorizar alta cohesión.
- Preferir composición sobre herencia.
- Seguir SOLID.
- Evitar soluciones rápidas que rompan arquitectura.

## Arquitectura HTTP

- Patrón de orquestación de actualización de tokens
- Control de actualización concurrente mediante shareReplay
- Interceptor HTTP funcional (Angular 16+)
- Separación de preocupaciones en interceptores
- Patrón de orquestador para preocupaciones transversales
- Abstracción de la estrategia de reintento