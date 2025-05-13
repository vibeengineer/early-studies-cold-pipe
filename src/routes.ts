import z from "zod";
import "zod-openapi/extend";
import { resolver } from "hono-openapi/zod";

export const queueContactsRoute = {
  description: "Queue contacts from a CSV file for email pipe processing.",
  responses: {
    200: {
      description: "Successful queueing of contacts from CSV.",
      content: {
        "application/json": {
          schema: resolver(
            z.object({
              success: z.literal(true),
              data: z.object({
                message: z.string(),
                totalRowsInCsv: z.number().openapi({
                  description:
                    "Total data rows found in the CSV file (excluding header/empty lines).",
                }),
                validRowsFound: z
                  .number()
                  .openapi({ description: "Number of rows that passed validation." }),
                invalidRowsSkipped: z.number().openapi({
                  description: "Number of rows that failed validation and were skipped.",
                }),
                successfullyQueuedCount: z.number().openapi({
                  description: "Number of valid contacts successfully sent to the queue.",
                }),
                failedToQueueCount: z.number().openapi({
                  description: "Number of valid contacts that failed to be sent to the queue.",
                }),
              }),
              error: z.null(),
            })
          ),
        },
      },
    },
    400: {
      description:
        "Bad Request (e.g., invalid form data, invalid CSV file, CSV parsing/validation error)", // Updated description
      content: {
        "application/json": {
          schema: resolver(
            z.object({
              success: z.boolean(),
              data: z.null(),
              error: z.string(),
            })
          ),
        },
      },
    },
    500: {
      description: "Internal Server Error (e.g., queueing failed)",
      content: {
        "application/json": {
          schema: resolver(
            z.object({
              success: z.boolean(),
              data: z.null(),
              error: z.string(),
            })
          ),
        },
      },
    },
  },
  tags: ["Email Pipe"],
};

export const webScreenshotRoute = {
  description: "Queue a website screenshot job.",
  responses: {
    200: {
      description: "Job successfully queued.",
      content: {
        "application/json": {
          schema: resolver(
            z
              .object({
                success: z.literal(true),
                data: z.object({
                  jobId: z.string(),
                  status: z.literal("queued"),
                }),
                error: z.null(),
              })
              .openapi({ ref: "WebScreenshotTestResponse" })
          ),
        },
      },
    },
    400: {
      description: "Validation error.",
      content: {
        "application/json": {
          schema: resolver(
            z
              .object({
                success: z.literal(false),
                data: z.null(),
                error: z.any(),
              })
              .openapi({ ref: "WebScreenshotTestError" })
          ),
        },
      },
    },
    500: {
      description: "Internal server error.",
      content: {
        "application/json": {
          schema: resolver(
            z
              .object({
                success: z.literal(false),
                data: z.null(),
                error: z.string(),
              })
              .openapi({ ref: "WebScreenshotTestInternalError" })
          ),
        },
      },
    },
  },
  tags: ["WebScreenshot"],
};
