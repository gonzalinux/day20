import crypto from "crypto";
import Repository from "../repository/repository";
import {
  roomsCreatedTotal,
  roomLoginsTotal,
  roomsDeletedTotal,
  usersCreatedTotal,
  usersDeletedTotal,
} from "../metrics";
import type { Room } from "../repository/room";
import type { User } from "../repository/user";
import type { PartialWithId, WithoutId } from "../utils/utils.types";
import {
  AlreadyExistsError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../server/errors.types";
import type { CreateRoomRequest } from "../server/requests.types";

export const STALE_ROOM_MS = 30 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 7.3 * 60 * 60 * 1000;

async function assertAdmin(roomId: string, userId: string) {
  const users = await Repository.getUsersFromRoom(roomId);
  const user = users.find((u) => u.id === userId);
  if (!user || (user.role !== "admin" && user.role !== "subAdmin"))
    throw new ForbiddenError("Only admins can perform this action");
}

function stripPin(user: User) {
  const { pin, ...rest } = user;
  return { ...rest, hasPin: !!pin, pinSkipped: !!user.pinSkipped };
}

export async function roomExists(roomId: string) {
  const room = await Repository.findRoom(roomId);
  return !!room;
}

export async function createRoom(request: CreateRoomRequest) {
  const magicToken = crypto.randomBytes(32).toString("base64url");
  const room: Room = {
    ...request,
    password: await Bun.password.hash(request.password),
    magicToken,
    id: request.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createdRoom = await Repository.insertRoom(room);
  roomsCreatedTotal.inc();
  return { id: createdRoom, magicToken };
}

export async function loginRoom(
  roomId: string,
  credentials: { password?: string; token?: string },
) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  if (credentials.token) {
    if (credentials.token !== room.magicToken)
      throw new UnauthorizedError("Invalid token");
  } else if (credentials.password) {
    const valid = await Bun.password.verify(credentials.password, room.password);
    if (!valid) throw new UnauthorizedError("Invalid password");
  } else {
    throw new UnauthorizedError("Password or token required");
  }

  await Repository.updateRoom({ id: roomId, updatedAt: new Date() });
  roomLoginsTotal.inc();

  const { password: _, ...roomWithoutPassword } = room;
  const users = await Repository.getUsersFromRoom(roomId);
  return { room: roomWithoutPassword, users: users.map(stripPin) };
}

export async function getRoom(roomId: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const { password: _, ...roomWithoutPassword } = room;
  const users = await Repository.getUsersFromRoom(roomId);
  return { room: roomWithoutPassword, users: users.map(stripPin) };
}

export async function getUsersFromRoom(roomId: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const users = await Repository.getUsersFromRoom(roomId);
  return users.map(stripPin);
}

export async function updateRoom(updates: PartialWithId<Room>, authUserId?: string) {
  const existing = await Repository.findRoom(updates.id);
  if (!existing) throw new NotFoundError("Room not found");

  if (!authUserId) throw new UnauthorizedError("Must select a user first");
  await assertAdmin(updates.id, authUserId);

  updates.updatedAt = new Date();
  const result = await Repository.updateRoom(updates);
  return result;
}

export async function addUserToRoom(roomId: string, user: WithoutId<User>, authUserId?: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const existingUsers = await Repository.getUsersFromRoom(roomId);

  if (existingUsers.length > 0) {
    if (!authUserId) throw new UnauthorizedError("Must select a user first");
    await assertAdmin(roomId, authUserId);
  }
  if (existingUsers.some((existing) => existing.name === user.name))
    throw new AlreadyExistsError("This user already exists in this room");

  const fullUser: User = { ...user, roomId, id: `${roomId}:${user.name}` };
  const created = await Repository.createUser(fullUser);
  usersCreatedTotal.inc();
  return stripPin(created);
}

export async function selectUser(roomId: string, userId: string, pin?: string) {
  const users = await Repository.getUsersFromRoom(roomId);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new NotFoundError("User not found in this room");

  if (user.pin) {
    if (!pin) throw new UnauthorizedError("PIN required");
    const valid = await Bun.password.verify(pin, user.pin);
    if (!valid) throw new UnauthorizedError("Wrong PIN");
  }

  return user;
}

export async function setUserPin(
  roomId: string,
  authUserId: string,
  targetUserId: string,
  pin: string,
) {
  if (authUserId !== targetUserId)
    throw new ForbiddenError("You can only set your own PIN");

  const users = await Repository.getUsersFromRoom(roomId);
  const target = users.find((u) => u.id === targetUserId);
  if (!target) throw new NotFoundError("User not found");

  if (pin === "") {
    await Repository.skipUserPin(roomId, targetUserId);
    return;
  }

  const hashedPin = await Bun.password.hash(pin);
  await Repository.setUserPin(roomId, targetUserId, hashedPin);
}

export async function removeUserPin(
  roomId: string,
  authUserId: string,
  targetUserId: string,
) {
  const users = await Repository.getUsersFromRoom(roomId);
  const authUser = users.find((u) => u.id === authUserId);
  if (!authUser) throw new NotFoundError("Auth user not found");
  if (authUser.role !== "admin" && authUser.role !== "subAdmin")
    throw new ForbiddenError("Only admins can remove PINs");

  const target = users.find((u) => u.id === targetUserId);
  if (!target) throw new NotFoundError("User not found");

  await Repository.removeUserPin(roomId, targetUserId);
}

export async function updateUserAvailability(
  roomId: string,
  authUserId: string,
  targetUserId: string,
  updates: Partial<Pick<User, "weeklyAvailability" | "overrides" | "timezone" | "name" | "role">>,
) {
  const users = await Repository.getUsersFromRoom(roomId);
  const authUser = users.find((u) => u.id === authUserId);
  if (!authUser) throw new NotFoundError("Auth user not found");
  const target = users.find((u) => u.id === targetUserId);
  if (!target) throw new NotFoundError("User not found");

  const isSelf = authUserId === targetUserId;
  const isAdmin = authUser.role === "admin" || authUser.role === "subAdmin";

  if (
    (updates.weeklyAvailability !== undefined ||
      updates.overrides !== undefined ||
      updates.timezone !== undefined) &&
    !isSelf
  )
    throw new ForbiddenError("You can only edit your own availability");

  if (updates.name !== undefined) {
    if (!isSelf && !isAdmin)
      throw new ForbiddenError("Only admins can rename other users");
    if (users.some((u) => u.id !== targetUserId && u.name === updates.name))
      throw new AlreadyExistsError("A user with that name already exists");
  }

  if (updates.role !== undefined) {
    if (!isAdmin)
      throw new ForbiddenError("Only admins can change user roles");
    if (isSelf)
      throw new ForbiddenError("You cannot change your own role");
    if (updates.role === "subAdmin" && !target.pin)
      throw new ForbiddenError("User must have a PIN to become admin");
    if (updates.role === "user" && authUser.role !== "admin")
      throw new ForbiddenError("Only the creator can demote admins");
  }

  const updatePayload: PartialWithId<User> = { id: targetUserId, roomId };
  if (updates.weeklyAvailability)
    updatePayload.weeklyAvailability = updates.weeklyAvailability;
  if (updates.overrides) updatePayload.overrides = updates.overrides;
  if (updates.timezone) updatePayload.timezone = updates.timezone;
  if (updates.name !== undefined) updatePayload.name = updates.name;
  if (updates.role !== undefined) updatePayload.role = updates.role;

  await Repository.updateUser(updatePayload);
  return stripPin({ ...target, ...updatePayload });
}

export async function deleteRoom(roomId: string, authUserId: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  await assertAdmin(roomId, authUserId);
  await Repository.deleteRoom(roomId);
  roomsDeletedTotal.inc({ reason: "manual" });
}

export async function removeUsersFromRoom(
  roomId: string,
  userIds: string[],
  authUserId?: string,
) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  if (!authUserId) throw new UnauthorizedError("Must select a user first");
  await assertAdmin(roomId, authUserId);

  const existingUsers = await Repository.getUsersFromRoom(roomId);
  const usersToDelete = existingUsers.filter((user) =>
    userIds.some((id) => id === user.id),
  );

  if (usersToDelete.length === 0)
    throw new NotFoundError("No matching users found");

  const deletedCount = await Repository.deleteUsers(usersToDelete, roomId);
  usersDeletedTotal.inc(deletedCount);
  return deletedCount;
}

