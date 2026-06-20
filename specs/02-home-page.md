# Spec 02 — Home Page: Landing page de marketing

- **Estado:** Implemented
- **Fecha:** 2026-06-20
- **Dependencias:** Spec 01 (visual MVP implementado — `lib/data.ts`, estilos en `globals.css`)
- **Objetivo:** Implementar la home page de marketing en `/` y mover la Biblioteca a `/games`.

---

## Alcance

### Dentro del alcance

- Nueva ruta `/` → `app/page.tsx` reemplazada por la home page de marketing
- Mover la Biblioteca actual de `app/page.tsx` a `app/games/page.tsx`
- Actualizar el Nav: el link "Biblioteca" apunta a `/games`
- Home page con 7 secciones según referencia:
  1. **Hero** — título en 3 líneas, eyebrow pixel, 2 CTAs, silhouettes flotantes, indicador de scroll
  2. **¿Por qué Arcade Vault?** — 4 feature cards con íconos pixel SVG
  3. **Juegos disponibles** — mini-rail con los primeros 6 de `GAMES`
  4. **Stats** — 3 bloques (12+, MILES, GLOBAL)
  5. **Actividad en vivo** — últimas puntuaciones + top jugadores (mock estático en `lib/data.ts`)
  6. **Precios** — card plan único + FAQ lateral
  7. **Final CTA** — botón "INSERTAR MONEDA"
- Animación `reveal` con `IntersectionObserver` en secciones 2–7
- Los botones de navegación de la home apuntan a: `/games` (explorar/insertar moneda) y `/auth` (crear cuenta / empezar gratis)

### Fuera del alcance

- Página About (queda para un spec posterior)
- Datos de actividad reales desde localStorage (se usa mock estático)
- Animaciones adicionales más allá de las ya definidas en `globals.css`
- Cambio de rutas en footer, Hall of Fame ni Auth

---

## Modelo de datos

No se introducen tipos nuevos. Solo se añaden constantes mock a `lib/data.ts`:

```ts
// Actividad en vivo — mock estático
export const RECENT_SCORES: {
  player: string
  game: string
  score: number
  time: string
  color: "cyan" | "magenta" | "yellow" | "green"
}[] = [
  { player: "NEONFOX",  game: "Caída",        score: 184220, time: "hace 2 min",  color: "magenta" },
  { player: "PX_KAI",   game: "Glotón",       score: 96400,  time: "hace 5 min",  color: "yellow" },
  { player: "Z3R0COOL", game: "Invasores",    score: 54190,  time: "hace 8 min",  color: "green" },
  { player: "VAULT_07", game: "Rocas",        score: 41200,  time: "hace 12 min", color: "cyan" },
  { player: "GLITCHA",  game: "Bloque Buster",score: 28450,  time: "hace 18 min", color: "cyan" },
  { player: "ARKADYA",  game: "Serpentina",   score: 7820,   time: "hace 24 min", color: "green" },
  { player: "CYBER_LU", game: "Ranaria",      score: 18900,  time: "hace 31 min", color: "yellow" },
]

export const TOP_PLAYERS_TODAY: {
  rank: number
  player: string
  score: number
}[] = [
  { rank: 1, player: "NEONFOX",  score: 312840 },
  { rank: 2, player: "PX_KAI",   score: 248110 },
  { rank: 3, player: "M00NRYU",  score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA",  score: 138900 },
]
```

---

## Plan de implementación

1. **Añadir constantes mock a `lib/data.ts`**
   Exportar `RECENT_SCORES` y `TOP_PLAYERS_TODAY` con los datos de la sección "Actividad en vivo".

2. **Mover la Biblioteca de `app/page.tsx` a `app/games/page.tsx`**
   Crear `app/games/` y mover el archivo. Sin cambios en la lógica interna.

3. **Actualizar el Nav (`components/nav.tsx`)**
   Cambiar el href del link "Biblioteca" de `/` a `/games`. Verificar que el active state funcione para ambas rutas.

