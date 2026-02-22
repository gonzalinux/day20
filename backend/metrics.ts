import { Counter, Gauge } from "prom-client";
import { register } from "./server/prometheus";
import Repository from "./repository/repository";

export const roomsCreatedTotal = new Counter({
  name: "day20_rooms_created_total",
  help: "Total number of rooms created",
  registers: [register],
});

export const roomLoginsTotal = new Counter({
  name: "day20_room_logins_total",
  help: "Total number of successful room logins",
  registers: [register],
});

export const roomsDeletedTotal = new Counter({
  name: "day20_rooms_deleted_total",
  help: "Total number of rooms deleted",
  labelNames: ["reason"] as const,
  registers: [register],
});

export const usersCreatedTotal = new Counter({
  name: "day20_users_created_total",
  help: "Total number of users created",
  registers: [register],
});

export const usersDeletedTotal = new Counter({
  name: "day20_users_deleted_total",
  help: "Total number of users deleted",
  registers: [register],
});

new Gauge({
  name: "day20_rooms_active",
  help: "Current number of rooms in the database",
  registers: [register],
  async collect() {
    const rooms = await Repository.findAllRooms();
    this.set(rooms.length);
  },
});

new Gauge({
  name: "day20_users_active",
  help: "Current number of users across all rooms",
  registers: [register],
  async collect() {
    const counts = await Repository.countUsersPerRoom();
    this.set(Object.values(counts).reduce((a, b) => a + b, 0));
  },
});