export async function getAllRoomsAdmin() {
  const rooms = await Repository.findAllRooms();
  const userCounts = await Repository.countUsersPerRoom();
  const now = Date.now();
  return rooms.map(({ password, magicToken, ...room }) => ({
    ...room,
    userCount: userCounts[room.id] ?? 0,
    daysUntilExpiry: Math.max(
      0,
      Math.ceil(
        (room.updatedAt!.getTime() + STALE_ROOM_MS - now) / (1000 * 60 * 60 * 24),
      ),
    ),
  }));
}

export async function deleteRoomAdmin(roomId: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");
  await Repository.deleteRoom(roomId);
  roomsDeletedTotal.inc({ reason: "admin" });
}

async function cleanupStaleRooms() {
  const cutoff = new Date(Date.now() - STALE_ROOM_MS);
  const staleRooms = await Repository.findStaleRooms(cutoff);
  for (const room of staleRooms) {
    await Repository.deleteRoom(room.id);
    console.log(`Deleted stale room: ${room.id}`);
  }
  if (staleRooms.length > 0) {
    roomsDeletedTotal.inc({ reason: "cleanup" }, staleRooms.length);
    console.log(`Cleanup: removed ${staleRooms.length} stale room(s)`);
  }
}

export function startCleanupScheduler() {
  cleanupStaleRooms();
  setInterval(cleanupStaleRooms, CLEANUP_INTERVAL_MS);
}