4. **Crear `app/page.tsx` — Home page** (`"use client"`)
   Implementar las 7 secciones en orden:
   - `<HeroSection>` — título 3 líneas, eyebrow, 2 CTAs, `<FloatingSilhouettes>`, scroll indicator
   - `<WhySection>` — 4 `<FeatureCard>` con íconos pixel SVG inline
   - `<GamesPreviewSection>` — mini-rail con `GAMES.slice(0, 6)` usando el componente `<MiniCard>` existente (o inline si no está extraído)
   - `<StatsSection>` — 3 bloques estáticos
   - `<ActivitySection>` — dos panels: ticker de `RECENT_SCORES` y top list de `TOP_PLAYERS_TODAY`
   - `<PricingSection>` — price card + 3 FAQ items
   - `<FinalCTASection>` — título degradado + botón pulse

5. **Registrar el hook `useReveal` en la home page**
   `IntersectionObserver` que añade la clase `.in` a los elementos `.reveal` al entrar en viewport. Implementado dentro del mismo `app/page.tsx` como hook local.

---

## Criterios de aceptación

### Ruta y navegación
- [ ] `/` carga la home page de marketing (no la Biblioteca)
- [ ] `/games` carga la Biblioteca con todos sus filtros y tarjetas intactos
- [ ] El link "Biblioteca" en el Nav apunta a `/games` y muestra active state en esa ruta
- [ ] El botón "EXPLORAR JUEGOS" y "INSERTAR MONEDA →" navegan a `/games`
- [ ] Los botones "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`
- [ ] El link "VER SALÓN →" en la sección de actividad navega a `/hall-of-fame`

### Hero
- [ ] El título muestra 3 líneas con colores: blanco / degradado cyan / degradado magenta
- [ ] El eyebrow muestra "▸ INSERTA UNA MONEDA" con cursor parpadeante
- [ ] Las 8 silhouettes flotantes se animan con float y glow
- [ ] El scroll indicator aparece con la flecha bouncing

### Secciones con reveal
- [ ] Las secciones 2–7 arrancan invisibles y aparecen al hacer scroll (clase `.reveal` → `.in`)

### Contenido
- [ ] La sección "¿Por qué?" muestra 4 feature cards con íconos SVG pixel y hover neon
- [ ] El mini-rail muestra exactamente 6 juegos de `GAMES` con sus covers CSS
- [ ] Los 3 bloques de stats muestran "12+", "MILES" y "GLOBAL"
- [ ] La sección de actividad muestra 7 filas en el ticker y 5 en el top list
- [ ] La pricing card muestra $0, 6 ítems en la lista y el stamp "FREE PLAY"
- [ ] Los 3 FAQ items son visibles en la columna derecha de pricing

### Visual
- [ ] Los estilos de home (`.home-hero`, `.feature-card`, `.mini-rail`, `.home-stats`, `.activity-card`, `.price-card`, `.home-final`) están presentes en `globals.css`
- [ ] El layout es responsive: hero a pantalla completa en desktop, secciones apiladas en mobile (≤720px)

---

## Decisiones tomadas y descartadas

### Decisiones tomadas

| Decisión | Justificación |
|---|---|
| `/` = home marketing, `/games` = Biblioteca | Arquitectura estándar: la raíz es la landing page pública; la biblioteca es una sección interna |
| `"use client"` en `app/page.tsx` | El `IntersectionObserver` del reveal y la navegación con `useRouter` requieren acceso al DOM |
| Mock estático para actividad en vivo | Consistente con el resto del MVP; no hay backend ni sesión server-side |
| Datos de actividad en `lib/data.ts` | Centraliza todos los mocks en un solo archivo; facilita reemplazarlos por una API real en el futuro |
| Reutilizar estilos ya presentes en `globals.css` | Los estilos de home del template ya están portados desde el Spec 01; no se duplican |

### Decisiones descartadas

| Decisión | Razón del descarte |
|---|---|
| Leer actividad desde `localStorage` (`av_scores`) | Los datos son escasos al inicio; el mock da mejor primera impresión y es suficiente para el MVP |
| Extraer cada sección en su propio archivo de componente | La home page es una sola ruta; mantenerlo en un archivo reduce la fricción sin perder legibilidad |
| Añadir página About en este spec | La referencia incluye `about.jsx` pero es una pantalla independiente; se deja para un spec posterior |
