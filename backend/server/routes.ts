import { Elysia } from "elysia";
import { ObjectId } from "mongodb";
import * as Service from "../domain/service";
import type { User } from "../repository/user";
import { NotFoundError } from "./errors.types";
import {
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomIdParam,
  CreateUsersRequest,
  DeleteUsersRequest,
  LoginRoomRequest,
  SelectUserRequest,
} from "./requests.types";
import { jwtAuth } from "./auth.ts";

export const routes = new Elysia()
  .use(jwtAuth)
  .post(
    "/rooms",
    async ({ body, status }) => {
      const roomId = await Service.createRoom(body);
      return status(201, { _id: roomId });
    },
    { body: CreateRoomRequest },
  )
  .post(
    "/rooms/:id/login",
    async ({ params, body, jwt, cookie: { session } }) => {
      const roomId = new ObjectId(params.id);
      const result = await Service.loginRoom(roomId, body.password);

      const token = await jwt.sign({ roomId: params.id });
      session.set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return result;
    },
    { params: RoomIdParam, body: LoginRoomRequest },
  )
  .post(
    "/rooms/:id/select-user",
    async ({ params, body, jwt, cookie: { session }, auth }) => {
      const roomId = new ObjectId(params.id);
      const userId = new ObjectId(body.userId);

      const users = await Service.getUsersFromRoom(roomId);
      const user = users.find((u) => u._id.equals(userId));
      if (!user) throw new NotFoundError("User not found in this room");

      const token = await jwt.sign({
        roomId: auth!.roomId,
        userId: body.userId,
      });
      session.set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return { userId: body.userId, name: user.name };
    },
    { params: RoomIdParam, body: SelectUserRequest },
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
    async ({ params, body, status }) => {
      const roomId = new ObjectId(params.id);
      const insertedIds = await Service.addUsersToRoom(
        roomId,
        body.users as unknown as User[],
      );
      return status(201, { insertedIds });
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
