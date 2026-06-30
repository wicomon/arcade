# Spec 05 — Juego Asteroids (ROCAS): motor canvas integrado en la plataforma

- **Estado:** Implemented
- **Fecha:** 2026-06-30
- **Dependencias:** Spec 01 (estilos y pantalla CRT en `globals.css`), Spec 02 (listado/ruta de juego), reproductor genérico `app/game/[id]/play/page.tsx`
- **Objetivo:** Portar el juego Asteroids de canvas vanilla a un componente React cliente montado en la ruta del juego `rocas`, integrado con el HUD, los botones y el guardado de puntuación existentes.

---

## Alcance

### Dentro del alcance

- Crear `components/games/asteroids/engine.ts`: motor agnóstico portado de `game.js` (clases `Ship`, `Asteroid`, `Bullet`, `Particle`, `PowerUp`, loop y estado), sin `getElementById` ni auto-arranque; expuesto como `createGame(canvas, callbacks): GameHandle`.
- Crear `components/games/asteroids/Asteroids.tsx` (`"use client"`): canvas 800×600 vía ref, `useEffect` que arranca y limpia el loop, listeners de teclado con cleanup y `preventDefault`, puente de estado a callbacks, reacción a la prop `paused`.
- Crear registro `lib/games.ts` con `GAME_ENGINES: Record<string, ComponentType<GameProps>> = { rocas: Asteroids }`.
- Modificar `app/game/[id]/play/page.tsx`: si `GAME_ENGINES[game.id]` existe, renderizar el motor real dentro de `.crt-screen` en lugar del arena simulado; el resto de juegos mantienen el mock.
- Puente de HUD: el motor emite `score/lives/level` por callbacks → estado React → `.player-hud` existente. Se elimina el HUD dibujado en canvas (`drawHUD`).
- Wiring de botones: PAUSA congela el loop, FIN fuerza game over, SALIR navega a `/game/rocas`.
- Game over: el motor avisa por `onGameOver(score)` → modal existente con input de iniciales y `saveScore({ game: "rocas", score, name })`. Se desactiva el overlay/restart interno del canvas. "JUGAR DE NUEVO" reinicia el motor.
- Canvas lógico 800×600 escalado por CSS a la pantalla CRT (aspect 4/3, `image-rendering: pixelated`); estilos añadidos en `app/globals.css`.
- Se conservan las mecánicas del original: 3 vidas, invencibilidad al reaparecer, división de asteroides, partículas, powerup de triple disparo, niveles.
- Controles de teclado: `←` `→` rotar, `↑` propulsar, `Espacio` disparar, con `preventDefault` para no hacer scroll.

### Fuera del alcance (para specs posteriores)

- Controles táctiles / móvil.
- Portar Tetris (`03-tetris`) y Arkanoid (`04-arkanoid`).
- Persistir puntuaciones en Supabase o leaderboard online (sigue en localStorage vía `saveScore`).
- OVNIs enemigos (no están en la referencia actual), audio/sonido.
- Tests.
- Reemplazar el reproductor simulado de los otros 7 juegos.

---

## Modelo de datos

No se introducen estructuras persistentes nuevas. Se reutiliza `SavedScore` y `saveScore` de `lib/data.ts` / `lib/storage.ts` (clave `av_scores`).

Se define el contrato del motor y las props del wrapper:

```ts
// components/games/asteroids/engine.ts
export type GameCallbacks = {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void;
};

export type GameHandle = {
  pause: () => void;
  resume: () => void;
  forceGameOver: () => void;
  restart: () => void;
  destroy: () => void;
};

// components/games/asteroids/Asteroids.tsx
export type GameProps = {
  paused: boolean;
  onScore: (n: number) => void;
  onLives: (n: number) => void;
  onLevel: (n: number) => void;
  onGameOver: (score: number) => void;
  onReady?: (handle: GameHandle) => void;
};
```

Las constantes del juego (`RADII`, `SPEEDS`, `POINTS`, parámetros de powerup) se conservan del original. Resolución lógica interna fija 800×600.

---

## Plan de implementación

1. **Crear `components/games/asteroids/engine.ts`.** Portar `game.js` a una función `createGame(canvas, callbacks)` que devuelve `GameHandle`. Eliminar el acceso global a `#canvas`, el `drawHUD`, el `drawOverlay` de game over y el auto-arranque. `W`/`H` quedan como constantes internas. El `requestAnimationFrame` se guarda para poder cancelarlo. Test manual: montar temporalmente y ver que dibuja y se mueve.
2. **Mover input al motor.** Listeners de teclado registrados al crear el juego y removidos en `destroy()`, con `preventDefault` en flechas y espacio. Implementar `pause/resume/forceGameOver/restart/destroy`.
3. **Conectar estado a callbacks.** Emitir `onScore/onLives/onLevel` solo cuando cambian; `onGameOver(score)` al entrar en estado `gameover` (sin reinicio con Espacio).
4. **Crear `components/games/asteroids/Asteroids.tsx`** (`"use client"`). Canvas con ref a 800×600; `useEffect` llama `createGame`, propaga callbacks, expone el handle por `onReady`, y en cleanup llama `destroy()`. La prop `paused` invoca `pause()/resume()`.
5. **Crear registro `lib/games.ts`.** `GAME_ENGINES: Record<string, ComponentType<GameProps>> = { rocas: Asteroids }`.
6. **Modificar `app/game/[id]/play/page.tsx`.** Resolver `const Engine = GAME_ENGINES[game.id]`. Si existe: renderizar `<Engine .../>` dentro de `.crt-screen` (sustituye el `.game-arena` mock), guardar el handle en un ref, y conectar callbacks → `score/lives/level` state + apertura del modal en `onGameOver`. Quitar el `setInterval` de score simulado cuando hay motor real. PAUSA → toggle `paused`; FIN → `handle.forceGameOver()`; "JUGAR DE NUEVO" → `handle.restart()`. Si no hay motor, se conserva el arena simulado.
7. **Añadir estilos a `app/globals.css`.** Clase para el canvas escalado dentro de `.crt-screen` (`width: 100%`, `aspect-ratio: 4/3`, `image-rendering: pixelated`, fondo negro).

