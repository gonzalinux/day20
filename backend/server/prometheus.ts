import { Elysia, type Context } from "elysia";
import {
  collectDefaultMetrics,
  Registry,
  Counter,
  Histogram,
} from "prom-client";

export const register = new Registry();
collectDefaultMetrics({ register });

const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests count",
  labelNames: ["method", "path", "status"],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path", "status"],
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
  registers: [register],
});

function normalizePath(path: string) {
  return path.replace(/\/\d+([\/?]|$)/g, "/:id$1");
}

function getLabels(ctx: Context) {
  const path = normalizePath((ctx.route as string) || ctx.path);
  const status =
    typeof ctx.response === "object" &&
    ctx.response !== null &&
    "code" in ctx.response &&
    typeof ctx.response.code === "number"
      ? ctx.response.code.toString()
      : (ctx.set.status?.toString() ?? "500");
  return { method: ctx.request.method, path, status };
}

export const prometheus = new Elysia({ name: "prometheus" })
  .derive({ as: "global" }, (ctx) => ({
    endTimer: httpRequestDuration.startTimer(getLabels(ctx)),
  }))
  .onAfterResponse({ as: "global" }, (ctx) => {
    httpRequestCounter.inc(getLabels(ctx));
    ctx.endTimer(getLabels(ctx));
  })
  .onError({ as: "global" }, (ctx) => {
    if (!ctx.endTimer) return;
    // @ts-ignore
    httpRequestCounter.inc(getLabels(ctx));
    // @ts-ignore
    ctx.endTimer(getLabels(ctx));
  });
