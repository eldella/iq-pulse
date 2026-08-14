# Directivas de Desarrollo - IQ.Pulse

## Principios del Proyecto

- **Filosofía**: Herramienta de medición cognitiva gratuita, honesta, sin paywalls ni dark patterns.
- **UI/UX**: Estética pulida (estilo Apple), rápida y completamente responsiva. Priorizar soporte para `prefers-reduced-motion` y accesibilidad por teclado.

## Guía de Estilo y Convenciones

### TypeScript & React

- TypeScript estricto. Evitar `any` bajo cualquier circunstancia.
- Usar **React Server Components (RSC)** por defecto dentro de `app/`. Añadir `'use client'` únicamente cuando se necesite estado, hooks (`useState`, `useEffect`) o interactividad (Framer Motion).
- Extraer la lógica pura de cálculo o manipulación de datos a la carpeta `lib/` (ej. algoritmos de scoring, utilidades). Mantener los componentes centrados en la interfaz.

### Estilos & Design Tokens

- Usar exclusivamente los tokens semánticos definidos en `tailwind.config.ts` y `app/globals.css`:
  - Bordes: `rounded-control`, `rounded-card`, `rounded-sheet`.
  - Sombras: `shadow-accent-sm`, `shadow-accent-md`, `shadow-accent-lg`.
  - Colores semánticos: `danger`, `success`, `warn`, `surface-hover`.
- Usar `GlassCard` (`components/GlassCard.tsx`) para mantener el estilo de cristal/superficie unificado en toda la app.
- No escribir clases de color arbitrarias ni sombras inline si existe un token en la configuración.

### Animaciones (Framer Motion)

- Importar y reutilizar las variantes y presets centrales desde `@/lib/motion.ts`.
- Asegurar que todas las animaciones respeten la reducción de movimiento del usuario.

### Internacionalización (i18n)

- Todos los textos visibles por el usuario deben gestionarse a través del sistema i18n en `lib/i18n/` (soporte ES/EN).
- No hardcodear cadenas de texto directamente en los JSX/TSX.

## Comandos Principales

- `npm run dev`: Inicia el servidor de desarrollo con Turbopack.
- `npm run build`: Compila para producción. Ejecutar antes de confirmar cambios importantes para verificar que no haya errores de TypeScript o Lint.
- `npm run lint`: Pasa la verificación de ESLint.
- `npm test`: Corre los tests unitarios (Vitest).

## Arquitectura de Minijuegos (`/jugar`)

- La lógica de puntuación y dificultad adaptativa vive en `lib/scoring.ts` de forma pura (sin dependencias de UI ni de BD).
- Los minijuegos en `components/jugar/games/` deben limitarse a manejar la interacción, renderizar el juego actual y emitir el resultado al motor principal.

## Trabajo en Paralelo (5 Terminales)

Reglas generales para cuando el trabajo se reparte en varias terminales/worktrees en simultáneo. Las instrucciones específicas de qué hace cada una viven en `terminales/terminal-N-*.txt`, no acá — esto es solo lo que aplica a las 5 por igual.

- **Nunca las 5 sobre la misma carpeta.** Cada terminal trabaja en su propio `git worktree` (carpeta física separada, misma repo, rama propia) — si dos editan `D:\Paginaminijuegos` a la vez se pisan los cambios sin commitear. Setup (una sola vez, desde `D:\Paginaminijuegos`):
  ```
  git worktree add ../iqpulse-reasoning -b feat/reasoning-results
  git worktree add ../iqpulse-memory -b feat/memory-results
  git worktree add ../iqpulse-speed -b feat/speed-results
  git worktree add ../iqpulse-rendimiento -b feat/rendimiento-page
  git worktree add ../iqpulse-core -b feat/shared-core
  ```
  Si corren el dev server en simultáneo, puertos distintos (`next dev -p 3001`, `-p 3002`, ...).
- **Nadie toca archivos de otra terminal.** Si hace falta algo de un archivo compartido (clave de i18n nueva, token de color nuevo), se le pide a la terminal dueña de ese archivo — no se agrega por cuenta propia, para no duplicar con nombres distintos.
- **Orden: Terminal 5 (núcleo compartido) primero, sola.** Las Terminales 1-3 tocan la pantalla de resultados de sus juegos, que hoy vive dentro de `components/jugar/QuizPage.tsx` (archivo compartido). Terminal 5 saca ese patrón a algo declarativo por juego y mergea a `master` antes de que las demás empiecen a tocar ese archivo. Terminal 4 (página Rendimiento) no depende de `QuizPage.tsx` y puede arrancar en paralelo desde el día 1.
- **Antes de cada commit:** `npx tsc --noEmit -p tsconfig.json` y `npm run lint` limpios. Para cambios grandes, correr también `npm run build`.
- **Al terminar cada rama:** PR contra `master`, se revisa, se mergea una por vez — nunca las 5 en simultáneo.
