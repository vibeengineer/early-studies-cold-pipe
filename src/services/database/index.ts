import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "../../database/schema";
import type { ApolloContact } from "../apollo/schema";
import type { LinkedinProfile } from "../proxycurl/schemas";

export async function checkIfPersonWithEmailExistsInDb(email: string, db?: D1Database) {
  const drizzleDb = drizzle(db ?? env.DB, { schema });
  const result = await drizzleDb.query.people.findFirst({
    where: eq(schema.people.email, email),
  });

  return {
    data: {
      exists: result !== undefined,
      person: result,
    },
    success: true,
    error: null,
  };
}

export async function addPersonRecordToDB(contact: ApolloContact, profile: LinkedinProfile) {
  const drizzleDb = drizzle(env.DB, { schema });
  const result = await drizzleDb
    .insert(schema.people)
    .values({
      email: contact.Email,
      linkedinUrl: contact["Person Linkedin Url"],
      apolloContactJson: contact,
      proxycurlProfileJson: profile,
    })
    .returning();

  return {
    data: result[0],
    success: true,
    error: null,
  };
}

export async function createCampaign(name: string) {
  const drizzleDb = drizzle(env.DB, { schema });
  const result = await drizzleDb
    .insert(schema.campaigns)
    .values({
      name,
    })
    .returning();

  return {
    data: result[0],
    success: true,
    error: null,
  };
}

export async function getCampaignByName(name: string) {
  const drizzleDb = drizzle(env.DB, { schema });
  const result = await drizzleDb.query.campaigns.findFirst({
    where: eq(schema.campaigns.name, name),
  });

  return {
    data: result,
    success: true,
    error: null,
  };
}

export async function deletePerson(email: string) {
  const drizzleDb = drizzle(env.DB, { schema });
  await drizzleDb.delete(schema.people).where(eq(schema.people.email, email));
  return {
    data: null,
    success: true,
    error: null,
  };
}

export async function createEmail(
  email: { subject: string; message: string },
  campaignName: string
) {
  const drizzleDb = drizzle(env.DB, { schema });

  const campaign = await drizzleDb.query.campaigns.findFirst({
    where: eq(schema.campaigns.name, campaignName),
  });

  if (!campaign) {
    return {
      data: null,
      success: false,
      error: "Campaign not found",
    };
  }

  const result = await drizzleDb
    .insert(schema.emails)
    .values({
      message: email.message,
      subject: email.subject,
      sequenceNumber: 1,
      campaignId: campaign.id,
    })
    .returning();

  return {
    data: result[0],
    success: true,
    error: null,
  };
}

export async function getCampaignEmails(campaignName: string) {
  const drizzleDb = drizzle(env.DB, { schema });
  const campaign = await drizzleDb.query.campaigns.findFirst({
    where: eq(schema.campaigns.name, campaignName),
  });

  if (!campaign) {
    return {
      data: null,
      success: false,
      error: "Campaign not found",
    };
  }

  const result = await drizzleDb.query.emails.findMany({
    where: eq(schema.emails.campaignId, campaign.id),
    orderBy: [desc(schema.emails.sequenceNumber)],
  });

  return {
    data: result,
    success: true,
    error: null,
  };
}

export async function getCampaignEmail(campaignName: string, sequenceNumber: number) {
  const drizzleDb = drizzle(env.DB, { schema });
  const result = await drizzleDb.query.emails.findFirst({
    where: eq(schema.emails.campaignId, campaignName),
  });
}

export async function deleteAllEmailsForPerson(email: string) {
  const drizzleDb = drizzle(env.DB, { schema });
  const person = await drizzleDb.query.people.findFirst({
    where: eq(schema.people.email, email),
  });

  if (!person) {
    return {
      data: null,
      success: false,
      error: "Person not found",
    };
  }

  await drizzleDb.delete(schema.emails).where(eq(schema.emails.personId, person.id));

  return {
    data: null,
    success: true,
    error: null,
  };
}
