import crypto from "crypto";
import Repository from "../repository/repository";
import type { Room } from "../repository/room";
import type { User } from "../repository/user";
import type { PartialWithId } from "../utils/utils.types";
import {
  AlreadyExistsError,
  NotFoundError,
  UnauthorizedError,
} from "../server/errors.types";
import type { CreateRoomRequest } from "../server/requests.types";

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
  return { room: roomWithoutPassword, users };
}

export async function getRoom(roomId: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const { password: _, ...roomWithoutPassword } = room;
  const users = await Repository.getUsersFromRoom(roomId);
  return { room: roomWithoutPassword, users };
}

export async function getUsersFromRoom(roomId: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  return await Repository.getUsersFromRoom(roomId);
}

export async function updateRoom(updates: PartialWithId<Room>) {
  const existing = await Repository.findRoom(updates._id);
  if (!existing) throw new NotFoundError("Room not found");

  updates.updatedAt = new Date();
  const result = await Repository.updateRoom(updates);
  return result;
}

export async function addUsersToRoom(roomId: string, users: User[]) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const existingUsers = await Repository.getUsersFromRoom(roomId);
  if (
    users.some((user) =>
      existingUsers.some((existingUser) => existingUser.name == user.name),
    )
  )
    throw new AlreadyExistsError("This user already exists in this room");

  users = users.map((user) => ({
    ...user,
    roomId,
    _id: user.name,
  }));
  const createdUsers = await Repository.createUsers(users);
  return createdUsers;
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
