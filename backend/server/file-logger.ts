import pino from "pino";
import { roll } from "pino-roll";
import { mkdirSync } from "fs";

const LOG_FILE = Bun.env.JSON_LOG_PATH ?? "";

let fileLogger: pino.Logger | null = null;

if (LOG_FILE) {
  const dir = LOG_FILE.lastIndexOf("/") > 0 ? LOG_FILE.substring(0, LOG_FILE.lastIndexOf("/")) : "";
  if (dir) mkdirSync(dir, { recursive: true });

  const dest = await roll(LOG_FILE, {
    size: "50m",
    limit: { count: 5 },
  });

  fileLogger = pino(
    {
      level: "info",
      timestamp: pino.stdTimeFunctions.isoTime,
      base: null,
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
    dest,
  );
}

export { fileLogger };
