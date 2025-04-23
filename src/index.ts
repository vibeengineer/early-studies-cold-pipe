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
    description: "The ID of the campaign to associate the contacts with.",
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
      // Read file content
      const csvString = await contactsFile.text();

      // Parse CSV
      const contacts = await parseContactsFromCsv(csvString); // Use the utility

      if (contacts.length === 0) {
        // This case is now typically handled by the parser rejecting, but kept as a fallback
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

      // Queue each contact
      // Consider batching if the queue supports it for better performance
      const queuePromises = contacts.map((contact) =>
        c.env.QUEUE.send(JSON.stringify({ contact, campaignId }))
      );

      // Wait for all queue operations (optional, depending on desired behavior)
      // Using Promise.allSettled to handle potential individual failures
      const results = await Promise.allSettled(queuePromises);

      const successfulQueues = results.filter((r) => r.status === "fulfilled").length;
      const failedQueues = results.length - successfulQueues;

      if (failedQueues > 0) {
        console.error(
          `Failed to queue ${failedQueues} out of ${results.length} contacts for campaign ${campaignId}.`
        );
        // Decide if this should be a partial success or full failure
        // Returning partial success here
        return c.json({
          success: true as const, // Still considered success as some were queued
          data: {
            message: `Successfully queued ${successfulQueues} contacts. Failed to queue ${failedQueues}.`,
            queuedCount: successfulQueues,
          },
          error: null, // Not returning a top-level error for partial success
        });
      }

      return c.json({
        success: true as const,
        data: {
          message: `Successfully queued all ${contacts.length} contacts for email pipe processing.`,
          queuedCount: contacts.length,
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
    batch: MessageBatch<
      {
        contact: ApolloContact;
        campaignId: string;
      }[]
    >,
    env: Env
  ) {
    for (const message of batch.messages) {
      console.log(message.body, "message body");
    }
  },
};
