import type { TimeSelection, WeeklyAvailability } from "./room";

export interface User {
  id: string;
  roomId: string;
  name: string;
  role: UserRole;
  pin?: string;
  weeklyAvailability: WeeklyAvailability;
  overrides: Override[];
  timezone: string;
}

export type UserRole = "admin" | "user";

export interface Override {
  date: Date;
  availability: TimeSelection[];
  type: "unblock" | "block";
}
