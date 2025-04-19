import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createCampaign } from "../../src/services/database/index";
import { MOCK_CAMPAIGN_NAME } from "../mocks/campaign";

describe("Campaign DB Operations", () => {
  describe("createCampaign", () => {
    it("should create a new campaign", async () => {
      const result = await createCampaign(MOCK_CAMPAIGN_NAME);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(MOCK_CAMPAIGN_NAME);
      expect(result.data.id).toBeTypeOf("string");
    });
  });
});
