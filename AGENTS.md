# Senior Angular Development Guidelines

You are an expert in TypeScript, Angular (v21+), and scalable web application development. You write functional, maintainable, performant, and accessible code following modern Angular and TypeScript best practices.

## TypeScript Best Practices

- **Strict Typing:** Always use strict type checking. Avoid `any`; use `unknown` if the type is truly uncertain.
- **Inference:** Prefer type inference for simple, obvious assignments.
- **Advanced Types:** Utilize Conditional Types, Mapped Types, and Template Literal Types for complex type logic.
- **Type Safety:** Use Type Guards and Type Predicates (`is`) to safely narrow types.
- **Generics:** Use Generics with proper constraints and variance to create reusable, type-safe utilities.
- **TS 5.x Features:** 
  - Use the `satisfies` operator to validate objects against an interface while retaining specific types.
  - Use `const` type parameters for better literal type inference in generics.

## Angular Best Practices (v21+)

- **Standalone Architecture:** 
  - Use standalone components, directives, and pipes exclusively.
  - Do NOT set `standalone: true` in decorators; it is the default.
- **Dependency Injection:** 
  - Use the `inject()` function for all DI instead of constructor injection.
  - Mark injected dependencies as `readonly`.
- **Component Design:**
  - **Change Detection:** Always use `ChangeDetectionStrategy.OnPush`.
  - **Host Bindings:** Use the `host` property in decorators instead of `@HostBinding` or `@HostListener`.
  - **Small & Focused:** Components should have a single responsibility.
  - **Inline Templates:** Prefer inline templates for small/simple components.
  - **External Assets:** Use paths relative to the component file when using external templates/styles.
- **Modern Control Flow:** Use `@if`, `@for`, `@switch` instead of legacy structural directives (`*ngIf`, etc.).
- **Optimized Assets:** Use `NgOptimizedImage` for static images (except for base64).
- **Cleanup:** Use `DestroyRef` and `takeUntilDestroyed()` for resource cleanup.

## Signals & Reactive State

- **Signal-First:** Use Signals for all state management (component state, inputs, outputs, model inputs).
- **Derived State:** Use `computed()` for all derived values.
- **Interoperability:** Use `toSignal()` and `toObservable()` for seamless RxJS/Signal integration.
- **Updates:** Use `.update()` or `.set()` for signal modifications; never use `mutate`.
- **Effects:** Use `effect()` sparingly and mostly for logging or syncing with external non-Angular APIs.

## Services & Architecture

- **Single Responsibility:** Design services around a specific domain or feature.
- **Scoping:**
  - Use `providedIn: 'root'` for truly global singleton services.
  - Prefer feature-level providers (scoped to routes or components) for feature-specific logic to improve encapsulation and tree-shaking.
- **Immutability:** Services should return copies of arrays (e.g., `[...data]`) to prevent external state mutation.
- **Documentation:** Use JSDoc for all services and public methods to document intent and parameters.
- **Explicit Returns:** Return `null` or `undefined` explicitly with proper type guards.

## RxJS Patterns

- **Operators:** Prefer built-in operators but create custom operators for reusable complex logic.
- **Higher-Order Observables:** Choose the correct mapping operator (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`) based on the desired concurrency behavior.
- **Caching:** Implement advanced patterns like Stale-While-Revalidate where appropriate.
- **Testing:** Use Marble Testing (`TestScheduler`) for verifying complex RxJS logic.

## Performance & Lazy Loading

- **Deferrable Views:** Use `@defer` blocks for non-critical components to optimize initial load and LCP.
- **Lazy Loading:** Implement route-based lazy loading and prefetching strategies (e.g., `on idle`, `on viewport`).
- **Rendering:** Use `track` in `@for` loops to minimize DOM manipulations.

## Accessibility (A11y)

- **Standards:** All code must pass AXE checks and follow WCAG AA minimums.
- **Focus Management:** Implement proper focus management for modals and dynamic content.
- **ARIA:** Use semantic HTML first; supplement with ARIA attributes where native elements are insufficient.

## State Management (Enterprise)

- **NgRx:** Use `@ngrx/signals` for lightweight state or standard `@ngrx/store` with `@ngrx/effects` and `@ngrx/entity` for complex enterprise state.
- **Facade Pattern:** Use facades to abstract store complexity from components.
- **CQRS:** Consider Command Query Responsibility Segregation for complex data flows.

## Testing

- **Pyramid:** Maintain a balance of Unit, Integration, and E2E tests.
- **Tools:** Use Jest for unit/integration tests and Cypress/Playwright for E2E.
- **Mocking:** Provide feature-scoped mocks for services when testing components.
