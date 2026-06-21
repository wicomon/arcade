# Spec 03 — About Page: Acerca de y formulario de contacto con Resend

- **Estado:** Aprobado
- **Fecha:** 2026-06-21
- **Dependencias:** Spec 01 (estilos en `globals.css`), Spec 02 (Nav actualizable)
- **Objetivo:** Implementar la página `/about` con sección de misión y formulario de contacto que envía emails reales vía Resend.

---

## Alcance

### Dentro del alcance

- Nueva ruta `/about` → `app/about/page.tsx`
- Actualizar el Nav: añadir link "Acerca de" antes de "Salón de la Fama" (desktop y drawer móvil)
- Página con 2 secciones según referencia:
  1. **About hero** — kicker, título, misión, 3 highlight cards con íconos pixel SVG
  2. **Contacto** — divider animado, intro con 3 tips, formulario (nombre, email, mensaje)
- Animación `reveal` con `IntersectionObserver` en divider y sección de contacto
- API Route `app/api/contact/route.ts` — recibe el form, llama a Resend, devuelve `{ ok: true }` o `{ ok: false }`
- Resend: `from: "onboarding@resend.dev"`, `to: "wcv.dev94@gmail.com"`
- API key en variable de entorno `RESEND_API_KEY` (en `.env.local`)
- Estados del formulario:
  - **Idle** — formulario vacío
  - **Shake** — validación fallida (campo vacío), igual que el template
  - **Loading** — botón deshabilitado mientras se envía
  - **Success** — reemplaza el formulario por el terminal animado del template
  - **Error** — mensaje en rojo debajo del botón: "Algo salió mal, inténtalo más tarde"

### Fuera del alcance

- Verificación de dominio propio en Resend
- Rate limiting ni anti-spam en la API route
- Guardar mensajes en base de datos
- Notificación de confirmación al remitente (solo recibe el equipo)
- Tests

---

## Modelo de datos

No se introducen tipos en `lib/data.ts`. Se añade un único tipo local en la API route:

### `app/api/contact/route.ts`

```ts
type ContactPayload = {
  name: string
  email: string
  msg: string
}
```

Validación servidor: los tres campos deben ser strings no vacíos. Si falla → `400`. Si Resend lanza error → `500`.

### Variables de entorno

| Variable | Archivo | Descripción |
|---|---|---|
| `RESEND_API_KEY` | `.env.local` | API key de Resend (nunca se commitea) |

### `.env.local` (a crear si no existe)

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

---

## Plan de implementación

1. **Instalar el SDK de Resend**
   `npm install resend`

2. **Crear `app/api/contact/route.ts`**
   API Route con método POST. Valida los tres campos, llama a `resend.emails.send()` con `from: "onboarding@resend.dev"`, `to: "wcv.dev94@gmail.com"` y el cuerpo del mensaje en texto plano. Devuelve `{ ok: true }` en éxito o `{ ok: false }` con status 500 en error.

3. **Actualizar el Nav (`components/nav.tsx`)**
   Añadir link "Acerca de" apuntando a `/about` antes del link "Salón de la Fama" en desktop y en el drawer móvil. Añadir `/about` al `isActive`.

4. **Añadir estilos a `app/globals.css`**
   Portar las clases del template que aún no están en globals: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.hl-icon`, `.hl-text`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`, `.contact-form`.

5. **Crear `app/about/page.tsx`** (`"use client"`)
   Implementar las 2 secciones en orden:
   - `<AboutHero>` — kicker, título, misión, 3 highlight cards con íconos SVG pixel inline (`HEART`, `BROWSER`, `PLANT`)
   - Divider animado con 24 píxeles parpadeantes
   - `<ContactSection>` — intro con 3 tips + formulario con estados idle / shake / loading / success (terminal) / error
   - Hook `useReveal` local con `IntersectionObserver`
   - Al submit: `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })` → gestionar éxito y error

---

## Criterios de aceptación

