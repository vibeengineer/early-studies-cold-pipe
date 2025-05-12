import { type Context, Hono } from "hono";
import z from "zod";
import "zod-openapi/extend";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { Next } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApolloContact } from "./services/apollo/schema";
import websiteScreenshotService, { type WebsiteScreenshotJob } from "./services/webscreenshot";
import { parseContactsFromCsv } from "./utils";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

function createErrorResponse(c: Context, status: ContentfulStatusCode, message?: string) {
  return c.json(
    {
      success: false,
      data: null,
      error: message,
    },
    status
  );
}

export function validateToken(
  userToken: string | undefined | null,
  expectedToken: string
): {
  missing: boolean;
  valid: boolean;
} {
  if (!userToken) {
    return { missing: true, valid: false };
  }

  if (userToken !== expectedToken) {
    return { missing: false, valid: false };
  }

  return { missing: false, valid: true };
}

export function createAuthMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const { missing, valid } = validateToken(
      c.req.header("Authorization"),
      `Bearer ${c.env.BEARER_TOKEN}`
    );

    if (missing || !valid) {
      const status = missing ? 401 : 403;
      const code = missing ? "AUTH_MISSING_TOKEN" : "AUTH_INVALID_TOKEN";
      const message = missing ? "Authorization token is missing" : "Authorization token is invalid";

      return c.json(
        {
          data: null,
          success: false,
          error: { message: message, code: code },
        },
        status
      );
    }

    await next();
  };
}

// Define the schema for the multipart/form-data request
const ContactQueueFormSchema = z.object({
  smartleadCampaignId: z.coerce.number().openapi({
    description: "The id of the campaign to associate the contacts with.",
    example: 123,
  }),
  contactsFile: z
    .custom<File>((val) => val instanceof File, "Input must be a CSV file")
    .refine((file) => file.type === "text/csv", {
      message: "File must be a CSV.",
    })
    .refine((file) => file.size > 0, {
      message: "CSV file cannot be empty.",
    })
    .openapi({
      type: "string", // Important for OpenAPI spec generation for files
      format: "binary",
      description:
        "CSV file containing contacts. Headers must match Apollo contact fields (e.g., 'First Name', 'Email', 'Person Linkedin Url').",
    }),
});

app.post(
  "/contact/queue",
  createAuthMiddleware(),
  describeRoute({
    description: "Queue contacts from a CSV file for email pipe processing.",
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: ContactQueueFormSchema,
        },
      },
    },
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
  }),
  zValidator("form", ContactQueueFormSchema),
  async (c) => {
    const { contactsFile, smartleadCampaignId } = c.req.valid("form");

    try {
      const csvString = await contactsFile.text();
      const { validContacts, totalProcessedRows, validationErrors } =
        await parseContactsFromCsv(csvString);

      const validRowsFound = validContacts.length;
      const invalidRowsSkipped = validationErrors.length;

      if (validRowsFound === 0) {
        const errorMsg =
          totalProcessedRows > 0
            ? `No valid contacts found out of ${totalProcessedRows} processed rows. ${invalidRowsSkipped} rows failed validation (check server logs).`
            : "CSV file is empty or contains no processable data rows.";
        return createErrorResponse(c, 400, errorMsg);
      }

      const BATCH_SIZE = 30; // Reduced batch size to avoid 256KB payload limit
      let successfullyQueuedCount = 0;
      let failedToQueueCount = 0;

      for (let i = 0; i < validRowsFound; i += BATCH_SIZE) {
        const batchNumber = i / BATCH_SIZE; // 0 for first batch, 1 for second, etc.
        const calculatedDelaySeconds = batchNumber * 10;

        const batchContacts = validContacts.slice(i, i + BATCH_SIZE);
        const messages = batchContacts.map((contact) => ({
          body: { contact, smartleadCampaignId, contactEmail: contact.Email },
        }));

        try {
          console.log(
            `Queueing batch ${batchNumber + 1} (index ${i}) with delay ${calculatedDelaySeconds}s`
          );
          await c.env.QUEUE.sendBatch(messages, { delaySeconds: calculatedDelaySeconds });
          successfullyQueuedCount += messages.length;
        } catch (batchError) {
          console.error(
            `Failed to send batch starting at index ${i}: ${batchError instanceof Error ? batchError.message : String(batchError)}`
          );
          failedToQueueCount += messages.length;
        }
      }

      // Construct the detailed success message
      let message = `Processed ${totalProcessedRows} CSV rows. Queued ${successfullyQueuedCount} valid contacts`;
      if (invalidRowsSkipped > 0) message += `, skipped ${invalidRowsSkipped} invalid rows`;
      if (failedToQueueCount > 0)
        message += `, failed to queue ${failedToQueueCount} valid contacts`;
      message += ".";

      return c.json({
        success: true as const,
        data: {
          message: message,
          totalRowsInCsv: totalProcessedRows,
          validRowsFound: validRowsFound,
          invalidRowsSkipped: invalidRowsSkipped,
          successfullyQueuedCount: successfullyQueuedCount,
          failedToQueueCount: failedToQueueCount,
        },
        error: null,
      });
    } catch (error: unknown) {
      return c.json(
        {
          success: false as const,
          data: null,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        },
        500
      );
    }
  }
);

app.post("/webscreenshot/test", async (c) => {
  try {
    const { url, templateImageKey, outputKey } = await c.req.json();
    if (!url || !templateImageKey || !outputKey) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    const jobId = crypto.randomUUID();
    const job = {
      url,
      templateImageKey,
      outputKey,
      jobId,
      status: "queued",
    };
    await c.env.WEBSCREENSHOT_QUEUE.send(job);
    return c.json({ success: true, jobId, status: "queued" });
  } catch (err) {
    return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Hono",
        version: "1.0.0",
        description: "API for greeting users",
      },
      servers: [
        {
          url: "http://localhost:8787",
          description: "Local server",
        },
        {
          url: "https://early-studies-cold-pipe.early-studies.workers.dev",
          description: "Production server",
        },
      ],
    },
  })
);

app.get(
  "/docs",
  Scalar({
    theme: "saturn",
    url: "/openapi",
  })
);

export default {
  port: 8787,
  fetch: app.fetch,
  async queue(
    batch: MessageBatch<
      { contact: ApolloContact; contactEmail: string; campaignName: string } | WebsiteScreenshotJob
    >,
    env: Env
  ): Promise<void> {
    for (const message of batch.messages) {
      try {
        if (message.body && typeof message.body === "object") {
          if ("contact" in message.body && "contactEmail" in message.body) {
            await env.EMAIL_PIPE_WORKFLOW.create({ params: message.body });
            message.ack();
            continue;
          }
          if (
            "url" in message.body &&
            "templateImageKey" in message.body &&
            "outputKey" in message.body
          ) {
            await websiteScreenshotService.processScreenshotJob(message.body, env);
            message.ack();
            continue;
          }
        }
        console.error("Unknown queue message type:", message.body);
        message.ack();
      } catch (err) {
        try {
          message.retry({ delaySeconds: 60 });
        } catch (retryErr) {
          console.error(
            `Failed to retry queue message: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`
          );
          message.ack();
        }
      }
    }
  },
};
export * from "./workflows/email-pipe";
