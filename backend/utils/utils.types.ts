import type { ObjectId } from "mongodb";

export type PartialWithId<T> = Partial<T> & { _id: ObjectId };

export type WithoutId<T> = Omit<T, "_id">;
