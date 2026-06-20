# Spec 01 — Visual MVP: Todas las pantallas de Arcade Vault

- **Estado:** implemented
- **Fecha:** 2026-06-19
- **Dependencias:** ninguna (es el primer spec)
- **Objetivo:** Implementar las 5 pantallas y la barra de navegación de Arcade Vault en Next.js (App Router) como UI visual fiel al diseño de referencia, sin lógica de juego real ni backend.

---

## Alcance

### Dentro del alcance

- Barra de navegación (`Nav`) con logo, links, contador de créditos, botón de auth y menú móvil (drawer lateral)
- Pantalla **Biblioteca** (`/`): hero animado, buscador, filtros por categoría, grid de tarjetas con efecto tilt 3D
- Pantalla **Detalle** (`/game/[id]`): cover CSS, descripción, estadísticas, leaderboard local con scores generados (seeded)
- Pantalla **Reproductor** (`/game/[id]/play`): HUD (jugador, puntuación, vidas, nivel), monitor CRT animado, overlay de pausa, modal de "Game Over" con input de iniciales y guardado de score en localStorage
- Pantalla **Auth** (`/auth`): tabs Login / Registro, campos de formulario, botones sociales (solo visual), flujo de "jugar como invitado"
- Pantalla **Salón de la Fama** (`/hall-of-fame`): pódium top 3, tabla completa con animación de entrada, tabs por juego, fila destacada del usuario
- Footer global (copyright, versión)
- Datos mock: 8 juegos, 5 categorías, 18 jugadores, generador de scores seeded — todo en `lib/data.ts`
- Estado de sesión y scores guardados en `localStorage`
- Estilos: variables CSS ya presentes en `globals.css`; clases específicas de componentes con Tailwind v4 + utilidades `@apply` donde haga falta

### Fuera del alcance

- Implementación real de ningún juego (el reproductor muestra la arena CRT animada como placeholder)
- Backend, base de datos ni API routes
- Autenticación real (login falso, sin tokens ni sesión server-side)
- Internacionalización
- Tests

---

## Modelo de datos

### `lib/data.ts`

```ts
type Game = {
  id: string          // slug único, ej. "bloque-buster"
  title: string       // nombre en mayúsculas
  short: string       // descripción corta (card)
  long: string        // descripción larga (detalle)
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS"
  cover: string       // clase CSS del arte generado, ej. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green"
  best: number        // mejor puntuación global (mock)
  plays: string       // partidas jugadas (mock), ej. "12.4K"
}

type ScoreRow = {
  rank: number
  name: string        // máx 10 caracteres, mayúsculas
  score: number
  date: string        // "DD/MM/YYYY"
}

type User = {
  name: string        // máx 10 caracteres, mayúsculas
} | null

type SavedScore = {
  game: string        // Game.id
  score: number
  name: string
  at: number          // Date.now()
}
```

- `GAMES: Game[]` — 8 juegos (idénticos al template)
- `CATS: string[]` — `["TODOS","ARCADE","PUZZLE","SHOOTER","VERSUS"]`
- `PLAYERS: string[]` — 18 nombres para generar leaderboards
- `seededScores(seed, count): ScoreRow[]` — generador determinista

### `localStorage` (claves)

| Clave | Tipo | Descripción |
|---|---|---|
| `av_user` | `User` en JSON | Sesión activa |
| `av_scores` | `SavedScore[]` en JSON | Histórico de partidas guardadas |

---

## Plan de implementación

1. **Crear `lib/data.ts`**
   Portar `GAMES`, `CATS`, `PLAYERS` y `seededScores` del template a TypeScript. Exportar todos los tipos.

2. **Crear `lib/storage.ts`**
   Funciones `getUser`, `setUser`, `clearUser`, `getScores`, `saveScore` que encapsulan el acceso a `localStorage`. Seguras frente a SSR (verifican `typeof window !== "undefined"`).

3. **Actualizar `app/globals.css`**
   Revisar que las clases del template estén presentes (cover arts CSS, animaciones, estilos de nav, CRT, modal, hall). Añadir las que falten.

4. **Crear `components/nav.tsx`** (`"use client"`)
   Logo, links de navegación, coin counter, botón de auth/usuario, hamburger + drawer móvil. Recibe `user` y callbacks via props. Marcar ruta activa comparando con `usePathname()`.

