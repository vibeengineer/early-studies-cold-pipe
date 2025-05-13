import { Hono } from "hono";
import z from "zod";
import "zod-openapi/extend";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";
import { createAuthMiddleware } from "./middleware";
import { queueContactsRoute, webScreenshotRoute } from "./routes";
import { ContactQueueFormSchema } from "./schemas";
import type { ApolloContact } from "./services/apollo/schema";
import type { WebsiteScreenshotJob } from "./services/screenshot";
import { captureWebsiteScreenshot } from "./services/screenshot";
import { createErrorResponse, parseContactsFromCsv } from "./utils";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.json({
    success: true,
    data: "Hello World",
  });
});

app.post(
  "/contact/queue",
  createAuthMiddleware(),
  describeRoute(queueContactsRoute),
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

app.get(
  "/screenshot",
  describeRoute(webScreenshotRoute),
  zValidator(
    "query",
    z.object({
      url: z.string(),
    })
  ),
  async (c) => {
    try {
      const { url } = c.req.valid("query");
      const screenshot = await captureWebsiteScreenshot(url);
      return new Response(screenshot, {
        headers: { "content-type": "image/png" },
      });
    } catch (err) {
      return c.json(
        { success: false, error: err instanceof Error ? err.message : String(err) },
        500
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
            // await websiteScreenshotService.processScreenshotJob(message.body, env);
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
