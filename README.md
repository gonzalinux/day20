# Day20

Scheduling app for D&D groups. Players paint their weekly availability on a calendar, the app finds when most people can play.

<!-- screenshots -->

## How it works

1. Someone creates a room with a name and password, and shares the link with the group
2. Each player joins, picks their character, and marks the hours they're free each week
3. The calendar shows the time slots where everyone overlaps
4. Players can also block or unblock specific dates for one-off exceptions

## Features

- Weekly availability grid with drag to select
- Overlap view to find the best session times
- Per-date overrides on top of the weekly schedule
- Room password + magic token link for the creator
- Per-player timezone support
- English and Spanish

## Stack

- **Backend:** Bun + ElysiaJS + MongoDB
- **Frontend:** Vue 3 + Pinia + Tailwind CSS
- **Deploy:** Docker Compose

## Self-hosting

Create `backend/.env`:
```env
JWT_SECRET=your-secret-here
```

Then:
```bash
make prod        # start
make prod-down   # stop
```

Frontend on `:3500`, API on `:3000`.

## Development

```bash
bun install
make dev-db    # MongoDB in Docker
make dev-api   # API with hot reload
make dev-ui    # Frontend dev server
```

## License

MIT