5. **Actualizar `app/layout.tsx`**
   Añadir `<Nav>` y `<footer>` globales. Gestionar estado de sesión (`user`) con `useState` + `localStorage` (hook `useAuth` en `hooks/use-auth.ts`).

6. **Crear `app/page.tsx` — Biblioteca**
   Hero con animación flicker + blink, buscador, chips de categoría, grid de `<GameCard>` con efecto tilt 3D via `onMouseMove`. Filtrado local con `useMemo`.

7. **Crear `app/game/[id]/page.tsx` — Detalle**
   Cover CSS, tags, título, descripción, stat-strip (partidas / mejor global / dificultad), botones JUGAR / VOLVER, leaderboard lateral con `seededScores`. Redirigir a 404 si el id no existe en `GAMES`.

8. **Crear `app/game/[id]/play/page.tsx` — Reproductor** (`"use client"`)
   HUD con score (auto-incremento por intervalo), vidas, nivel, botones PAUSA / FIN / SALIR. Arena CRT animada (placeholder). Overlay de pausa. Modal "Game Over" con input de iniciales y guardado en `localStorage` via `saveScore`.

9. **Crear `app/auth/page.tsx` — Auth** (`"use client"`)
   Tabs INICIAR SESIÓN / CREAR CUENTA, campos usuario/email/contraseña, botón principal, "jugar como invitado", botones sociales decorativos. Al submit llama a `setUser` y redirige a `/`.

10. **Crear `app/hall-of-fame/page.tsx` — Salón de la Fama** (`"use client"`)
    Header, tabs por juego, pódium top 3 (oro/plata/bronce), tabla completa con animación `rise`, fila del usuario destacada si hay sesión activa.

---

## Criterios de aceptación

### Navegación
- [ ] El logo lleva a `/`
- [ ] Los links "Biblioteca" y "Salón de la Fama" navegan a sus rutas
- [ ] El link activo muestra el estilo neon cyan con subrayado
- [ ] El botón "Iniciar Sesión" lleva a `/auth`; si hay sesión muestra el nombre del usuario
- [ ] El menú hamburger se muestra en mobile (≤840px) y abre el drawer lateral
- [ ] El footer aparece en todas las páginas

### Biblioteca (`/`)
- [ ] El hero muestra "ARCADE VAULT" con animación flicker
- [ ] El buscador filtra tarjetas por nombre en tiempo real
- [ ] Los chips de categoría filtran el grid correctamente
- [ ] Se muestran las 8 tarjetas con cover CSS, título, descripción, mejor puntuación y botón JUGAR
- [ ] El efecto tilt 3D se activa al mover el cursor sobre una tarjeta
- [ ] Si no hay resultados aparece el mensaje "NO HAY RESULTADOS"
- [ ] Clic en tarjeta o botón JUGAR navega a `/game/[id]`

### Detalle (`/game/[id]`)
- [ ] Muestra cover CSS, tags, título neon, descripción larga
- [ ] Stat-strip muestra partidas, mejor puntuación y dificultad
- [ ] El botón "JUGAR AHORA" navega a `/game/[id]/play`
- [ ] El botón "VOLVER AL VAULT" navega a `/`
- [ ] El leaderboard lateral muestra 10 filas con colores oro/plata/bronce en top 3
- [ ] Un id inexistente no rompe la app (redirige o muestra estado vacío)

### Reproductor (`/game/[id]/play`)
- [ ] El HUD muestra nombre de jugador, puntuación, vidas (♥) y nivel
- [ ] La puntuación se incrementa automáticamente mientras el juego está activo
- [ ] El nivel sube cada ~2500 puntos
- [ ] El botón PAUSA detiene el contador y muestra el overlay "EN PAUSA"
- [ ] El botón FIN abre el modal "Game Over" con la puntuación final
- [ ] El modal permite editar iniciales (máx 10 caracteres, mayúsculas)
- [ ] El botón "GUARDAR PUNTUACIÓN" guarda en `localStorage` y muestra el toast animado
- [ ] Los botones "JUGAR DE NUEVO" y "VOLVER AL VAULT" funcionan correctamente
- [ ] La arena CRT muestra la nave, enemigos y grid animado

