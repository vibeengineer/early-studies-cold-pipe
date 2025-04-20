import { generateObject } from "ai";
import { z } from "zod";
import type { ApolloContact } from "../apollo/schema";
import type { PersonProfile } from "../proxycurl/schemas";
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
  profile?: PersonProfile | null,
  previousEmails: GenerateEmail[] = []
) {
  const parsedContact = validContactSchema.parse(contact) as ApolloContact;

  const systemPrompt = generatePrompt(
    parsedContact,
    profile ?? null,
    sequenceNumber,
    previousEmails
  );

  try {
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
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false as const,
    };
  }
}

export async function generateAllEmails(contact: ApolloContact, profile?: PersonProfile | null) {
  const email1 = await generateEmail(contact, 1, profile, []);
  if (!email1.success) {
    return {
      data: null,
      error: email1.error,
      success: false as const,
    };
  }
  const email2 = await generateEmail(contact, 2, profile, [email1.data]);
  if (!email2.success) {
    return {
      data: null,
      error: email2.error,
      success: false as const,
    };
  }
  const email3 = await generateEmail(contact, 3, profile, [email1.data, email2.data]);
  if (!email3.success) {
    return {
      data: null,
      error: email3.error,
      success: false as const,
    };
  }
  const email4 = await generateEmail(contact, 4, profile, [email1.data, email2.data, email3.data]);
  if (!email4.success) {
    return {
      data: null,
      error: email4.error,
      success: false as const,
    };
  }
  return {
    data: [
      { ...email1.data, sequenceNumber: 1 },
      { ...email2.data, sequenceNumber: 2 },
      { ...email3.data, sequenceNumber: 3 },
      { ...email4.data, sequenceNumber: 4 },
    ],
    error: null,
    success: true as const,
  };
}
