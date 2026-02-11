import type { ObjectId } from "mongodb";
import type { TimeSelection, WeeklyAvailability } from "./room";

export interface User {

  _id: string;
  roomId: string;
  name: string;
  role: UserRole;
  pin?: string;
  weeklyAvailability: WeeklyAvailability;
  overrides: Override[];
}

export type UserRole = "admin" | "user";

export interface Override {
  date: Date;
  availability: TimeSelection[];
  type: "unblock" | "block";
}
