import { describe, expect, it } from "vitest";
import { verifyEmail } from "./index";

describe("verifyEmail", () => {
  it("should verify an email", async () => {
    const response = await verifyEmail("support@neverbounce.com");
    expect(response).toBeDefined();
  });
});
