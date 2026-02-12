import crypto from "crypto";
import Repository from "../repository/repository";
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

function stripPin(user: User) {
  const { pin, ...rest } = user;
  return { ...rest, hasPin: !!pin };
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
    _id: request.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createdRoom = await Repository.insertRoom(room);
  return { _id: createdRoom, magicToken };
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

export async function updateRoom(updates: PartialWithId<Room>) {
  const existing = await Repository.findRoom(updates._id);
  if (!existing) throw new NotFoundError("Room not found");

  updates.updatedAt = new Date();
  const result = await Repository.updateRoom({...existing,...updates});
  return result;
}

export async function addUserToRoom(roomId: string, user: WithoutId<User>) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const existingUsers = await Repository.getUsersFromRoom(roomId);
  if (existingUsers.some((existing) => existing.name === user.name))
    throw new AlreadyExistsError("This user already exists in this room");

  const fullUser: User = { ...user, roomId, _id: user.name };
  const created = await Repository.createUser(fullUser);
  return stripPin(created);
}

export async function selectUser(roomId: string, userId: string, pin?: string) {
  const users = await Repository.getUsersFromRoom(roomId);
  const user = users.find((u) => u._id === userId);
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
  const target = users.find((u) => u._id === targetUserId);
  if (!target) throw new NotFoundError("User not found");

  const hashedPin = await Bun.password.hash(pin);
  await Repository.setUserPin(roomId, targetUserId, hashedPin);
}

export async function removeUserPin(
  roomId: string,
  authUserId: string,
  targetUserId: string,
) {
  const users = await Repository.getUsersFromRoom(roomId);
  const authUser = users.find((u) => u._id === authUserId);
  if (!authUser) throw new NotFoundError("Auth user not found");
  if (authUser.role !== "admin")
    throw new ForbiddenError("Only admins can remove PINs");

  const target = users.find((u) => u._id === targetUserId);
  if (!target) throw new NotFoundError("User not found");

  await Repository.removeUserPin(roomId, targetUserId);
}

export async function updateUserAvailability(
  roomId: string,
  authUserId: string,
  targetUserId: string,
  updates: Partial<Pick<User, "weeklyAvailability" | "overrides">>,
) {
  if (authUserId !== targetUserId)
    throw new ForbiddenError("You can only edit your own availability");

  const users = await Repository.getUsersFromRoom(roomId);
  const target = users.find((u) => u._id === targetUserId);
  if (!target) throw new NotFoundError("User not found");

  const updatePayload: PartialWithId<User> = { _id: targetUserId, roomId };
  if (updates.weeklyAvailability)
    updatePayload.weeklyAvailability = updates.weeklyAvailability;
  if (updates.overrides) updatePayload.overrides = updates.overrides;

  await Repository.updateUser(updatePayload);
  return stripPin({ ...target, ...updatePayload });
}

export async function removeUsersFromRoom(
  roomId: string,
  userIds: string[],
) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const existingUsers = await Repository.getUsersFromRoom(roomId);
  const usersToDelete = existingUsers.filter((user) =>
    userIds.some((id) => id===user._id),
  );

  if (usersToDelete.length === 0)
    throw new NotFoundError("No matching users found");

  const deletedCount = await Repository.deleteUsers(usersToDelete);
  return deletedCount;
}
