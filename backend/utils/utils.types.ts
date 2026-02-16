export type PartialWithId<T> = Partial<T> & { id: string };

export type WithoutId<T> = Omit<T, "id">;
