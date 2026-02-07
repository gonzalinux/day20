import type { Collection } from "mongodb";
import { DB } from "./db";
import type { Room } from "./room";
import type { User } from "./user";

function getRoomCollection(): Collection<Room> {
  return DB().collection("rooms");
}

function getUserCollection(): Collection<User> {
  return DB().collection("users");
}

export async function createRoom(room: Partial<Room>) {
  const collection = getRoomCollection();
  const result = await collection.insertOne(room);
  return result.insertedId;
}
