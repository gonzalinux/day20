import type { ObjectId } from "mongodb";
import type { TimeSelection, WeeklyAvailability } from "./room";

export interface User {
  _id: ObjectId;
  roomId: ObjectId;
  name: string;
  role: UserRole;
  weeklyAvailability: WeeklyAvailability;
  overrides: Override[];
}

export type UserRole = "admin" | "user";

export interface Override {
  date: Date;
  availability: TimeSelection[];
  type: "unblock" | "block";
}
