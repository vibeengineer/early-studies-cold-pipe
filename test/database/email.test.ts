import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  addPersonRecordToDB,
  createCampaign,
  createEmail,
  deleteAllEmailsForPerson,
  deletePerson,
  getCampaignEmail,
  getCampaignEmails,
} from "../../src/services/database/index";
import { MOCK_EMAIL } from "../mocks/email";
import { MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE } from "../mocks/person";

const TEST_CAMPAIGN_NAME = `Test Campaign ${Date.now()}`;
const TEST_EMAIL_ADDR = `test.email.${Date.now()}@example.com`;
const TEST_LINKEDIN_URL = `http://linkedin.com/in/testemail${Date.now()}`;

let testCampaignId: string | undefined;
let testPersonId: string | undefined;

describe("Email DB Operations", () => {
  beforeAll(async () => {
    const campaignResult = await createCampaign(TEST_CAMPAIGN_NAME);
    if (campaignResult.success) {
      testCampaignId = campaignResult.data.id;
    } else {
      console.error("Failed to create test campaign:", campaignResult.error);
      throw new Error("Failed to create test campaign for email tests");
    }

    const testContact = {
      ...MOCK_APOLLO_CONTACT,
      Email: TEST_EMAIL_ADDR,
      "Person Linkedin Url": TEST_LINKEDIN_URL,
    };
    const personResult = await addPersonRecordToDB(testContact, MOCK_ENRICHMENT_PERSON_PROFILE);
    if (personResult.success) {
      testPersonId = personResult.data.id;
    } else {
      console.error("Failed to create test person:", personResult.error);
    }
  });

  afterAll(async () => {
    if (testPersonId) {
      await deletePerson(TEST_EMAIL_ADDR);
    }
  });

  beforeEach(async () => {
    if (testPersonId) {
      await deleteAllEmailsForPerson(TEST_EMAIL_ADDR);
    }
  });

  describe("createEmail", () => {
    it("should create a new email for a campaign", async () => {
      expect(testCampaignId).toBeDefined();
      const result = await createEmail(MOCK_EMAIL, TEST_CAMPAIGN_NAME);

      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      if (result.success && result.data) {
        expect(result.data.subject).toBe(MOCK_EMAIL.subject);
        expect(result.data.message).toBe(MOCK_EMAIL.message);
        expect(result.data.campaignId).toBe(testCampaignId);
        expect(result.data.sequenceNumber).toBe(1);
      }
    });

    it("should fail if the campaign does not exist", async () => {
      const result = await createEmail(MOCK_EMAIL, "NonExistentCampaign");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Campaign not found");
    });
  });

  describe("getCampaignEmails", () => {
    it("should retrieve emails for a specific campaign", async () => {
      expect(testCampaignId).toBeDefined();
      await createEmail(MOCK_EMAIL, TEST_CAMPAIGN_NAME);

      const result = await getCampaignEmails(TEST_CAMPAIGN_NAME);
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      if (result.success && result.data) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        if (result.data.length > 0) {
          expect(result.data[0].subject).toBe(MOCK_EMAIL.subject);
          expect(result.data[0].campaignId).toBe(testCampaignId);
        }
      }
    });

    it("should return empty array if campaign has no emails", async () => {
      const emptyCampaignName = `Empty Campaign ${Date.now()}`;
      await createCampaign(emptyCampaignName);

      const result = await getCampaignEmails(emptyCampaignName);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      // Add cleanup for emptyCampaignName if needed
    });

    it("should fail if the campaign does not exist", async () => {
      const result = await getCampaignEmails("NonExistentCampaign");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Campaign not found");
    });
  });

  describe.skip("getCampaignEmail", () => {
    it("should retrieve a specific email by sequence number", async () => {
      expect(testCampaignId).toBeDefined();
      const sequenceNumber = 1;
      await createEmail(MOCK_EMAIL, TEST_CAMPAIGN_NAME);

      await getCampaignEmail(TEST_CAMPAIGN_NAME, sequenceNumber);
    });
  });

  describe("deleteAllEmailsForPerson", () => {
    it("should delete all emails associated with a person", async () => {
      expect(testCampaignId).toBeDefined();
      expect(testPersonId).toBeDefined();

      await createEmail(MOCK_EMAIL, TEST_CAMPAIGN_NAME);

      const deleteResult = await deleteAllEmailsForPerson(TEST_EMAIL_ADDR);
      expect(deleteResult.success).toBe(true);
    });

    it("should return success if the person has no emails", async () => {
      expect(testPersonId).toBeDefined();
      const deleteResult = await deleteAllEmailsForPerson(TEST_EMAIL_ADDR);
      expect(deleteResult.success).toBe(true);
    });

    it("should return error if the person does not exist", async () => {
      const deleteResult = await deleteAllEmailsForPerson("nonexistent@person.com");
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe("Person not found");
    });
  });
});
