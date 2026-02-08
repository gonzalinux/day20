import { t } from "elysia";

// ===== Nested Schemas =====

export const TimeSelectionSchema = t.Object({
  start: t.Date({ format: "date-time" }),
  end: t.Date({ format: "date-time" }),
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
  date: t.String({ format: "date-time" }),
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
  password: t.String({ minLength: 1 }),
});

export const SelectUserRequest = t.Object({
  userId: t.String(),
});

export const UpdateRoomRequest = t.Object({
  _id: t.String(),
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  duration: t.Optional(SessionDurationSchema),
  defaultAvailability: t.Optional(WeeklyAvailabilitySchema),
});

export const RoomIdParam = t.Object({
  id: t.String(),
});

// ===== User Request Schemas =====

export const CreateUserRequest = t.Object({
  roomId: t.String(),
  name: t.String({ minLength: 1 }),
  role: t.Union([t.Literal("admin"), t.Literal("user")]),
  weeklyAvailability: WeeklyAvailabilitySchema,
  overrides: t.Array(OverrideSchema),
});

export const CreateUsersRequest = t.Object({
  users: t.Array(CreateUserRequest),
});

export const UpdateUserRequest = t.Object({
  _id: t.String(),
  roomId: t.Optional(t.String()),
  name: t.Optional(t.String({ minLength: 1 })),
  role: t.Optional(t.Union([t.Literal("admin"), t.Literal("user")])),
  weeklyAvailability: t.Optional(WeeklyAvailabilitySchema),
  overrides: t.Optional(t.Array(OverrideSchema)),
});

export const DeleteUsersRequest = t.Object({
  userIds: t.Array(t.String()),
});

export const UserIdParam = t.Object({
  id: t.String(),
});
