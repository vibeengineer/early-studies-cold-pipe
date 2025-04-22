import { type Context, Hono } from "hono";
import z from "zod";
import "zod-openapi/extend";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { Next } from "hono/types";
import { ApolloContactSchema } from "./services/apollo/schema";
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

app.post(
  "/contact/queue",
  createAuthMiddleware(),
  describeRoute({
    description: "Queue a contact for email pipe processing",
    requestBody: {
      content: {
        "application/json": {
          schema: ApolloContactSchema,
        },
      },
    },
    responses: {
      200: {
        description: "Successful queueing of contact",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                success: z.boolean(),
                data: z.object({
                  message: z.string(),
                }),
                error: z.null(),
              })
            ),
          },
        },
      },
      400: {
        description: "Bad Request",
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
        description: "Internal Server Error",
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
  zValidator("json", z.object({ contact: ApolloContactSchema, campaignId: z.string() })),
  async (c) => {
    const { contact, campaignId } = c.req.valid("json");

    try {
      await c.env.QUEUE.send(JSON.stringify({ contact, campaignId }));

      return c.json({
        success: true as const,
        data: {
          message: "Contact queued for email pipe processing",
        },
        error: null,
      });
    } catch (error) {
      return c.json(
        {
          success: false as const,
          data: null,
          error: "Failed to queue contact",
        },
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
          url: "http://localhost:3000",
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

export default app;
