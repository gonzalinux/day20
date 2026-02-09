import type { Collection, ObjectId } from "mongodb";
import { DB } from "./db";
import type { Room } from "./room";
import type { User } from "./user";
import type { PartialWithId } from "../utils/utils.types";

function getRoomsCollection(): Collection<Room> {
  return DB().collection("rooms");
}

function getUsersCollection(): Collection<User> {
  return DB().collection("users");
}

async function insertRoom(room: Room) {
  const rooms = getRoomsCollection();
  const result = await rooms.insertOne(room);
  return result.insertedId;
}

async function findRoom(id: string) {
  const rooms = getRoomsCollection();
  const result = await rooms.findOne({ _id: id });
  return result;
}

async function updateRoom(updates: PartialWithId<Room>) {
  const rooms = getRoomsCollection();
  const result = await rooms.updateOne({ _id: updates._id }, { $set: updates });
  return result.matchedCount;
}

export async function createUsers(users: User[]) {
  const usersCollection = getUsersCollection();
  const result = await usersCollection.insertMany(users);
  return result.insertedIds;
}

async function getUsersFromRoom(roomId: string) {
  const users = getUsersCollection();
  const result = await users.find({ roomId }).toArray();
  return result;
}

async function updateUser(updates: PartialWithId<User>) {
  const users = getUsersCollection();
  const result = await users.updateOne({ _id: updates._id }, { $set: updates });
  return result.matchedCount;
}

async function deleteUsers(deleteUsers: User[]) {
  const users = getUsersCollection();
  const result = await users.deleteMany(deleteUsers);
  return result.deletedCount;
}

async function deleteRoom(roomId: string) {
  const rooms = getRoomsCollection();
  const usersOfRoom = await getUsersFromRoom(roomId);
  let result = await deleteUsers(usersOfRoom);
  result += (await rooms.deleteOne({ _id: roomId })).deletedCount;
  return result;
}

export default {
  insertRoom,
  findRoom,
  updateRoom,
  deleteRoom,
  createUsers,
  getUsersFromRoom,
  updateUser,
  deleteUsers,
};
