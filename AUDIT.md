# Project Audit — Day20

**Date:** 2026-02-17 (updated)

## Scores

| Category | Score | Notes |
|---|---|---|
| **Security** | 7/10 | Proper hashing, CORS restricted, JWT expiry, admin auth, secure cookies. Still no rate limiting, magic token leaks |
| **Correctness** | 8.5/10 | Override dedup fixed, user ID scoped, updateRoom safe. formatDateKey timezone edge case remains |
| **Code Quality** | 8/10 | Clean layered architecture. DAY_I18N_KEYS extracted, dead code removed, examples updated |
| **UX** | 8.5/10 | Theme persists, visibility polling, aria-labels, clipboard error handling, error toasts |
| **Architecture** | 8/10 | DB indexes, request size limits, graceful shutdown. No real-time sync |
| **Testing** | 3.5/10 | Some backend service tests + frontend util tests. No component/integration/E2E tests |
| **Overall** | **7.5/10** | |

---

## Fixed Since Last Audit

- **Shared debounce timer** — `saveWeeklyAvailability` and `saveOverrides` now use separate timers (`weeklyTimer` / `overrideTimer`)
- **Debounced saves swallow errors** — Both debounce callbacks now have `try/catch` with rollback to previous state and `saveError` flag that triggers an error toast
- **Optimistic updates without rollback** — The debounced saves (`saveWeeklyAvailability`, `saveOverrides`) now capture `prev` state and restore it on failure
- **Toast duplication** — Extracted to `BaseToast.vue` + `useToast` composable, mounted once at app root
- **`typeof date === 'string'` checks** — Removed; overrides now consistently use `Date` objects
- **CORS restricted** — `cors()` now restricted to `localhost:3500` and `day-20.com` with credentials
- **Admin authorization** — `updateRoom`, `addUserToRoom`, `removeUsersFromRoom` now check admin role via `assertAdmin()`
- **Cookie secure flag** — All `session.set()` calls include `secure: true`
- **JWT expiry** — Tokens now expire after 30 days
- **Error classes on PIN routes** — `throw new Error()` replaced with `throw new UnauthorizedError()`
- **Override accumulation bug** — `commitOverridePaint()` now deduplicates overrides for painted dates
- **User `_id` collision** — User id format changed to `roomId:name`
- **`deleteUsers` scoped by room** — Added `roomId` to the delete query
- **`removeUserPin` clears `pinSkipped`** — Now sets `pinSkipped: false` alongside pin removal
- **`updateRoom` no longer spreads entire document** — Passes only `updates` to the repository
- **`emptyWeek`/`emptyRoom` factory functions** — Converted from shared constants to factory functions to prevent mutation
- **RoomView error handling** — Shows error toast when room/users fetch fails
- **NameYourselfCard uses store** — Replaced direct API calls with `useRoomStore()`
- **Dead `localDayOffset` removed** — Removed no-op variable in `timezone.ts`
- **`DAY_I18N_KEYS` extracted** — Shared constant in `availability.ts`, imported everywhere
- **Example files updated** — `roomExample.json` and `userExample.json` match current interfaces
- **HTML defaults** — `lang="en"`, proper title, OG meta, favicons, manifest
- **Theme persistence** — Dark mode saved to/read from `localStorage`
- **Polling visibility check** — `fetchUsers` skipped when tab is hidden
- **`aria-label` on icon buttons** — Added to ThemeToggle, LangToggle, MiniCalendar, CombinedCalendar
- **Clipboard error handling** — `copyShareLink` wrapped in try/catch with error toast
- **MongoDB indexes** — Created on `users.roomId` and `rooms.updatedAt`
- **Overrides maxItems** — `UpdateUserAvailabilityRequest` limited to 500 overrides
- **Graceful shutdown** — SIGTERM/SIGINT handlers close DB and stop server

---

## Security

### CRITICAL: Magic token leaked to all users on login NO ACTION

