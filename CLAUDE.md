# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault is an online gaming platform where players compete for the highest score. Currently a fresh Next.js scaffold; game features are yet to be built.

Development follows **Spec Driven Design** using the `/spec` and `/spec-impl` skills.

No test runner is configured yet.

## Skills
Usa siempre /frontend-design para diseñar interfaz de usuario

## Stack

- **Next.js 16.2.9** — App Router; see `node_modules/next/dist/docs/` for authoritative API docs
- **React 19.2.4** — Server Components are the default; add `"use client"` only when needed
- **Tailwind CSS v4** — configured via `postcss.config.mjs`; no `tailwind.config.*` file; use CSS variables and `@theme` instead of `theme.extend`
- **TypeScript 5**

## Architecture

Uses the Next.js App Router (`app/` directory):

- `app/layout.tsx` — root layout; sets Geist fonts as CSS variables, applies `min-h-full flex flex-col` to `<body>`
- `app/page.tsx` — home route (`/`)
- `app/globals.css` — global styles imported in root layout

Route segments go under `app/`. Shared UI components, utilities, and domain logic should be added under `app/` or a top-level `src/` directory as the project grows.
