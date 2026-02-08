import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { UnauthorizedError } from "./errors.types";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET env var is required");

const PUBLIC_ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: "POST", pattern: /^\/rooms\/?$/ },
  { method: "POST", pattern: /^\/rooms\/[^/]+\/login\/?$/ },
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some((r) => r.method === method && r.pattern.test(path));
}
export const cookieSession = t.Cookie({
  session: t.Optional(t.String()),
});

export const jwtAuth = new Elysia({ name: "jwtAuth" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    }),
  )
  .guard({ cookie: cookieSession })
  .resolve(async ({ jwt, cookie: { session }, request }) => {
    if (isPublicRoute(request.method, new URL(request.url).pathname)) {
      return { auth: null as { roomId: string; userId?: string } | null };
    }

    const token = session?.value as string | undefined;
    if (!token) throw new UnauthorizedError("Missing session cookie");

    const payload = await jwt.verify(token);
    if (!payload) throw new UnauthorizedError("Invalid session");

    return {
      auth: {
        roomId: payload.roomId as string,
        userId: payload.userId as string | undefined,
      },
    };
  })
  .as("scoped");
