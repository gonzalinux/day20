import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { UnauthorizedError } from "./errors.types";
import { RoomIdParam } from "./requests.types";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET env var is required");

export const cookieSession = t.Cookie({
  session: t.Optional(t.String()),
});

export const jwtAuth = new Elysia({ name: "jwtAuth" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      schema: t.Object({
        rooms: t.Record(t.String(), t.String()),
        exp: t.Optional(t.Number()),
      }),
      exp: "30d",
    }),
  )
  .guard({ cookie: cookieSession })
  .as("global");

export const protectedRoutes = new Elysia({ name: "protectedRoutes" })
  .use(jwtAuth)
  .guard({ params: RoomIdParam })
  .resolve( async ({ jwt, cookie: { session }, params }) => {
    const token = session?.value
    if (!token) throw new UnauthorizedError("Missing session cookie");

    const payload = await jwt.verify(token);
    if (!payload) throw new UnauthorizedError("Invalid session");

    if (!(params.room_id in payload.rooms))
      throw new UnauthorizedError("Not authorized for this room");

    return {
      auth: {
        rooms: payload.rooms
      },
    };
  }).as("scoped");
