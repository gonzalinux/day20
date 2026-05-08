import pino from "pino";
import roll from "pino-roll";
import { mkdirSync } from "fs";
import { requestContext } from "./request-context";

const LOG_FILE = Bun.env.JSON_LOG_PATH ?? "";

let _logger: pino.Logger | null = null;

export async function initFileLogger(): Promise<void> {
  if (!LOG_FILE) return;
  const dir = LOG_FILE.lastIndexOf("/") > 0 ? LOG_FILE.substring(0, LOG_FILE.lastIndexOf("/")) : "";
  if (dir) mkdirSync(dir, { recursive: true });
  const dest = await roll({ file: LOG_FILE, size: "50m", limit: { count: 5 }, minLength: 0 });
  _logger = pino(
    {
      level: "info",
      timestamp: pino.stdTimeFunctions.isoTime,
      base: null,
      formatters: { level: (label) => ({ level: label }) },
    },
    dest,
  );
}

type LogArgs = [msg: string] | [fields: Record<string, unknown>, msg: string];

function toArgs(args: LogArgs): { fields: Record<string, unknown>; msg: string } {
  return args.length === 1
    ? { fields: {}, msg: args[0] }
    : { fields: args[0], msg: args[1] };
}

function withContext(fields: Record<string, unknown>): Record<string, unknown> {
  const reqId = requestContext.getStore()?.reqId;
  return reqId ? { reqId, ...fields } : fields;
}

export const log = {
  info(...args: LogArgs) {
    const { fields, msg } = toArgs(args);
    console.log(msg);
    _logger?.info(withContext(fields), msg);
  },
  error(...args: LogArgs) {
    const { fields, msg } = toArgs(args);
    console.error(msg);
    _logger?.error(withContext(fields), msg);
  },
};
