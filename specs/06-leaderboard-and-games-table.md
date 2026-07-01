# Spec 06 — Leaderboard y tabla de juegos en Supabase

- **Estado:** approved
- **Fecha:** 2026-06-30
- **Dependencias:** Spec 04 (cliente Supabase browser/server), Spec 05 (motor Asteroids y `saveScore`)
- **Objetivo:** Migrar el catálogo de juegos y las puntuaciones de datos mock/localStorage a tablas reales en Supabase (`games` y `scores`), alimentando con datos reales el catálogo, el detalle de juego, el guardado de partidas y el Salón de la Fama.

---

## Alcance

**Dentro del alcance:**

- Migración SQL que crea las tablas `games` y `scores` en Supabase, con políticas RLS.
- Seed de los 8 juegos actuales (`GAMES` de `lib/data.ts`) como filas reales en `games`.
- `lib/supabase/queries.ts`: funciones `getGames()`, `getGameById(id)`, `getGameLeaderboard(gameId, limit)`, `getRecentScores(limit)`, `getTopPlayersToday(limit)`, `insertScore({ game, score, name })`.
- Regenerar `lib/supabase/database.types.ts` con los tipos reales de `games` y `scores`.
- `lib/data.ts` deja de exportar `GAMES`, `RECENT_SCORES`, `TOP_PLAYERS_TODAY`, `PLAYERS` y `seededScores`; conserva y ajusta los tipos (`Game`, `ScoreRow`, `RecentScore`, `TopPlayer`).
- `lib/storage.ts`: `saveScore` deja de escribir en localStorage; pasa a llamar a `insertScore` de Supabase. `getUser`/`setUser` no cambian (siguen en localStorage, sin auth real).
- Reestructurar `app/page.tsx`, `app/games/page.tsx` y `app/game/[id]/play/page.tsx` en Server Component (fetch) + Client Component (interactividad), según el patrón acordado.
- Actualizar `app/game/[id]/page.tsx` para consultar Supabase en vez de `GAMES`, quitando `generateStaticParams`.
- `best` (mejor puntuación) y `plays` (número de partidas) por juego se calculan con queries agregadas sobre `scores`, no se almacenan en `games`.
- Salón de la Fama (`app/hall-of-fame/page.tsx`) consulta `getGameLeaderboard` en vez de `seededScores`, mostrando Top 10.
- Widgets de la home "ÚLTIMAS PUNTUACIONES" y "TOP JUGADORES · HOY" consultan `getRecentScores` y `getTopPlayersToday`.
- Cada partida jugada se guarda como fila nueva en `scores` (historial completo, sin deduplicar por jugador).
- Jugador identificado solo por nombre libre ingresado en el modal de fin de partida (sin autenticación).

**Fuera de alcance (para specs futuros):**

- Autenticación real de usuarios.
- Leaderboard global agregando todos los juegos (el Salón de la Fama sigue siendo por-juego, con tabs).
- Edición/borrado de puntuaciones o moderación de contenido ofensivo en nombres.
- Panel de administración para editar el catálogo de juegos desde la UI.
- Paginación del historial de puntuaciones más allá del Top 10 / listas cortas de la home.
- Realtime subscriptions (los widgets se recalculan en cada request, no en vivo vía WebSocket).
- Portar Tetris, Arkanoid y el resto de motores reales — sus juegos ya existen como filas de `games` pero siguen usando el arena simulada en `/play`.

---

## Modelo de datos

### Tabla `games`

```sql
create table games (
  id text primary key,              -- slug, ej. "asteroids", "caida"
  title text not null,
  short text not null,
  long text not null,
  cat text not null,                -- "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS"
  cover text not null,              -- clase css, ej. "cover-rocas"
  color text not null,              -- "cyan" | "magenta" | "yellow" | "green"
  created_at timestamptz not null default now()
);
```

### Tabla `scores`

```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  name text not null,               -- iniciales/nombre libre, sin auth
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index scores_game_id_score_idx on scores (game_id, score desc);
create index scores_created_at_idx on scores (created_at desc);
```

### Políticas RLS

- `games`: `select` público (`using (true)`). Sin `insert`/`update`/`delete` desde el cliente — se puebla solo por migración.
- `scores`: `select` público y `insert` público (`with check (true)`) — sin auth todavía. Sin `update`/`delete` desde el cliente.

### Tipos TypeScript (`lib/data.ts`, ajustados)

```ts
export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
};

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};
export type RecentScore = {
  player: string;
  game: string;
  score: number;
  time: string;
  color: Game["color"];
};
export type TopPlayer = { rank: number; player: string; score: number };
```

`best` y `plays` dejan de ser campos de `Game`; se calculan aparte con `getGames()` devolviendo `(Game & { best: number; plays: number })[]` vía query agregada (`max(score)` / `count(*)` agrupado por `game_id`, left join para juegos sin partidas → `best: 0, plays: 0`).

### `lib/supabase/queries.ts` (contrato)

