import { ObjectId } from "mongodb";
import Repository from "../repository/repository";
import type { Room } from "../repository/room";
import type { User } from "../repository/user";
import type { PartialWithId } from "../utils/utils.types";
import {
  AlreadyExistsError,
  NotFoundError,
  UnauthorizedError,
} from "../server/errors.types";

export async function createRoom(room: Room) {
  room._id = new ObjectId();
  room.password = await Bun.password.hash(room.password);
  room.createdAt = new Date();
  room.updatedAt = new Date();

  const createdRoom = await Repository.insertRoom(room);
  return createdRoom;
}

export async function loginRoom(roomId: ObjectId, password: string) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const valid = await Bun.password.verify(password, room.password);
  if (!valid) throw new UnauthorizedError("Invalid password");

  const { password: _, ...roomWithoutPassword } = room;
  const users = await Repository.getUsersFromRoom(roomId);
  return { room: roomWithoutPassword, users };
}

export async function getRoom(roomId: ObjectId) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const { password: _, ...roomWithoutPassword } = room;
  const users = await Repository.getUsersFromRoom(roomId);
  return { room: roomWithoutPassword, users };
}

export async function updateRoom(updates: PartialWithId<Room>) {
  const existing = await Repository.findRoom(updates._id);
  if (!existing) throw new NotFoundError("Room not found");

  updates.updatedAt = new Date();
  const result = await Repository.updateRoom(updates);
  return result;
}

export async function addUsersToRoom(roomId: ObjectId, users: User[]) {
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
    _id: new ObjectId(),
  }));
  const createdUsers = await Repository.createUsers(users);
  return createdUsers;
}

export async function removeUsersFromRoom(
  roomId: ObjectId,
  userIds: ObjectId[],
) {
  const room = await Repository.findRoom(roomId);
  if (!room) throw new NotFoundError("Room not found");

  const existingUsers = await Repository.getUsersFromRoom(roomId);
  const usersToDelete = existingUsers.filter((user) =>
    userIds.some((id) => id.equals(user._id)),
  );

  if (usersToDelete.length === 0)
    throw new NotFoundError("No matching users found");

  const deletedCount = await Repository.deleteUsers(usersToDelete);
  return deletedCount;
}
