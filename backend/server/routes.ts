import { Elysia } from "elysia";
import * as Service from "../domain/service";
import {
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomIdParam,
  RoomUserIdParam,
  CreateUserRequest,
  DeleteUsersRequest,
  LoginRoomRequest,
  SelectUserRequest,
  SetPinRequest,
} from "./requests.types";
import { jwtAuth, protectedRoutes } from "./auth.ts";

export const routes = new Elysia()
  .use(jwtAuth)
  .post(
    "/rooms",
    async ({ body, status }) => {
      const { _id, magicToken } = await Service.createRoom(body);
      return status(201, { _id, magicToken });
    },
    { body: CreateRoomRequest },
  )
  .post(
    "/rooms/login",
    async ({ body, jwt, cookie: { session } }) => {
      const roomId = body.id;
      const result = await Service.loginRoom(roomId, {
        password: body.password,
        token: body.token,
      });

      let roomMap : Record<string, string> = {}
      if (session !== undefined) {
        const payload = await jwt.verify(session.value)
        if (payload)
        roomMap = {...payload.rooms}
      }
      roomMap[roomId] = ""

      const token = await jwt.sign({rooms: roomMap});
      console.log(token)
      session.set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return result;
    },
    {body: LoginRoomRequest },
)
  .get(
    "/rooms/:room_id/exists",
    async ({ params }) => {
      const exists = await Service.roomExists(params.room_id);
      return { exists };
    },
    { params: RoomIdParam },
  )
  .use(protectedRoutes)
  .get(
    "/rooms/:room_id/me",
    async ({ params, auth }) => {
      return { roomId: params.room_id, userId: auth.rooms[params.room_id] };
    },
    { params: RoomIdParam },
  )
  .get(
    "/rooms/:room_id/users",
    async ({ params }) => {
      const roomId = params.room_id;
      const users = await Service.getUsersFromRoom(roomId);
      return users;
    },
    { params: RoomIdParam },
  )
  .post(
    "/rooms/:room_id/select-user",
    async ({ params, body, jwt, cookie: { session }, auth }) => {
      const roomId = params.room_id;
      const userId = body.userId;

      const user = await Service.selectUser(roomId, userId, body.pin);

      const rooms = { ...auth.rooms };
      rooms[roomId] = userId;

      const token = await jwt.sign({ rooms });
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
    "/rooms/:room_id",
    async ({ params }) => {
      const roomId = params.room_id;
      return await Service.getRoom(roomId);
    },
    { params: RoomIdParam },
  )
  .patch(
    "/rooms/:room_id",
    async ({ params, body }) => {
      const { _id, ...updateFields } = body;
      const updates = {
        ...updateFields,
        _id: params.room_id,
      };
      const modified = await Service.updateRoom(updates);
      return { modified };
    },
    { params: RoomIdParam, body: UpdateRoomRequest },
  )
  .post(
    "/rooms/:room_id/users",
    async ({ params, body, status }) => {
      const roomId = params.room_id;
      const user = await Service.addUserToRoom(roomId, { ...body, roomId });
      return status(201, user);
    },
    { params: RoomIdParam, body: CreateUserRequest },
  )
  .delete(
    "/rooms/:room_id/users",
    async ({ params, body }) => {
      const roomId = params.room_id;
      const userIds = body.userIds;
      const deletedCount = await Service.removeUsersFromRoom(roomId, userIds);
      return { deletedCount };
    },
    { params: RoomIdParam, body: DeleteUsersRequest },
  )
  .put(
    "/rooms/:room_id/users/:user_id/pin",
    async ({ params, body, auth }) => {
      const roomId = params.room_id;
      const authUserId = auth.rooms[roomId];
      if (!authUserId) {
        throw new Error("User not selected");
      }
      await Service.setUserPin(roomId, authUserId, params.user_id, body.pin);
      return { ok: true };
    },
    { params: RoomUserIdParam, body: SetPinRequest },
  )
  .delete(
    "/rooms/:room_id/users/:user_id/pin",
    async ({ params, auth }) => {
      const roomId = params.room_id;
      const authUserId = auth.rooms[roomId];
      if (!authUserId) {
        throw new Error("User not selected");
      }
      await Service.removeUserPin(roomId, authUserId, params.user_id);
      return { ok: true };
    },
    { params: RoomUserIdParam },
  );