### Auth (`/auth`)
- [ ] Se muestran los tabs "INICIAR SESIÓN" y "CREAR CUENTA"
- [ ] En "CREAR CUENTA" aparece el campo de email adicional
- [ ] El submit guarda el usuario en `localStorage` y redirige a `/`
- [ ] "JUGAR COMO INVITADO" limpia la sesión y redirige a `/`
- [ ] Los botones de Google y GitHub son visibles pero no funcionales

### Salón de la Fama (`/hall-of-fame`)
- [ ] El título muestra el degradado amarillo→magenta
- [ ] Los tabs permiten cambiar entre los 8 juegos
- [ ] El pódium muestra los 3 primeros con estilos oro/plata/bronce
- [ ] La tabla muestra 12 filas con animación de entrada escalonada
- [ ] Si hay sesión activa, aparece la fila del usuario destacada en amarillo
- [ ] El botón "VOLVER A LA BIBLIOTECA" navega a `/`

### Visual general
- [ ] El fondo con grid en perspectiva, scanlines y ruido se muestra en todas las pantallas
- [ ] Las fuentes "Press Start 2P" (pixel) y "JetBrains Mono" (mono) cargan correctamente
- [ ] Todos los efectos neon (glow, flicker, pulse) están presentes
- [ ] El layout es responsive: funciona en mobile (≤720px) y desktop

---

## Decisiones tomadas y descartadas

### Decisiones tomadas

| Decisión | Justificación |
|---|---|
| App Router con rutas `/`, `/game/[id]`, `/game/[id]/play`, `/auth`, `/hall-of-fame` | Estructura semántica y navegable; reemplaza el hash routing del template SPA |
| CSS global (`globals.css`) para variables, animaciones y clases de componentes complejos (CRT, covers, glow) | El CSS del template tiene efectos que no se traducen limpiamente a clases Tailwind utilitarias; portar 1:1 garantiza fidelidad visual |
| Tailwind v4 para layout y composición de componentes | Stack del proyecto; complementa el CSS global sin duplicar estilos |
| `localStorage` para sesión y scores | Suficiente para el MVP visual; las claves (`av_user`, `av_scores`) se diseñan pensando en migración futura a BD |
| Componentes con `"use client"` solo donde hay interactividad (Nav, Reproductor, Auth, Salón) | Respeta la convención de Server Components por defecto de Next.js 16 |
| Datos mock en `lib/data.ts` con tipos TypeScript | Facilita la migración futura a una BD real sin cambiar contratos |
| `lib/storage.ts` como capa de abstracción sobre `localStorage` | Aísla el acceso a storage; al migrar a BD solo cambia esta capa |

### Decisiones descartadas

| Decisión | Razón del descarte |
|---|---|
| Migrar todo el CSS a Tailwind v4 | Los efectos CRT, cover arts y animaciones neon son demasiado específicos; la traducción perdería fidelidad y tomaría más tiempo que aportar |
| Zustand / Context API para estado global | Overkill para el MVP; `localStorage` + props descendentes es suficiente |
| Implementar lógica real de algún juego | Fuera del alcance explícito: solo UI visual |
| Autenticación real (NextAuth, Clerk, etc.) | No hay backend; se deja para un spec posterior |
| Separar cada componente en su propio directorio | La app es pequeña; una carpeta `components/` plana es suficiente por ahora |

---

## Riesgos identificados

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Las fuentes de Google Fonts (`Press Start 2P`, `JetBrains Mono`) requieren conexión externa | Sin internet, el diseño se degrada visualmente | Cargarlas via `next/font/google` para que Next.js las auto-hostee en build |
| `localStorage` no existe en SSR (Next.js ejecuta componentes en servidor) | Error en runtime si se accede sin guardia | `lib/storage.ts` verifica `typeof window !== "undefined"` antes de cada acceso |
| El efecto tilt 3D usa `getBoundingClientRect` y eventos de mouse | No funciona en touch sin adaptación | Para el MVP es aceptable; queda registrado para spec posterior |
| Los covers CSS usan `::before` y `::after` con estilos complejos | Tailwind purga clases no usadas si se pasan dinámicamente como strings | Las clases `cover-*` deben vivir en `globals.css` (no generadas con Tailwind) para evitar purge |
