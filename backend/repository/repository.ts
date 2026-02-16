import type { Collection } from "mongodb";
import { DB } from "./db";
import type { Room } from "./room";
import type { User } from "./user";
import type { PartialWithId } from "../utils/utils.types";

type MongoDoc<T extends { id: string }> = Omit<T, "id"> & { _id: string };

function getRoomsCollection(): Collection<MongoDoc<Room>> {
  return DB().collection("rooms");
}

function getUsersCollection(): Collection<MongoDoc<User>> {
  return DB().collection("users");
}

function toMongo<T extends { id: string }>(obj: T): MongoDoc<T> {
  const { id, ...rest } = obj;
  return { ...rest, _id: id } as MongoDoc<T>;
}

function fromMongo<T>(doc: MongoDoc<T & { id: string }>): T & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id } as T & { id: string };
}

async function insertRoom(room: Room) {
  const rooms = getRoomsCollection();
  const mongoDoc = toMongo(room);
  await rooms.insertOne(mongoDoc);
  return room.id;
}

async function findRoom(id: string): Promise<Room | null> {
  const rooms = getRoomsCollection();
  const result = await rooms.findOne({ _id: id });
  if (!result) return null;
  return fromMongo<Room>(result);
}

async function updateRoom(updates: PartialWithId<Room>) {
  const rooms = getRoomsCollection();
  const mongoDoc = toMongo(updates);
  const { _id, ...setFields } = mongoDoc;
  const result = await rooms.updateOne({ _id }, { $set: setFields });
  return result.matchedCount;
}

async function createUser(user: User) {
  const usersCollection = getUsersCollection();
  await usersCollection.insertOne(toMongo(user));
  return user;
}

async function getUsersFromRoom(roomId: string): Promise<User[]> {
  const users = getUsersCollection();
  const result = await users.find({ roomId }).toArray();
  return result.map((doc) => fromMongo<User>(doc));
}

async function updateUser(updates: PartialWithId<User>) {
  const users = getUsersCollection();
  const mongoDoc = toMongo(updates);
  const { _id, ...setFields } = mongoDoc;
  const result = await users.updateOne({ _id }, { $set: setFields });
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
  const ids = deleteUsers.map((u) => u.id);
  const result = await users.deleteMany({ _id: { $in: ids } });
  return result.deletedCount;
}

async function findStaleRooms(before: Date): Promise<Room[]> {
  const rooms = getRoomsCollection();
  const result = await rooms.find({ updatedAt: { $lt: before } }).toArray();
  return result.map((doc) => fromMongo<Room>(doc));
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
