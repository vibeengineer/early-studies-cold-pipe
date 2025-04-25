import { describe, expect, it } from "vitest";
import { getNeverbounceAccountInfo, verifyEmail } from "../src/services/neverbounce/index";

describe("verifyEmail", () => {
  it("should verify an email", async () => {
    const response = await verifyEmail("sam@duckstud.io");
    expect(response).toBeDefined();
  });
});

describe("getNeverbounceAccountInfo", () => {
  it("should get the account info", async () => {
    const response = await getNeverbounceAccountInfo();
    expect(response).toBeDefined();
  });
});
