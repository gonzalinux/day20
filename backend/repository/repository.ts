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

async function createUser(user: User) {
  const usersCollection = getUsersCollection();
  await usersCollection.insertOne(user);
  return user;
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

async function setUserPin(roomId: string, userId: string, hashedPin: string) {
  const users = getUsersCollection();
  const result = await users.updateOne(
    { _id: userId, roomId },
    { $set: { pin: hashedPin } },
  );
  return result.matchedCount;
}

async function removeUserPin(roomId: string, userId: string) {
  const users = getUsersCollection();
  const result = await users.updateOne(
    { _id: userId, roomId },
    { $unset: { pin: "" } },
  );
  return result.matchedCount;
}

async function deleteUsers(deleteUsers: User[]) {
  const users = getUsersCollection();
  const result = await users.deleteMany(deleteUsers);
  return result.deletedCount;
}

async function findStaleRooms(before: Date) {
  const rooms = getRoomsCollection();
  return rooms.find({ updatedAt: { $lt: before } }).toArray();
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
  findStaleRooms,
  updateRoom,
  deleteRoom,
  createUser,
  getUsersFromRoom,
  updateUser,
  setUserPin,
  removeUserPin,
  deleteUsers,
};
