# Day20

D&D group scheduling app. Players paint weekly availability, the app finds optimal session times.

## Project structure

```
backend/   - Bun + ElysiaJS + MongoDB API
frontend/  - Vue 3 + Pinia + Tailwind (not yet implemented)
```

## Backend architecture

Layered architecture: **routes -> service -> repository**

- `server/routes.ts` - Route handlers. Only validate/parse input (e.g. string to ObjectId) and delegate to the service. Use `status()` from the Elysia context instead of `set.status`.
- `server/requests.types.ts` - Elysia `t.Object` schemas for request validation.
- `server/errors.types.ts` - Custom error classes with a `status` property. Elysia picks up the status automatically, no `onError` hook needed.
- `domain/service.ts` - All business/domain logic lives here. Handlers never call the repository directly.
- `repository/repository.ts` - Data access layer (MongoDB CRUD).
- `repository/room.ts`, `repository/user.ts` - Domain model interfaces.
- `utils/utils.types.ts` - Shared utility types.

## Auth model

- Room-level authentication via password. No per-player PIN.
- `POST /rooms/:id/login` verifies the room password and sets an httpOnly `session` cookie containing a JWT with `{ roomId }`.
- `POST /rooms/:id/select-user` lets the logged-in user pick an avatar (player). It re-signs the JWT adding `{ userId }` to the cookie.
- All routes except `POST /rooms` and `POST /rooms/:id/login` require a valid `session` cookie. The JWT payload (`roomId`, optional `userId`) is available in the route handler via `auth`.
- `JWT_SECRET` env var is required (set in `backend/.env`).

## Backend conventions

- Runtime is Bun, not Node. See `backend/CLAUDE.md` for Bun-specific commands.
- Use `Bun.password.hash` / `Bun.password.verify` for passwords.
- Keep route handlers thin: parse inputs, call service, return result.
- Domain logic (validation, existence checks, password verification) belongs in the service layer.
