🎲 Project: Day20
Subtitle: Because finding a game date shouldn't require a Wisdom Saving Throw.

1. Executive Summary
Day20 is a high-performance, frictionless web application designed to solve the "scheduling boss fight" for D&D groups and recurring teams. By eliminating registrations and focusing on a visual "time-painting" interface, it ensures that the path from "planning" to "playing" is as short as possible.

2. The Tech Stack
Runtime: Bun (Speed & Native SQLite/Dotenv support).

API: ElysiaJS (Type-safe, high-performance web framework).

Frontend: Vue 3 (Composition API) + Pinia + Tailwind CSS.

Database: MongoDB (Flexible schema for varying player schedules).

Tooling: Vite + Eden Connector (End-to-end type safety).

3. Architecture & Data Flow
The "Frictionless" Logic
Creation: The DM creates a room /day20.app/the-lost-mines.

Profiles: DM adds names (e.g., "Grog", "Vex"). No emails required.

Access: Players visit the link, click their name, and set a 4-digit PIN for the session.

Interaction: Players "paint" their weekly availability.

The "Magic" Layer: The app overlays all schedules to find the Golden Slots (full party) and Silver Slots (minus one player).

4. Key Components
Frontend (Vue 3)
ScheduleGrid.vue: A CSS Grid-based component (24x7). Uses mouse-tracking logic to allow bulk-selection of time blocks.

AvailabilityStore.ts (Pinia): Handles the heavy lifting of computing the intersection of multiple player arrays.

RealtimeProvider.vue: Uses WebSockets to listen for "Update" events from the Bun server to refresh the UI without reloading.

Backend (ElysiaJS)
Type-Safe Routes: Utilizing Elysia's t.Object for input validation, ensuring the MongoDB documents never get corrupted.

The Aggregator: A specialized service that takes the weekly_schedule + exceptions and returns a flat array of "Best Times" for the frontend to render.

5. System Deployment (docker-compose.yml)
YAML

services:
  day20-db:
    image: mongo:latest
    container_name: day20-mongo
    volumes:
      - day20_data:/data/db
    networks:
      - day20-network

  day20-api:
    build: ./backend
    container_name: day20-elysia
    environment:
      - MONGO_URI=mongodb://day20-db:27017/day20
      - BUN_ENV=production
    depends_on:
      - day20-db
    networks:
      - day20-network

  day20-ui:
    build: ./frontend
    container_name: day20-vue
    ports:
      - "80:80"
    networks:
      - day20-network

networks:
  day20-network:
    driver: bridge

volumes:
  day20_data:
6. Implementation Notes for "Gonza"
Go/Kotlin mindset: You will enjoy Elysia’s strict typing. Use it with Eden to ensure your Vue frontend knows exactly what a ScheduleBlock looks like.

Performance: Since you are using Bun, take advantage of Bun.password.hash for the room/player PINs—it's fast and secure.

No-Login Security: To keep it "frictionless" but safe, use a JWT stored in a cookie that only contains the room_id and player_id. If the cookie is missing, ask for the 4-digit PIN.
