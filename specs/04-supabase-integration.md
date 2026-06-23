# Spec 04 — Supabase Integration: Configuración base del cliente

- **Estado:** Aprobado
- **Fecha:** 2026-06-23
- **Dependencias:** Spec 01, 02, 03 (ninguna dependencia funcional; es infraestructura transversal)
- **Objetivo:** Instalar y configurar el cliente de Supabase (browser + server) como base para futuros specs de autenticación, puntuaciones, realtime y edge functions.

---

## Alcance

### Dentro del alcance

- Instalar `@supabase/supabase-js` y `@supabase/ssr`
- Configurar variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) en `.env.local`
- Crear cliente browser: `lib/supabase/client.ts` (para componentes `"use client"`)
- Crear cliente server: `lib/supabase/server.ts` (para Server Components y Route Handlers, con cookies)
- Crear `lib/supabase/database.types.ts` con estructura placeholder para tipos generados
- Documentar cómo regenerar los tipos cuando haya schema real

### Fuera del alcance

- Autenticación de usuarios (registro, login, sesión) — spec posterior
- Tablas en la base de datos — spec posterior
- Reemplazar mocks de `lib/data.ts` por queries reales — spec posterior
- Realtime subscriptions — spec posterior
- Edge Functions — spec posterior
- Row Level Security (RLS) — se configura cuando haya tablas

---

## Modelo de datos

No se introducen tablas ni queries. Se añade un archivo de tipos placeholder:

### `lib/supabase/database.types.ts`

```ts
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

Este archivo se reemplaza con el output de `supabase gen types typescript --project-id <id>`
cuando haya tablas reales en el schema.

### Variables de entorno

| Variable                               | Archivo      | Descripción                |
| -------------------------------------- | ------------ | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `.env.local` | URL del proyecto Supabase  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Clave pública del proyecto |

### `.env.local` (añadir a las variables existentes)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyXXXXXXXXXXXXXXXXXXXXXX
```

---

## Plan de implementación

1. **Instalar dependencias**
   `npm install @supabase/supabase-js @supabase/ssr`

2. **Añadir variables de entorno a `.env.local`**
   Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores
   del proyecto Supabase. El archivo ya existe por `RESEND_API_KEY` (Spec 03).

3. **Crear `lib/supabase/database.types.ts`**
   Archivo placeholder con el tipo `Database` vacío. Base para tipos generados en el futuro.

4. **Crear `lib/supabase/client.ts`**
   Cliente browser usando `createBrowserClient` de `@supabase/ssr`. Para usar en componentes
   con `"use client"`.

5. **Crear `lib/supabase/server.ts`**
   Cliente server usando `createServerClient` de `@supabase/ssr` con lectura/escritura de
   cookies via `next/headers`. Para usar en Server Components y Route Handlers.

6. **Verificar la conexión**
   Desde `app/page.tsx` (server component temporal) hacer un ping a Supabase para confirmar
   que las credenciales funcionan. Se elimina tras verificar.

---

## Criterios de aceptación

### Instalación

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `package.json`
- [ ] Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` están en `.env.local`

### Archivos creados

- [ ] `lib/supabase/database.types.ts` existe con el tipo `Database` placeholder
- [ ] `lib/supabase/client.ts` exporta una función que devuelve un cliente browser
- [ ] `lib/supabase/server.ts` exporta una función que devuelve un cliente server con cookies

### Conexión

- [ ] El cliente browser no lanza errores de configuración en consola del navegador
- [ ] El cliente server no lanza errores de configuración en la terminal de Next.js
- [ ] La aplicación compila sin errores con `npm run build`

### Tipado

- [ ] Los clientes aceptan el tipo genérico `Database` sin errores de TypeScript
- [ ] `database.types.ts` incluye un comentario con el comando para regenerar los tipos

---

## Decisiones tomadas y descartadas

### Decisiones tomadas

| Decisión                                                    | Justificación                                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@supabase/ssr` en lugar de `@supabase/auth-helpers-nextjs` | El paquete `ssr` es el reemplazo oficial y soporta App Router nativamente; `auth-helpers` está deprecado              |
| Dos clientes separados (browser + server)                   | App Router requiere clientes distintos: el server necesita cookies de `next/headers`, el browser no                   |
| `lib/supabase/` como directorio                             | Agrupa cliente, server y tipos en un solo lugar; facilita imports y futuros archivos del módulo (middleware, helpers) |
| Tipo `Database` placeholder en `database.types.ts`          | Permite tipar los clientes desde el inicio; se reemplaza sin cambiar los imports cuando haya schema real              |
| Variables con prefijo `NEXT_PUBLIC_`                        | URL y clave pública son seguras en el cliente; ninguna variable de Supabase requiere ocultarse en server-only         |

### Decisiones descartadas

| Decisión                                | Razón del descarte                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Instalar Supabase CLI localmente        | Innecesario hasta que haya migraciones o generación de tipos; se añade en un spec posterior                    |
| Crear middleware para refresh de sesión | Requiere auth configurada; se implementa en el spec de autenticación                                           |
| Singleton del cliente server            | `createServerClient` debe crearse por request para leer las cookies correctas; un singleton rompería la sesión |
