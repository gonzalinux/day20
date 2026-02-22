import { Elysia } from "elysia";
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
  name: "http_request_duration_milliseconds",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "path", "status"],
  buckets: [3, 30, 100, 300, 1500, 10000],
  registers: [register],
});

function normalizePath(path: string) {
  return path.replace(/\/\d+([\/?]|$)/g, "/:id$1");
}

interface LabelData {
  route?: string;
  path?: string;
  method?: string;
  status?: string;
}

function getLabels(data: LabelData) {
  const path = normalizePath(data.route || data.path || "");
  return { method: data.method, path, status: data.status };
}

export const prometheus = new Elysia({ name: "prometheus" })
  .derive({ as: "global" }, () => ({ startTime: Date.now() }))
  .onAfterResponse({ as: "global" }, ({ set, path, route, request, startTime }) => {
    const labels = getLabels({ route, path, method: request.method, status: set.status + "" });
    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, Date.now() - startTime);
  })
  .onError({ as: "global" }, ({ startTime, path, route, request, set }) => {
    if (!startTime) return;
    const labels = getLabels({ route, path, method: request.method, status: set.status + "" });
    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, Date.now() - startTime);
  });