### Ruta y navegación
- [ ] `/about` carga la página sin errores
- [ ] El link "Acerca de" aparece en el Nav desktop antes de "Salón de la Fama"
- [ ] El link "Acerca de" aparece en el drawer móvil antes de "Salón de la Fama"
- [ ] El link muestra el active state neon cyan cuando la ruta es `/about`

### About hero
- [ ] El kicker "▸ ACERCA DE" aparece en neon yellow
- [ ] El título "ACERCA DE ARCADE VAULT" muestra el degradado blanco→cyan
- [ ] El párrafo de misión es visible en color `var(--ink-dim)`
- [ ] Las 3 highlight cards muestran íconos pixel SVG con sus colores (magenta, cyan, green)
- [ ] Las cards tienen hover con elevación y borde neon

### Divider y reveal
- [ ] El divider animado con 24 píxeles parpadeantes aparece entre las dos secciones
- [ ] El divider y la sección de contacto arrancan invisibles y aparecen al hacer scroll

### Formulario — estados
- [ ] **Idle:** los 3 campos (nombre, email, mensaje) son visibles y editables
- [ ] **Shake:** al intentar enviar con algún campo vacío, el formulario sacude
- [ ] **Loading:** el botón se deshabilita mientras la petición está en curso
- [ ] **Success:** el formulario se reemplaza por el terminal animado con el nombre del remitente en mayúsculas
- [ ] **Error:** aparece el mensaje "Algo salió mal, inténtalo más tarde" en rojo debajo del botón
- [ ] El botón "ENVIAR OTRO MENSAJE" en el terminal limpia el formulario y vuelve al estado idle

### Envío real
- [ ] Al enviar el formulario completo, llega un email a `wcv.dev94@gmail.com`
- [ ] El email contiene nombre, correo y mensaje del remitente
- [ ] `RESEND_API_KEY` se lee desde `.env.local` y nunca aparece en el código

---

## Decisiones tomadas y descartadas

### Decisiones tomadas

| Decisión | Justificación |
|---|---|
| API Route en Next.js para llamar a Resend | La API key no puede exponerse en el cliente; la route server-side la mantiene segura |
| `from: "onboarding@resend.dev"` | Dominio de prueba de Resend que funciona sin configuración adicional; válido para MVP |
| Estado loading con botón deshabilitado | Previene doble envío sin necesidad de lógica adicional |
| Error inline en rojo debajo del botón | Mínimo impacto visual, no interrumpe el flujo; el usuario puede corregir y reintentar |
| Hook `useReveal` local en `app/about/page.tsx` | Consistente con `app/page.tsx`; no se extrae a un hook compartido hasta que haya una tercera página que lo necesite |
| Link "Acerca de" antes de "Salón de la Fama" | Orden lógico: información → competencia; el usuario entiende el proyecto antes de ver rankings |

### Decisiones descartadas

| Decisión | Razón del descarte |
|---|---|
| Rate limiting en la API route | Overkill para MVP; Resend ya tiene límites propios en el plan gratuito |
| Email de confirmación al remitente | Requiere dominio propio verificado en Resend; se deja para cuando haya dominio real |
| Guardar mensajes en base de datos | No hay backend aún; el email es suficiente canal para el MVP |
| Extraer `useReveal` a `hooks/use-reveal.ts` | La regla de tres: solo hay dos páginas que lo usan; la extracción se justifica en la tercera |

---

## Riesgos identificados

| Riesgo | Impacto | Mitigación |
|---|---|---|
| `RESEND_API_KEY` no configurada en producción | La API route devuelve 500 y el formulario muestra error | Documentar en `.env.local` de ejemplo; el error inline avisa al usuario |
| El dominio `onboarding@resend.dev` solo entrega al propietario de la cuenta Resend | Funciona en desarrollo pero no escala a otro destinatario | Aceptado para MVP; migrar a dominio propio en un spec posterior |
| Resend plan gratuito: 100 emails/día | Si hay spam, se agota el cupo | Aceptado para MVP; rate limiting queda como mejora futura |