```ts
export async function getGames(): Promise<
  (Game & { best: number; plays: number })[]
>;
export async function getGameById(
  id: string,
): Promise<(Game & { best: number; plays: number }) | null>;
export async function getGameLeaderboard(
  gameId: string,
  limit = 10,
): Promise<ScoreRow[]>;
export async function getRecentScores(limit = 7): Promise<RecentScore[]>;
export async function getTopPlayersToday(limit = 5): Promise<TopPlayer[]>;
export async function insertScore(entry: {
  game: string;
  score: number;
  name: string;
}): Promise<void>;
```

---

## Plan de implementación

1. **Crear migración SQL.** `supabase/migrations/<timestamp>_games_and_scores.sql` con las tablas `games` y `scores`, índices, políticas RLS, y un `insert` seed con los 8 juegos actuales de `GAMES`. Aplicar con `apply_migration` y verificar con `list_tables` que las tablas existen y `games` tiene 8 filas.

2. **Regenerar tipos.** Ejecutar `generate_typescript_types` y sobrescribir `lib/supabase/database.types.ts` con el resultado real (reemplaza el placeholder de Spec 04).

3. **Crear `lib/supabase/queries.ts` con `getGames()` y `getGameById(id)`.** Ambas hacen query a `games` con agregación de `scores` (`best`/`plays`). Test manual: un script o página temporal que llame `getGames()` y loguee el resultado.

4. **Actualizar `app/game/[id]/page.tsx`.** Usar `getGameById(id)` en vez de `GAMES.find`, quitar `generateStaticParams`. Sigue siendo Server Component. El leaderboard lateral sigue con `seededScores` temporalmente (se conecta en el paso 9).

5. **Añadir `getGameLeaderboard` e `insertScore` a `queries.ts`.** Actualizar `lib/storage.ts`: `saveScore` pasa a ser `async` y llama `insertScore`. Actualizar el único caller (`app/game/[id]/play/page.tsx`, `handleSave`) para `await` la llamada.

6. **Reestructurar `app/games/page.tsx`.** Crear `components/games/GamesLibraryClient.tsx` (`"use client"`) con la lógica actual de búsqueda/filtros, recibiendo `games: (Game & { best: number; plays: number })[]` como prop. `app/games/page.tsx` pasa a ser Server Component: `await getGames()` y renderiza `<GamesLibraryClient games={games} />`.

7. **Reestructurar `app/game/[id]/play/page.tsx`.** Crear `components/games/PlayClient.tsx` (`"use client"`) con toda la lógica actual (HUD, motor, modal), recibiendo `game: Game & { best: number; plays: number }` como prop. La página pasa a Server Component: `await getGameById(id)`, `notFound()` si no existe, renderiza `<PlayClient game={game} />`.

8. **Reestructurar `app/page.tsx`.** Crear `components/home/HomeClient.tsx` (`"use client"`) con el JSX actual, recibiendo `games`, `recentScores`, `topPlayers` como props. `app/page.tsx` pasa a Server Component: `await Promise.all([getGames(), getRecentScores(), getTopPlayersToday()])`.

9. **Reestructurar `app/hall-of-fame/page.tsx`.** Crear `components/hall-of-fame/HallOfFameClient.tsx` (`"use client"`) con la lógica de tabs actual, recibiendo `games` y `leaderboards: Record<string, ScoreRow[]>` como props. La página pasa a Server Component: `await getGames()` + `Promise.all(games.map(g => getGameLeaderboard(g.id, 10)))`.

10. **Conectar el leaderboard lateral de `app/game/[id]/page.tsx`.** Reemplazar `seededScores(...)` por `getGameLeaderboard(id, 10)` obtenido en el mismo `await` del paso 4.

11. **Limpiar `lib/data.ts`.** Eliminar `GAMES`, `RECENT_SCORES`, `TOP_PLAYERS_TODAY`, `PLAYERS`, `seededScores`. Conservar y ajustar los tipos (`Game` sin `best`/`plays` fijos, `ScoreRow`, `RecentScore`, `TopPlayer`, `SavedScore`, `User`).

12. **Verificación final.** `npm run build` sin errores. Recorrido manual: `/`, `/games`, `/game/asteroids`, `/game/asteroids/play` (jugar y guardar puntuación), `/hall-of-fame` — todo con datos reales de Supabase.

---

## Criterios de aceptación

### Base de datos

- [ ] Las tablas `games` y `scores` existen en Supabase con las columnas descritas.
- [ ] `games` contiene exactamente 8 filas tras la migración (los juegos actuales).
- [ ] Insertar una fila en `scores` desde el cliente anónimo funciona (política RLS `insert` pública).
- [ ] Insertar una fila en `games` desde el cliente anónimo falla (sin política `insert`).
- [ ] `lib/supabase/database.types.ts` incluye los tipos de `games` y `scores` (no es el placeholder de Spec 04).

### Catálogo de juegos

