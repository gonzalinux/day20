import { t } from "elysia";

// ===== Nested Schemas =====

const TimeOfDaySchema = t.Object({
  hour: t.Number({ minimum: 0, maximum: 23 }),
  minute: t.Number({ minimum: 0, maximum: 59 }),
});

export const TimeSelectionSchema = t.Object({
  start: TimeOfDaySchema,
  end: TimeOfDaySchema,
});

export const SessionDurationSchema = t.Object({
  min: t.Number({ minimum: 0, maximum: 23 }),
  max: t.Number({ minimum: 0, maximum: 23 }),
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
  name: t.String({ minLength: 1 }),
  description: t.String(),
  password: t.String({ minLength: 1 }),
  duration: SessionDurationSchema,
  defaultAvailability: WeeklyAvailabilitySchema,
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
  _id: t.String(),
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  duration: t.Optional(SessionDurationSchema),
  defaultAvailability: t.Optional(WeeklyAvailabilitySchema),
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
});

export const UpdateUserRequest = t.Object({
  _id: t.String(),
  roomId: t.Optional(t.String()),
  name: t.Optional(t.String({ minLength: 1 })),
  role: t.Optional(t.Union([t.Literal("admin"), t.Literal("user")])),
  weeklyAvailability: t.Optional(WeeklyAvailabilitySchema),
  overrides: t.Optional(t.Array(OverrideSchema)),
});

export const UpdateUserAvailabilityRequest = t.Object({
  weeklyAvailability: t.Optional(WeeklyAvailabilitySchema),
  overrides: t.Optional(t.Array(OverrideSchema)),
});

export const DeleteUsersRequest = t.Object({
  userIds: t.Array(t.String()),
});

export const SetPinRequest = t.Object({
  pin: t.String({ pattern: '^\\d{4}$' }),
});

export const UserIdParam = t.Object({
  id: t.String(),
});

export const RoomUserIdParam = t.Object({
  room_id: t.String(),
  user_id: t.String(),
});
