import { generateObject } from "ai";
import { z } from "zod";
import type { ApolloContact } from "../apollo/schema";
import type { LinkedinProfile } from "../proxycurl/schemas";
import { geminiFlashModel } from "./config";
import { generatePrompt } from "./prompt-generator";
import { type GenerateEmail, generateEmailSchema } from "./types";

const validContactSchema = z
  .object({
    "First Name": z.string(),
    Email: z.string(),
    "Person Linkedin Url": z.string(),
  })
  .passthrough();

export async function generateEmail(
  contact: ApolloContact,
  sequenceNumber: number,
  previousEmails: GenerateEmail[] = [],
  profile?: LinkedinProfile | null
) {
  const parsedContact = validContactSchema.parse(contact) as ApolloContact;

  const systemPrompt = generatePrompt(
    parsedContact,
    profile ?? null,
    sequenceNumber,
    previousEmails
  );

  const { object } = await generateObject({
    model: geminiFlashModel,
    schema: generateEmailSchema,
    prompt: systemPrompt,
  });

  return {
    data: object,
    error: null,
    success: true as const,
  };
}

export async function generateAllEmails(contact: ApolloContact, profile?: LinkedinProfile | null) {
  const email1 = await generateEmail(contact, 1, [], profile);
  console.log("Email 1 generated", { email1 });
  if (!email1.success) {
    return {
      data: null,
      error: email1.error,
      success: false as const,
    };
  }
  const email2 = await generateEmail(contact, 2, [email1.data], profile);
  console.log("Email 2 generated", { email2 });
  if (!email2.success) {
    return {
      data: null,
      error: email2.error,
      success: false as const,
    };
  }
  const email3 = await generateEmail(contact, 3, [email1.data, email2.data], profile);
  console.log("Email 3 generated", { email3 });
  if (!email3.success) {
    return {
      data: null,
      error: email3.error,
      success: false as const,
    };
  }
  const email4 = await generateEmail(contact, 4, [email1.data, email2.data, email3.data], profile);
  if (!email4.success) {
    return {
      data: null,
      error: email4.error,
      success: false as const,
    };
  }
  const email5 = await generateEmail(
    contact,
    5,
    [email1.data, email2.data, email3.data, email4.data],
    profile
  );
  if (!email5.success) {
    return {
      data: null,
      error: email5.error,
      success: false as const,
    };
  }
  const email6 = await generateEmail(
    contact,
    6,
    [email1.data, email2.data, email3.data, email4.data, email5.data],
    profile
  );

  if (!email6.success) {
    return {
      data: null,
      error: email6.error,
      success: false as const,
    };
  }

  return {
    data: [
      { ...email1.data, sequenceNumber: 1 },
      { ...email2.data, sequenceNumber: 2 },
      { ...email3.data, sequenceNumber: 3 },
      { ...email4.data, sequenceNumber: 4 },
      { ...email5.data, sequenceNumber: 5 },
      { ...email6.data, sequenceNumber: 6 },
    ],
    error: null,
    success: true as const,
  };
}
