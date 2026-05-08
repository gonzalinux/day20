import pino from "pino";
import roll from "pino-roll";
import { mkdirSync } from "fs";

const LOG_FILE = Bun.env.JSON_LOG_PATH ?? "";

let _logger: pino.Logger | null = null;

export async function initFileLogger(): Promise<void> {
  if (!LOG_FILE) return;
  const dir = LOG_FILE.lastIndexOf("/") > 0 ? LOG_FILE.substring(0, LOG_FILE.lastIndexOf("/")) : "";
  if (dir) mkdirSync(dir, { recursive: true });
  const dest = await roll({ file: LOG_FILE, size: "50m", limit: { count: 5 } });
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

export const getFileLogger = (): pino.Logger | null => _logger;
