import { Elysia } from "elysia";
import { ObjectId } from "mongodb";
import * as Service from "../domain/service";
import type { Room } from "../repository/room";
import type { User } from "../repository/user";
import {
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomIdParam,
  CreateUsersRequest,
  DeleteUsersRequest,
  LoginRoomRequest,
} from "./requests.types";

export const routes = new Elysia()
  .post(
    "/rooms",
    async ({ body, set }) => {
      const roomId = await Service.createRoom(body as unknown as Room);
      set.status = 201;
      return { _id: roomId };
    },
    { body: CreateRoomRequest },
  )
  .post(
    "/room/login",
    async ({ body }) => {
      const roomId = new ObjectId(body.roomId);
      return await Service.loginRoom(roomId, body.password);
    },
    { body: LoginRoomRequest },
  )
  .get(
    "/rooms/:id",
    async ({ params }) => {
      const roomId = new ObjectId(params.id);
      return await Service.getRoom(roomId);
    },
    { params: RoomIdParam },
  )
  .put(
    "/rooms/:id",
    async ({ params, body }) => {
      const { _id, ...updateFields } = body;
      const updates = {
        ...updateFields,
        _id: new ObjectId(params.id),
      };
      const modified = await Service.updateRoom(updates as any);
      return { modified };
    },
    { params: RoomIdParam, body: UpdateRoomRequest },
  )
  .post(
    "/rooms/:id/users",
    async ({ params, body, set }) => {
      const roomId = new ObjectId(params.id);
      const insertedIds = await Service.addUsersToRoom(
        roomId,
        body.users as unknown as User[],
      );
      set.status = 201;
      return { insertedIds };
    },
    { params: RoomIdParam, body: CreateUsersRequest },
  )
  .delete(
    "/rooms/:id/users",
    async ({ params, body }) => {
      const roomId = new ObjectId(params.id);
      const userIds = body.userIds.map((id) => new ObjectId(id));
      const deletedCount = await Service.removeUsersFromRoom(roomId, userIds);
      return { deletedCount };
    },
    { params: RoomIdParam, body: DeleteUsersRequest },
  );
