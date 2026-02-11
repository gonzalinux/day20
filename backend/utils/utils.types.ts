import type { ObjectId } from "mongodb";

export type PartialWithId<T> = Partial<T> & { _id: string };

export type WithoutId<T> = Omit<T, "_id">;
