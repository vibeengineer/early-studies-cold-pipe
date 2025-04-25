import { env } from "cloudflare:workers"; // Ensure env is available in test context
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { GenerateEmail } from "../src/services/ai/types";
import type { ApolloContact } from "../src/services/apollo/schema";
import { getCampaignById } from "../src/services/database";
import type { LinkedinProfile } from "../src/services/proxycurl/schemas";
import {
  createCampaign,
  deleteCampaign,
  updateCampaign,
  uploadLeadsToSmartlead,
} from "../src/services/smartlead";
import { MOCK_EMAIL } from "../test/mocks/email";
import { MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE } from "../test/mocks/person";

type TestLead = ApolloContact &
  LinkedinProfile & {
    email1: GenerateEmail;
    email2: GenerateEmail;
    email3: GenerateEmail;
    email4: GenerateEmail;
    email5: GenerateEmail;
    email6: GenerateEmail;
  };

interface CreateCampaignResponseData {
  id: string;
  name: string;
}

interface CreateCampaignResponse {
  success: boolean;
  data: CreateCampaignResponseData;
}

interface UploadLeadsResponse {
  status: string; // e.g., "success"
  total_leads_processed: number;
  leads_failed_count: number;
}

const TIMEOUT = 30000;

describe("Smartlead Service Integration Tests", () => {
  let testCampaignId: number | null = null;

  beforeAll(() => {
    if (!env.SMARTLEAD_API_KEY) {
      throw new Error(
        "SMARTLEAD_API_KEY environment variable not set. Skipping integration tests."
      );
    }
  });

  it(
    "should successfully create a new campaign",
    async () => {
      try {
        const response = await createCampaign();

        expect(response).toBeDefined();
        expect(response.ok).toBe(true);
        expect(response.id).toBeDefined();
        expect(typeof response.id).toBe("number"); // Check type

        testCampaignId = response.id;
      } catch (error) {
        console.error("Error creating campaign:", error);
        throw error;
      }
    },
    TIMEOUT
  );

  it("should find an existing campaign", async () => {
    const response = await getCampaignById(1828645);
    console.log(response);
    expect(response.success).toBe(true);
  });

  it("should successfully update the campaign", async () => {
    if (!testCampaignId) {
      console.warn(
        "Skipping campaign update test because campaign creation failed or was skipped."
      );
      expect.fail("Campaign ID not available for campaign update test.");
    }

    const updatedCampaignName = `Updated Campaign ${Date.now()}`;
    const response = await updateCampaign(testCampaignId, updatedCampaignName);
    expect(response.ok).toBe(true);
  });

  it(
    "should successfully upload leads to the created campaign",
    async () => {
      if (!testCampaignId) {
        console.warn("Skipping lead upload test because campaign creation failed or was skipped.");
        expect.fail("Campaign ID not available for lead upload test.");
      }

      const sampleLead: TestLead = {
        ...MOCK_APOLLO_CONTACT,
        ...MOCK_ENRICHMENT_PERSON_PROFILE,
        email1: { subject: `${MOCK_EMAIL.subject} 1`, message: `${MOCK_EMAIL.message} Body 1` },
        email2: { subject: `${MOCK_EMAIL.subject} 2`, message: `${MOCK_EMAIL.message} Body 2` },
        email3: { subject: `${MOCK_EMAIL.subject} 3`, message: `${MOCK_EMAIL.message} Body 3` },
        email4: { subject: `${MOCK_EMAIL.subject} 4`, message: `${MOCK_EMAIL.message} Body 4` },
        email5: { subject: `${MOCK_EMAIL.subject} 5`, message: `${MOCK_EMAIL.message} Body 5` },
        email6: { subject: `${MOCK_EMAIL.subject} 6`, message: `${MOCK_EMAIL.message} Body 6` },
        Email: `test.user.${Date.now()}@example.com`,
      };

      const sampleLeads = [sampleLead];

      try {
        const response = await uploadLeadsToSmartlead(testCampaignId, [
          {
            email: sampleLead.Email,
            first_name: sampleLead["First Name"],
            last_name: sampleLead["Last Name"],
            company_name: sampleLead["Company Name for Emails"],
            location: sampleLead.City,
            company_url: sampleLead.Website,
            linkedin_profile: sampleLead["Person Linkedin Url"],
            phone_number: sampleLead["Mobile Phone"],
          },
        ]);

        expect(response).toBeDefined();
        expect(response.ok).toBe(true);
        expect(response.upload_count).toBeGreaterThanOrEqual(sampleLeads.length);
        expect(response.total_leads).toBeGreaterThanOrEqual(sampleLeads.length);
        expect(response.block_count).toBe(0);
        expect(response.duplicate_count).toBe(0);
        expect(response.invalid_email_count).toBe(0);
        expect(response.invalid_emails).toEqual([]);
        expect(response.already_added_to_campaign).toBe(0);
        expect(response.unsubscribed_leads).toEqual([]);
      } catch (error) {
        console.error("Error uploading leads:", error);
        throw error;
      }
    },
    TIMEOUT
  );

  afterAll(async () => {
    if (testCampaignId && env.SMARTLEAD_API_KEY) {
      try {
        await deleteCampaign(testCampaignId);
      } catch (error) {
        console.error("Error deleting campaign:", error);
      }
    }
  }, TIMEOUT);
});
