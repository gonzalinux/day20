import Elysia from "elysia";

export const logger = new Elysia({ name: "logger" }).onRequest(
  ({ request }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    console.log(`${method} ${path}`);
  },
).onAfterResponse(({ request, set, responseValue }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    console.log(`${method} ${path} ${set.status} ${JSON.stringify(responseValue)}`);
})
  .onError(({ request, error }) => {
    const { method, url } = request;
    const path = new URL(url).pathname;
    const message = (error as Error)?.message ?? "Unknown error";
    console.error(`${method} ${path} ${message}`);
})

  .as("global");
