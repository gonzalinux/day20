export interface Room {
  id: string;
  name: string;
  description: string;
  password: string;
  magicToken: string;
  createdAt?: Date;
  updatedAt?: Date;
  duration: SessionDuration;
  defaultAvailability: WeeklyAvailability;
  timezone: string;
}

export interface SessionDuration {
  min: number;
  max: number;
}

export interface TimeSelection {
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
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