---

## Criterios de aceptación

### Ruta y registro

- [ ] `/game/rocas/play` monta el canvas real (no el arena simulado).
- [ ] `/game/caida/play` (id sin motor) sigue mostrando el arena simulado.
- [ ] La app compila con `npm run build` sin errores de TypeScript.

### Render y juego

- [ ] El canvas se ve dentro de la pantalla CRT, escalado y sin desbordar.
- [ ] La nave rota con `←` `→`, propulsa con `↑` y dispara con `Espacio`.
- [ ] Pulsar flechas/`Espacio` no hace scroll de la página.
- [ ] Los asteroides grandes se parten en medianos y estos en pequeños.
- [ ] Aparecen partículas de explosión al destruir un asteroide.
- [ ] Aparece el powerup de triple disparo y al recogerlo dispara 3 balas.
- [ ] Al limpiar todos los asteroides avanza de nivel.

### HUD

- [ ] El score del `.player-hud` sube al destruir asteroides (sin número aleatorio simulado).
- [ ] Las vidas del HUD reflejan las 3 iniciales y bajan al chocar.
- [ ] El nivel del HUD coincide con el nivel del juego.
- [ ] El canvas no dibuja su propio HUD (sin SCORE/NIVEL dentro del canvas).

### Botones

- [ ] PAUSA congela el juego y REANUDAR lo descongela.
- [ ] FIN abre el modal de fin de partida con la puntuación actual.
- [ ] SALIR navega a `/game/rocas`.

### Game over y guardado

- [ ] Al perder las 3 vidas se abre el modal de la plataforma (no el overlay del canvas).
- [ ] Guardar puntuación añade una entrada en `av_scores` con `game: "rocas"`.
- [ ] "JUGAR DE NUEVO" reinicia el motor desde cero (score 0, 3 vidas, nivel 1).
- [ ] Al salir/desmontar, el loop se cancela (sin warnings de `raf` ni listeners colgados).

---

## Decisiones tomadas y descartadas

### Tomadas

- **Sí:** motor agnóstico (`engine.ts`) + wrapper React. Separa lógica de juego de React y es reutilizable para Tetris/Arkanoid.
- **Sí:** HUD puenteado al `.player-hud` React. Un solo origen de verdad, consistente con la plataforma.
- **Sí:** modal de plataforma + `saveScore`. Integra el guardado existente en localStorage.
- **Sí:** registro `GAME_ENGINES` id→componente. Escala a los 8 juegos sin tocar la ruta.
- **Sí:** canvas 800×600 lógico escalado por CSS. No altera la física y encaja en cualquier pantalla.
- **Sí:** solo teclado. Alcance acotado para este spec.
- **Sí:** handle imperativo vía `onReady`/`useImperativeHandle` para FIN y restart. La página controla el motor sin re-montarlo.
- **Sí:** persistencia en localStorage (`saveScore`). Supabase para puntuaciones es spec posterior.

### Descartadas

- **No:** port inline en `useEffect`. Acopla todo a React y dificulta reutilizar.
- **No:** HUD dibujado en canvas. Duplica e inconsistente con la plataforma.
- **No:** overlay/restart del canvas. Rompería el flujo de guardado.
- **No:** `if (id === "rocas")` inline. No escala a 8 juegos.
- **No:** canvas 800×600 fijo. Se rompe en móvil.
- **No:** controles táctiles ahora. Spec posterior.

---

## Riesgos identificados

| Riesgo                                               | Mitigación                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| El loop `raf` no se cancela al desmontar → fugas     | `destroy()` en el cleanup del `useEffect` cancela `raf` y quita listeners                        |
| Listeners de teclado capturan teclas fuera del juego | attach/remove ligados al ciclo de vida del componente; `preventDefault` solo en teclas del juego |
| El escalado del canvas degrada la nitidez            | `image-rendering: pixelated` y resolución lógica fija 800×600                                    |
| StrictMode monta el `useEffect` dos veces en dev     | `createGame` con cleanup completo y guard de inicialización idempotente                          |

---

## Lo que **no** está en este spec

- Controles táctiles / móvil.
- Tetris y Arkanoid.
- Puntuaciones en Supabase u online.
- OVNIs, audio y tests.

Cada uno, si llega, va en su propio spec.
