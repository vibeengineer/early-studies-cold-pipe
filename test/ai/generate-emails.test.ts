import { describe, expect, it } from "vitest";
import { generateEmail } from "../../src/services/ai/index";
import type { GenerateEmail } from "../../src/services/ai/types";
import { MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE } from "../mocks/person";

describe("generate all emails", async () => {
  let emailOneResult: GenerateEmail | null | undefined;
  let emailTwoResult: GenerateEmail | null | undefined;
  let emailThreeResult: GenerateEmail | null | undefined;
  let emailFourResult: GenerateEmail | null | undefined;
  let emailFiveResult: GenerateEmail | null | undefined;

  it("generate email one with profile", async () => {
    const email = await generateEmail(MOCK_APOLLO_CONTACT, 1, MOCK_ENRICHMENT_PERSON_PROFILE, []);

    console.log("SUBJECT (with profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (with profile):");
    console.log(email.data?.message);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailOneResult = email.data;
  }, 100000);

  it("generate email two with profile", async () => {
    const previousEmails = emailOneResult ? [emailOneResult] : [];
    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      2,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      previousEmails
    );
    console.log("SUBJECT (email 2 with profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (email 2 with profile):");
    console.log(email.data?.message);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailTwoResult = email.data;
  }, 100000);

  it("generate email three with profile", async () => {
    const previousEmails: GenerateEmail[] = [];
    if (emailOneResult) {
      previousEmails.push(emailOneResult);
    }
    if (emailTwoResult) {
      previousEmails.push(emailTwoResult);
    }

    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      3,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      previousEmails
    );
    console.log("SUBJECT (email 3 with profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (email 3 with profile):");
    console.log(email.data?.message);
    expect(email.success).toBe(true);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailThreeResult = email.data;
  }, 100000);

  // Test for email 4
  it("generate email four with profile", async () => {
    const previousEmails: GenerateEmail[] = [];
    if (emailOneResult) previousEmails.push(emailOneResult);
    if (emailTwoResult) previousEmails.push(emailTwoResult);
    if (emailThreeResult) previousEmails.push(emailThreeResult);

    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      4,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      previousEmails
    );
    console.log("SUBJECT (email 4 with profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (email 4 with profile):");
    console.log(email.data?.message);
    expect(email.success).toBe(true);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailFourResult = email.data;
  }, 100000);

  // Test for email 5
  it("generate email five with profile", async () => {
    // Assume previous tests ran and results are available (vitest runs sequentially by default in a file)
    const previousEmails: GenerateEmail[] = [];
    if (emailOneResult) previousEmails.push(emailOneResult);
    if (emailTwoResult) previousEmails.push(emailTwoResult);
    if (emailThreeResult) previousEmails.push(emailThreeResult);
    if (emailFourResult) previousEmails.push(emailFourResult);

    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      5,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      previousEmails
    );
    console.log("SUBJECT (email 5 with profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (email 5 with profile):");
    console.log(email.data?.message);
    expect(email.success).toBe(true);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
    emailFiveResult = email.data;
  }, 100000);

  // Test for email 6
  it("generate email six with profile", async () => {
    const previousEmails: GenerateEmail[] = [];
    if (emailOneResult) previousEmails.push(emailOneResult);
    if (emailTwoResult) previousEmails.push(emailTwoResult);
    if (emailThreeResult) previousEmails.push(emailThreeResult);
    if (emailFourResult) previousEmails.push(emailFourResult);
    if (emailFiveResult) previousEmails.push(emailFiveResult);

    const email = await generateEmail(
      MOCK_APOLLO_CONTACT,
      6,
      MOCK_ENRICHMENT_PERSON_PROFILE,
      previousEmails
    );
    console.log("SUBJECT (email 6 with profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (email 6 with profile):");
    console.log(email.data?.message);
    expect(email.success).toBe(true);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
  }, 100000);

  // New test case without profile
  it("generate email one without profile", async () => {
    const email = await generateEmail(MOCK_APOLLO_CONTACT, 1, null, []);

    console.log("SUBJECT (without profile):");
    console.log(email.data?.subject);
    console.log("MESSAGE (without profile):");
    console.log(email.data?.message);
    expect(email.success).toBe(true);
    expect(email.data).toBeDefined();
    expect(email.data?.message).toBeDefined();
    expect(email.data?.subject).toBeDefined();
  }, 100000);
});
