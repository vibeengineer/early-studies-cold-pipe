import { env } from "cloudflare:workers";
import pino from "pino";
import type { Logger } from "pino";

const getLoggerOptions = (): pino.LoggerOptions => {
  if (env.LOG_LEVEL) {
    return {
      level: env.LOG_LEVEL,
      browser: {
        asObject: true,
        formatters: {
          level(label) {
            return { level: label.toUpperCase() };
          },
        },
        write: (o) => console.log(JSON.stringify(o)),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      enabled: true,
    };
  }

  return {
    level: env.LOG_LEVEL,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard", // Use system time, format: yyyy-mm-dd HH:MM:ss.l o
        ignore: "pid,hostname", // Ignore these common fields for cleaner dev logs
        levelFirst: true, // Show level first
        singleLine: true, // Try to keep logs on a single line
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime, // Still include timestamp for processing
    enabled: true,
  };
};

function createLogger(): Logger {
  const logger = pino(getLoggerOptions());
  logger.info(`Logger initialized (level: ${env.LOG_LEVEL})`);
  return logger;
}

export const logger = createLogger();
