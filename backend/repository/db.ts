import { MongoClient, Db } from "mongodb";
import { log } from "../server/file-logger";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "day20";

const client = new MongoClient(MONGO_URI);

let db: Db | undefined;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;
  try {
    log.info("Connecting to database...");
    await client.connect();
    log.info("Connected to database");
    db = client.db(DB_NAME);
    await db.collection("users").createIndex({ roomId: 1 });
    await db.collection("rooms").createIndex({ updatedAt: 1 });
    await db.collection("feedback").createIndex({ createdAt: -1 });
    return db;
  } catch (error) {
    log.error({ error: String(error) }, "Failed to connect to database");
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (client) await client.close();
}

export function DB(): Db {
  if (!db) throw new Error("Database not connected");
  return db;
}

export { client };
