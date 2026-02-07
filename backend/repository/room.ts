import { ObjectId } from "mongodb";
export interface Room {
  _id: ObjectId;
  name: string;
  description: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  duration: SessionDuration;
  defaultAvailability: WeeklyAvailability;
}

export interface SessionDuration {
  min: number;
  max: number;
}

export interface TimeSelection {
  start: Date;
  end: Date;
}

export interface WeeklyAvailability {
  monday: TimeSelection[];
  tuesday: TimeSelection[];
  wednesday: TimeSelection[];
  thursday: TimeSelection[];
  friday: TimeSelection[];
  saturday: TimeSelection[];
  sunday: TimeSelection[];
}
