# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Day20

D&D group scheduling app. Players paint weekly availability, the app finds optimal session times.

## Project structure

Bun workspace monorepo (`package.json` at root with `"workspaces": ["backend", "frontend"]`).

```
backend/   - Bun + ElysiaJS + MongoDB API
frontend/  - Vue 3 + Pinia + Tailwind CSS + Vue Router + vue-i18n
```

## Development commands

All commands use Bun. See also the root `Makefile`.

```bash
# Start everything (DB + API + UI)
make dev

# Individual services
make dev-db                              # MongoDB in Docker (port 27017)
make dev-api                             # Backend API (port 3000)
make dev-ui                              # Frontend dev server (port 3500)

# Backend
cd backend && bun run index.ts           # Run API server
cd backend && bun test                   # Run tests

# Frontend
cd frontend && bun run dev               # Vite dev server
cd frontend && bun run build             # Type-check + production build
cd frontend && bun run type-check        # vue-tsc type checking only
cd frontend && bun lint                  # oxlint + eslint (with --fix)
cd frontend && bun run format            # Prettier

# Production (Docker Compose)
make prod                                # docker compose up -d
make prod-down                           # docker compose down
```

**Environment:** `backend/.env` must contain `JWT_SECRET` and `MONGO_URI`. Bun loads `.env` automatically (no dotenv needed).

## Backend architecture

Layered architecture: **routes -> service -> repository**

- `server/routes.ts` - Route handlers. Only validate/parse input (e.g. string to ObjectId) and delegate to the service. Use `status()` from the Elysia context instead of `set.status`.
- `server/requests.types.ts` - Elysia `t.Object` schemas for request validation.
- `server/errors.types.ts` - Custom error classes with a `status` property. Elysia picks up the status automatically, no `onError` hook needed.
- `domain/service.ts` - All business/domain logic lives here. Handlers never call the repository directly.
- `repository/repository.ts` - Data access layer (MongoDB CRUD).
- `repository/room.ts`, `repository/user.ts` - Domain model interfaces.
- `utils/utils.types.ts` - Shared utility types.

## Frontend architecture

- **Eden treaty client** (`services/client.ts`) provides end-to-end type safety by importing the backend `App` type directly. All API calls go through thin wrappers in `services/` (rooms, users, auth).
- **Pinia store** (`stores/room.ts`) holds room + users state and wraps all API mutations.
- **Router** uses path-prefix i18n: `/es/...` for Spanish, `/...` (no prefix) for English. Locale is set via a `beforeEach` guard.
- **Views:** `HomeView` (create/join room), `RoomLoginView` (password entry), `RoomView` (main room UI with calendar, users, settings panels).

## Auth model

- Room-level authentication via password (or magic token for the room creator).
- JWT stored in httpOnly `session` cookie. Payload: `{ rooms: Record<roomId, userId> }` — a map of all rooms the user has logged into and the selected user in each.
- `POST /rooms/login` verifies credentials and adds the room to the JWT map.
- `POST /rooms/:id/select-user` picks a player avatar and updates the JWT with the userId for that room.
- `protectedRoutes` guard (`server/auth.ts`) verifies the cookie and checks the requested `room_id` exists in the JWT's `rooms` map.
- `JWT_SECRET` env var is required (set in `backend/.env`).

## Backend conventions

- Runtime is Bun, not Node. Use `bun <file>`, `bun test`, `bun install`.
- Use `Bun.password.hash` / `Bun.password.verify` for passwords and PINs.
- Keep route handlers thin: parse inputs, call service, return result.
- Domain logic (validation, existence checks, password verification) belongs in the service layer.
- Room `_id` is the room name (string). User `_id` is the user name (string, scoped to a room via `roomId`).


HOW TO WORK:
- No unnecessary comments