`backend/domain/service.ts:61` — `loginRoom` returns the full room object minus password, which includes `magicToken`. Any user who joins with the password receives the creator's magic token and can share it freely, bypassing password auth entirely.

`frontend/src/views/RoomLoginView.vue:153` — The frontend even passes `magicToken` as a query param when navigating after password login.

### HIGH: No rate limiting NO ACTION

No rate limiting middleware on any endpoint. The 4-digit PIN (`/rooms/:id/select-user`) has only 10,000 combinations — trivially brute-forceable. Room passwords are also vulnerable.

### MEDIUM: Room name validation typo — never enforced NO ACTION

`backend/server/requests.types.ts:43` — `patern` instead of `pattern`. The regex `^[a-zA-Z0-9\\s]+$` is silently ignored by TypeBox, so room names can contain any characters.

### LOW: Room enumeration NO ACTION

`/rooms/:room_id/exists` is unauthenticated. Attackers can probe for room names.

### LOW: Logger logs full response bodies NO ACTION

`backend/server/logger.ts:12` — Logs entire response payloads including magic tokens and user data.

---

## Correctness

### LOW: `formatDateKey` uses local timezone NO ACTION

`frontend/src/utils/availability.ts:137-142` — Uses `getFullYear()`, `getMonth()`, `getDate()` (local time). Override dates parsed from ISO strings are in UTC. The formatted key could be off by a day depending on the viewer's timezone.

### LOW: Debug `console.log('bbb')` left in code NO ACTION

`frontend/src/views/room/RoomEntry.vue:26`

---

## Code Quality

### Dead code

- `backend/server/usersHandler.ts` — Empty file NO ACTION
- `backend/server/requests.types.ts` — `UpdateUserRequest` (line 87) and `UserIdParam` (line 110) are defined but never used NO ACTION
- `backend/index.ts:1` — `t` imported from `elysia` but never used NO ACTION

### Duplication

- `WeeklyAvailability`, `TimeSelection`, `TimeOfDay` types are defined in both backend (`repository/room.ts`) and frontend (`utils/availability.ts`) with no shared types package

---

## UX

### No keyboard accessibility on calendar grid NO ACTION

The paint grid in `CalendarPanel.vue` is entirely pointer-based. No keyboard navigation or screen reader support.

### Stale room deletion with no warning NO ACTION

Rooms are deleted after 30 days of inactivity (`backend/domain/service.ts:14`) with no notification.

---

## Architecture

### No real-time sync NO ACTION

Users must refresh to see others' changes. No WebSocket/SSE mechanism.

### Cleanup scheduler fire-and-forget NO ACTION

`backend/domain/service.ts:212` — `cleanupStaleRooms()` called without `await` inside `startCleanupScheduler()`.

---

## Testing

### What's tested

- **Backend:** `createRoom`, `loginRoom`, `addUserToRoom`, `updateUserAvailability`, `selectUser` (service layer with mocked repository)
- **Frontend:** `availabilityToGrid`, `gridToAvailability`, `formatDateKey`, `getTimeRange`, `applyOverridesToGrid`, `dateToDayKey`, `formatSlotTime`, timezone conversions

### What's not tested

- Backend: `getRoom`, `getUsersFromRoom`, `roomExists`, `updateRoom`, `removeUsersFromRoom`, `setUserPin`, `removeUserPin`, `cleanupStaleRooms`, all route handlers, auth middleware, error paths
- Frontend: No component tests, no store tests, no service layer tests, no router guard tests, no i18n tests
- No E2E tests (no Cypress/Playwright)
- No integration tests against a real database

---

## Docker / Deployment

- `frontend/Dockerfile:2` — Uses `oven/bun:canary-slim` (unstable channel). Pin a specific version for production.
- `backend/Dockerfile:5` — `COPY . .` copies `.env`, `node_modules`, and tests. Missing `.dockerignore`.
- `docker-compose.yml` — MongoDB has no authentication configured.
- No health checks on any service.
- `.env` JWT_SECRET is shared between dev and prod docker compose.
