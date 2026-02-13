import { treaty } from "@elysiajs/eden";
import type { App } from "../../../backend";

const baseUrl = import.meta.env.DEV ? "localhost:3000" : `${window.location.host}/api`;

export const api = treaty<App>(baseUrl, {
  fetch: { credentials: "include" },
});
