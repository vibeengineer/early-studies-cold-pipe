import { type Context, Hono } from "hono";
import z from "zod";
import "zod-openapi/extend";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { Next } from "hono/types";
import type { ApolloContact } from "./services/apollo/schema";
import { parseContactsFromCsv } from "./utils";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

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
  campaignId: z.string().openapi({
    description: "The id of the campaign to associate the contacts with.",
    example: "campaign_123",
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
          // Changed content type
          schema: ContactQueueFormSchema, // Use the form schema
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
                success: z.boolean(),
                data: z.object({
                  message: z.string(),
                  queuedCount: z.number(),
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
                error: z.string(), // Keep error as string for simplicity
              })
            ),
          },
        },
      },
      // Keep 401/403 from middleware implicitly
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
  zValidator("form", ContactQueueFormSchema), // Changed to "form" validator
  async (c) => {
    const { contactsFile, campaignId } = c.req.valid("form");

    try {
      const csvString = await contactsFile.text();
      const contacts = await parseContactsFromCsv(csvString);

      if (contacts.length === 0) {
        return c.json(
          {
            success: false as const,
            data: null,
            error:
              "No valid contacts could be parsed from the uploaded CSV file. Check format and content.",
          },
          400
        );
      }

      const BATCH_SIZE = 100; // Process 100 contacts per batch
      const INTER_BATCH_DELAY_MS = 500; // 0.5 second delay between batches

      let successfullyQueuedCount = 0;
      let failedToQueueCount = 0;
      const totalContacts = contacts.length;

      console.log(`Starting to queue ${totalContacts} contacts in batches of ${BATCH_SIZE}...`);

      for (let i = 0; i < totalContacts; i += BATCH_SIZE) {
        const batchContacts = contacts.slice(i, i + BATCH_SIZE);
        const messages = batchContacts.map((contact) => ({
          // NOTE: Message body size limits apply (default 128 KB)
          // Pass the raw object; Cloudflare handles serialization for JSON content type
          body: { contact, campaignId, contactEmail: contact.Email },
          // We are delaying between batches, so individual message delays might not be needed
          // delaySeconds: Optional delay per message within the batch if needed
        }));

        try {
          console.log(
            `Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${messages.length} messages)...`
          );
          await c.env.QUEUE.sendBatch(messages);
          successfullyQueuedCount += messages.length;
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} sent successfully.`);
        } catch (batchError) {
          console.error(
            `Failed to send batch starting at index ${i} for campaign ${campaignId}:`,
            batchError
          );
          failedToQueueCount += messages.length; // Assume whole batch failed if sendBatch throws
        }

        // Add delay before the next batch, but not after the last one
        if (i + BATCH_SIZE < totalContacts) {
          console.log(`Waiting ${INTER_BATCH_DELAY_MS}ms before next batch...`);
          await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
        }
      }

      console.log(
        `Finished queueing for campaign ${campaignId}. Success: ${successfullyQueuedCount}, Failed: ${failedToQueueCount}`
      );

      if (failedToQueueCount > 0) {
        // If some contacts failed, return a response indicating partial or total failure
        const isTotalFailure = successfullyQueuedCount === 0;
        return c.json(
          {
            success: !isTotalFailure, // False only if absolutely nothing was queued
            data: {
              message: `Attempted to queue ${totalContacts} contacts. Successfully queued: ${successfullyQueuedCount}. Failed: ${failedToQueueCount}.`,
              queuedCount: successfullyQueuedCount,
            },
            error: isTotalFailure
              ? "Failed to queue any contacts."
              : "Some contacts could not be queued.",
          },
          isTotalFailure ? 500 : 207
        ); // 500 for total failure, 207 Multi-Status for partial success
      }

      // If all contacts were queued successfully
      return c.json({
        success: true as const,
        data: {
          message: `Successfully queued all ${successfullyQueuedCount} contacts for email pipe processing.`,
          queuedCount: successfullyQueuedCount,
        },
        error: null,
      });
    } catch (error: unknown) {
      console.error(`Error processing contact queue request for campaign ${campaignId}:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      // Distinguish between parsing/validation errors (Bad Request) and other errors (Internal Server Error)
      const isBadRequest =
        errorMessage.includes("CSV validation failed") ||
        errorMessage.includes("Failed to parse CSV") ||
        errorMessage.includes("zero valid contacts") ||
        errorMessage.includes("File must be a CSV") || // Added from Zod refine
        errorMessage.includes("CSV file cannot be empty"); // Added from Zod refine
      const statusCode = isBadRequest ? 400 : 500;
      const defaultError =
        statusCode === 400
          ? "Failed to process CSV file due to format or content errors."
          : "Failed to queue contacts due to an internal error.";

      return c.json(
        {
          success: false as const,
          data: null,
          // Provide a more specific error message if available, otherwise a generic one
          error: errorMessage || defaultError,
        },
        statusCode
      );
    }
  }
);

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
    batch: MessageBatch<{
      contact: ApolloContact;
      contactEmail: string;
      campaignName: string;
    }>,
    env: Env
  ): Promise<void> {
    for (const message of batch.messages) {
      console.log(
        `Queue consumer received message for: ${message.body.contactEmail}, Campaign: ${message.body.campaignName}. Creating workflow...`
      );

      const params = message.body;

      try {
        const instance = await env.EMAIL_PIPE_WORKFLOW.create({ params });
        console.log(`Workflow instance ${instance.id} created for ${params.contactEmail}`);
        message.ack();
      } catch (creationErr: unknown) {
        const creationErrorMessage =
          creationErr instanceof Error ? creationErr.message : String(creationErr);
        console.error(
          `Failed to create workflow instance for ${params.contactEmail}:`,
          creationErrorMessage
        );
        try {
          message.retry({ delaySeconds: 60 });
          console.log(`Retrying message for ${params.contactEmail}`);
        } catch (retryErr: unknown) {
          const errorMessage = retryErr instanceof Error ? retryErr.message : String(retryErr);
          console.error(`Failed to retry message for ${params.contactEmail}:`, errorMessage);
          message.ack();
        }
      }
    }

    console.log(`Finished processing batch of ${batch.messages.length} messages.`);
  },
};
export * from "./workflows/email-pipe";
