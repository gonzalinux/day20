import { Elysia } from "elysia";
import { routes } from "./routes";

new Elysia().use(routes).listen(3000);
