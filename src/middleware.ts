import type { Context, Next } from "hono";

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
