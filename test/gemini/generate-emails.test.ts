import { describe, expect, it } from "vitest";
import { generateEmail } from "../../src/services/gemini/index";
import type { GenerateEmail } from "../../src/services/gemini/types";
import { MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE } from "../mocks/person";

describe("generate all emails", async () => {
  let emailOneResult: GenerateEmail | null | undefined;
  let emailTwoResult: GenerateEmail | null | undefined;

  it("generate email one", async () => {
    const email = await generateEmail(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 1, []);
    console.log(email.data?.message, email.data?.subject);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailOneResult = email.data;
  }, 100000);

  it("generate email two", async () => {
    const previousEmails = emailOneResult ? [emailOneResult] : [];
    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      2,
      previousEmails
    );
    console.log(email.data?.message, email.data?.subject);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailTwoResult = email.data;
  }, 100000);

  it("generate email three", async () => {
    const previousEmails: GenerateEmail[] = [];
    if (emailOneResult) {
      previousEmails.push(emailOneResult);
    }
    if (emailTwoResult) {
      previousEmails.push(emailTwoResult);
    }

    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      3,
      previousEmails
    );
    console.log(email.data?.message, email.data?.subject);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
  }, 100000);
});