- [ ] `/games` lista los 8 juegos leídos de Supabase, con búsqueda y filtro por categoría funcionando.
- [ ] Cada tarjeta muestra `best` como el máximo real de `scores` para ese juego (0 si no hay partidas).
- [ ] `/game/[id]` muestra los datos del juego desde Supabase; una ruta con id inexistente devuelve 404.
- [ ] El leaderboard lateral de `/game/[id]` muestra hasta 10 puntuaciones reales de `scores`, ordenadas desc.

### Guardado de puntuaciones

- [ ] Terminar una partida en `/game/asteroids/play` y guardar con un nombre inserta una fila nueva en `scores`.
- [ ] Jugar dos partidas con el mismo nombre crea dos filas distintas en `scores` (no se sobrescribe).
- [ ] Tras guardar, el modal muestra "PUNTUACIÓN GUARDADA" solo cuando el insert fue exitoso.

### Salón de la Fama

- [ ] `/hall-of-fame` muestra hasta 10 filas por juego, leídas de `scores`, sin usar `seededScores`.
- [ ] Cambiar de tab cambia las filas mostradas al leaderboard del juego seleccionado.
- [ ] Guardar una puntuación nueva y recargar `/hall-of-fame` la refleja en la posición correcta según su valor.

### Home

- [ ] "ÚLTIMAS PUNTUACIONES" muestra las partidas más recientes reales (no `RECENT_SCORES` mock).
- [ ] "TOP JUGADORES · HOY" muestra jugadores reales ordenados por puntuación de hoy.

### General

- [ ] `npm run build` compila sin errores de TypeScript.
- [ ] `lib/data.ts` ya no exporta `GAMES`, `RECENT_SCORES`, `TOP_PLAYERS_TODAY`, `PLAYERS` ni `seededScores`.

---

## Decisiones

- **Sí:** una sola tabla `scores` con historial completo de partidas (no solo la mejor por jugador). Permite alimentar "últimas puntuaciones" y evita lógica de upsert.
- **No:** deduplicar por jugador+juego con upsert. Perdería el historial de actividad reciente que usa la home.
- **Sí:** `best`/`plays` calculados con queries agregadas sobre `scores`, no almacenados en `games`. Evita desincronización entre el contador y las puntuaciones reales.
- **No:** columnas `best`/`plays` fijas en `games`. Requerirían actualizarse manualmente en cada insert, con riesgo de quedar desactualizadas.
- **Sí:** RLS con `games` de solo lectura pública y `scores` con `insert`/`select` público. No hay auth todavía; es el mismo nivel de confianza que el localStorage actual.
- **No:** pausar el leaderboard hasta tener autenticación. El proyecto no tiene spec de auth aún y el leaderboard es una feature visible core del producto.
- **Sí:** patrón Server Component (fetch) + Client Component (interactividad) para `/`, `/games` y `/game/[id]/play`. Sigue la convención de Next.js App Router de CLAUDE.md ("Server Components son el default") y evita fetch-en-cliente con estados de carga.
- **No:** fetch client-side con `useEffect` + loading state. Añadiría parpadeo de carga y contradice la convención del proyecto.
- **Sí:** quitar `generateStaticParams` de `/game/[id]`, renderizado dinámico. Evita rebuilds al agregar juegos y mantiene datos frescos.
- **No:** `generateStaticParams` con fetch a Supabase en build-time. Complejidad innecesaria para un catálogo que cambiará con frecuencia.
- **Sí:** Salón de la Fama sigue siendo por-juego (tabs), sin leaderboard global agregado. Mantiene el alcance acotado; un leaderboard global es una feature distinta.
- **Sí:** identidad de jugador sigue siendo nombre libre sin auth, igual que hoy. Consistente con el resto de la plataforma hasta que exista un spec de autenticación.
- **Sí:** spec único cubriendo tabla de juegos y leaderboard (decisión explícita del usuario), aun cuando el skill sugería dividir en dos specs por tocar dominios distintos.

---

## Riesgos

| Riesgo                                                                       | Mitigación                                                                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Política RLS mal configurada permite `insert`/`update` en `games`            | Verificar explícitamente con un insert de prueba desde el cliente anónimo antes de dar por cerrado el paso 1      |
| `/hall-of-fame` dispara 8 queries de leaderboard en paralelo (una por juego) | `Promise.all` las paraleliza; con 8 juegos y límite 10 filas el costo es marginal, no requiere optimización ahora |
| Insertar puntuación falla por red y el jugador cree que se guardó            | `handleSave` solo marca `saved: true` si el insert de Supabase resuelve sin error                                 |
| Migración de seed se re-ejecuta y duplica los 8 juegos                       | `id` es primary key en `games`; un segundo `insert` con los mismos ids falla por conflicto en vez de duplicar     |

---

## Lo que **no** está en este spec

- Autenticación real de usuarios.
- Leaderboard global agregando todos los juegos.
- Edición/borrado de puntuaciones o moderación de nombres.
- Panel de administración del catálogo.
- Paginación más allá del Top 10 / listas cortas de la home.
- Realtime subscriptions.
- Portar Tetris, Arkanoid y el resto de motores reales.

Cada uno, si llega, va en su propio spec.
