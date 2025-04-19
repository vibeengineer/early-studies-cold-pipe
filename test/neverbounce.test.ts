import { describe, expect, it } from "vitest";
import { verifyEmail } from "../src/services/neverbounce/index";

describe("verifyEmail", () => {
  it("should verify an email", async () => {
    const response = await verifyEmail("sam@duckstud.io");
    expect(response).toBeDefined();
  });
});
