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

interface LabelData {
  route?: string;
  path?: string;
  method?: string;
  status?: string;
}

function getLabels(data: LabelData) {
  const path = normalizePath(data.route || data.path || "");
  return { method: data.method, path, status:data.status };
}

export const prometheus = new Elysia({ name: "prometheus" })
  .derive({ as: "global" }, () => ({
    endTimer: httpRequestDuration.startTimer(),
  }))
  .onAfterResponse({ as: "global" }, ({ set, path, route, request, endTimer }) => {
    const labels = getLabels({route, path, method:request.method, status: set.status+"" })
    httpRequestCounter.inc(labels);
    endTimer(labels);
  })
  .onError({ as: "global" }, ({endTimer, path, route, request, set}) => {
    if (!endTimer) return;
    const labels = getLabels({route, path, method:request.method, status: set.status+"" })
    httpRequestCounter.inc(labels);
   endTimer(labels);
  });
