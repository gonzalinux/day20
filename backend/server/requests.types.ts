import { t } from "elysia";

// ===== Shared Schemas =====

const TimezoneSchema = t.String({ minLength: 1, maxLength: 100 });

// ===== Nested Schemas =====

const TimeOfDaySchema = t.Object({
  hour: t.Number({ minimum: 0, maximum: 24 }),
  minute: t.Number({ minimum: 0, maximum: 59 }),
});

export const TimeSelectionSchema = t.Object({
  start: TimeOfDaySchema,
  end: TimeOfDaySchema,
});

export const SessionDurationSchema = t.Object({
  min: t.Number({ minimum: 0, maximum: 24 }),
  max: t.Number({ minimum: 0, maximum: 24 }),
});

export const WeeklyAvailabilitySchema = t.Object({
  monday: t.Array(TimeSelectionSchema),
  tuesday: t.Array(TimeSelectionSchema),
  wednesday: t.Array(TimeSelectionSchema),
  thursday: t.Array(TimeSelectionSchema),
  friday: t.Array(TimeSelectionSchema),
  saturday: t.Array(TimeSelectionSchema),
  sunday: t.Array(TimeSelectionSchema),
});

export const OverrideSchema = t.Object({
  date: t.Date({ format: "date-time" }),
  availability: t.Array(TimeSelectionSchema),
  type: t.Union([t.Literal("unblock"), t.Literal("block")]),
});

// ===== Room Request Schemas =====

export const CreateRoomRequest = t.Object({
  name: t.String({ minLength: 3, maxLength:100, pattern: "^[a-zA-Z0-9\\s]+$" }),
  description: t.String({maxLength:500}),
  password: t.String({ minLength: 1 }),
  duration: SessionDurationSchema,
  defaultAvailability: WeeklyAvailabilitySchema,
  timezone: TimezoneSchema,
});

export type CreateRoomRequest = typeof CreateRoomRequest.static;

export const LoginRoomRequest = t.Object({
  id: t.String(),
  password: t.Optional(t.String({ minLength: 1 })),
  token: t.Optional(t.String({ minLength: 1 })),
});

export const SelectUserRequest = t.Object({
  userId: t.String(),
  pin: t.Optional(t.String()),
});

export const UpdateRoomRequest = t.Object({
  id: t.String(),
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  duration: t.Optional(SessionDurationSchema),
  defaultAvailability: t.Optional(WeeklyAvailabilitySchema),
  timezone: t.Optional(TimezoneSchema),
});

export const RoomIdParam = t.Object({
  room_id: t.String(),
},{additionalProperties:true});

// ===== User Request Schemas =====

export const CreateUserRequest = t.Object({
  name: t.String({ minLength: 1 }),
  role: t.Union([t.Literal("admin"), t.Literal("user")]),
  weeklyAvailability: WeeklyAvailabilitySchema,
  overrides: t.Array(OverrideSchema),
  timezone: TimezoneSchema,
});

export const UpdateUserRequest = t.Object({
  id: t.String(),
  roomId: t.Optional(t.String()),
  name: t.Optional(t.String({ minLength: 1 })),
  role: t.Optional(t.Union([t.Literal("admin"), t.Literal("user")])),
  weeklyAvailability: t.Optional(WeeklyAvailabilitySchema),
  overrides: t.Optional(t.Array(OverrideSchema)),
});

export const UpdateUserAvailabilityRequest = t.Object({
  weeklyAvailability: t.Optional(WeeklyAvailabilitySchema),
  overrides: t.Optional(t.Array(OverrideSchema, { maxItems: 500 })),
  timezone: t.Optional(TimezoneSchema),
});

export const DeleteUsersRequest = t.Object({
  userIds: t.Array(t.String()),
});

export const SetPinRequest = t.Object({
  pin: t.String({ pattern: '^(\\d{4}|)$' }),
});

export const UserIdParam = t.Object({
  id: t.String(),
});

export const RoomUserIdParam = t.Object({
  room_id: t.String(),
  user_id: t.String(),
});
