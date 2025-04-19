import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPersonRecordToDB,
  checkIfPersonWithEmailExistsInDb,
  deletePerson,
} from "../../src/services/database/index";
import { MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE } from "../mocks/person";

const TEST_EMAIL = "test.add.delete@example.com";
const TEST_LINKEDIN_URL = "http://linkedin.com/in/testadddelete";

describe("Person DB Operations", () => {
  beforeEach(async () => {
    await deletePerson(TEST_EMAIL);
  });

  afterEach(async () => {
    await deletePerson(TEST_EMAIL);
  });

  describe("checkIfPersonWithEmailExistsInDb", () => {
    it("should return true if the person exists in seeded data", async () => {
      const result = await checkIfPersonWithEmailExistsInDb(MOCK_APOLLO_CONTACT.Email, env.DB);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(true);
      expect(result.data.person).toBeDefined();
      expect(result.data.person?.email).toBe(MOCK_APOLLO_CONTACT.Email);
    });

    it("should return false if the person does not exist", async () => {
      const result = await checkIfPersonWithEmailExistsInDb("nonexistent@example.com", env.DB);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(false);
      expect(result.data.person).toBeUndefined();
    });
  });

  describe("addPersonRecordToDB", () => {
    it("should add a new person record", async () => {
      const testContact = {
        ...MOCK_APOLLO_CONTACT,
        Email: TEST_EMAIL,
        "Person Linkedin Url": TEST_LINKEDIN_URL,
      };
      const addResult = await addPersonRecordToDB(testContact, MOCK_ENRICHMENT_PERSON_PROFILE);
      expect(addResult.success).toBe(true);
      expect(addResult.data).toBeDefined();
      expect(addResult.data.email).toBe(TEST_EMAIL);
      expect(addResult.data.linkedinUrl).toBe(TEST_LINKEDIN_URL);
      expect(addResult.data.apolloContactJson).toEqual(testContact);
      expect(addResult.data.proxycurlProfileJson).toEqual(MOCK_ENRICHMENT_PERSON_PROFILE);

      const checkResult = await checkIfPersonWithEmailExistsInDb(TEST_EMAIL, env.DB);
      expect(checkResult.data.exists).toBe(true);
    });
  });

  describe("deletePerson", () => {
    it("should delete an existing person record", async () => {
      const testContact = {
        ...MOCK_APOLLO_CONTACT,
        Email: TEST_EMAIL,
        "Person Linkedin Url": TEST_LINKEDIN_URL,
      };
      await addPersonRecordToDB(testContact, MOCK_ENRICHMENT_PERSON_PROFILE);

      let checkResult = await checkIfPersonWithEmailExistsInDb(TEST_EMAIL, env.DB);
      expect(checkResult.data.exists).toBe(true);

      const deleteResult = await deletePerson(TEST_EMAIL);
      expect(deleteResult.success).toBe(true);

      checkResult = await checkIfPersonWithEmailExistsInDb(TEST_EMAIL, env.DB);
      expect(checkResult.data.exists).toBe(false);
    });

    it("should not throw an error if the person does not exist", async () => {
      const checkResult = await checkIfPersonWithEmailExistsInDb(TEST_EMAIL, env.DB);
      expect(checkResult.data.exists).toBe(false);

      const deleteResult = await deletePerson(TEST_EMAIL);
      expect(deleteResult.success).toBe(true);
    });
  });
});
