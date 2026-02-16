# Project Audit — Day20

**Date:** 2026-02-16

## Scores

| Category | Score | Notes |
|---|---|---|
| **Security** | 6.5/10 | Rate limiting at gateway, proper hashing. Room enumeration is minor |
| **Correctness** | 6/10 | Shared debounce bug loses data silently |
| **Code Quality** | 7.5/10 | Clean layered architecture, good separation of concerns |
| **UX** | 7/10 | Toast feedback, mobile bottom bar, i18n all present |
| **Architecture** | 7/10 | Solid foundation with end-to-end type safety, missing real-time sync |
| **Testing** | 3/10 | Minimal coverage |
| **Overall** | **6.5/10** | |

## Issues Found

### Shared debounce timer causes data loss

`frontend/src/stores/room.ts:130` — `saveWeeklyAvailability` and `saveOverrides` share a single `saveTimer`. If a user saves weekly availability then overrides within 600ms, only the second save fires and weekly changes are silently dropped.

### Debounced saves swallow errors

The `setTimeout` callbacks in `saveWeeklyAvailability` and `saveOverrides` have no `.catch()`. If the API call fails, the user sees their changes reflected locally but the server never received them.

### Optimistic updates without rollback

Store actions like `addUser`, `saveDuration`, and `saveDefaultAvailability` update local state before the API call returns. If the API fails, the UI shows data that doesn't exist on the server with no revert mechanism.

### Timezone-dependent date keys

`frontend/src/utils/availability.ts:137` — `formatDateKey` uses local time (`getFullYear`, `getMonth`, `getDate`). Users in different timezones generate different date keys for the same moment, causing override mismatches when collaborating across timezones.

### Room enumeration

`/rooms/:room_id/exists` is a public endpoint with no authentication. Attackers can probe for room names. Low severity depending on threat model.

### Stale room cleanup with no warning

Rooms are deleted after 30 days of inactivity (`backend/domain/service.ts:14`) with no prior notification to users. Data is unrecoverable.

### No real-time sync

When one user updates availability, others must refresh to see changes. No WebSocket or SSE mechanism exists for live collaboration.

### Minimal test coverage

Backend has limited tests. Frontend has no visible test suite. No E2E tests.
