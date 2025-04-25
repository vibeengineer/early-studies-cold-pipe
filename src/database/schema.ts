import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import type { ApolloContact } from "../services/apollo/schema";
import type { LinkedinProfile } from "../services/proxycurl/schemas";

export const people = sqliteTable(
  "people",
  {
    firstName: text("first_name"),
    lastName: text("last_name"),
    phoneNumber: text("phone_number"),
    companyName: text("company_name"),
    website: text("website"),
    location: text("location"),
    companyUrl: text("company_url"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(8)),
    email: text("email").notNull(),
    linkedinUrl: text("linkedin_url").notNull(),
    emailHasBeenChecked: integer("email_has_been_checked", { mode: "boolean" }).default(false),
    emailIsValid: integer("email_verified", { mode: "boolean" }).default(false),
    emailsWritten: integer("emails_written", { mode: "boolean" }).default(false),
    linkedinProfileFetched: integer("linkedin_profile_fetched", { mode: "boolean" }).default(false),
    syncedToSmartlead: integer("synced_to_smartlead", { mode: "boolean" }).default(false),
    apolloContactJson: text("apollo_contact_json", { mode: "json" })
      .$type<ApolloContact>()
      .notNull(),
    proxycurlProfileJson: text("proxycurl_profile_json", { mode: "json" }).$type<LinkedinProfile>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .$onUpdate(() => sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    emailIdx: uniqueIndex("people_email_idx").on(table.email),
  })
);

export const campaigns = sqliteTable(
  "campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(8)),
    name: text("name").notNull(),
    smartleadCampaignId: integer("smartlead_campaign_id").unique(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .$onUpdate(() => sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    smartleadCampaignIdIdx: index("campaigns_smartlead_campaign_id_idx").on(
      table.smartleadCampaignId
    ),
  })
);

export const emails = sqliteTable(
  "emails",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(8)),
    message: text("message").notNull(),
    subject: text("subject").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    personId: text("person_id").references(() => people.id),
    campaignId: text("campaign_id").references(() => campaigns.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .$onUpdate(() => sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    personIdIdx: index("emails_person_id_idx").on(table.personId),
  })
);

export const schema = {
  people,
  campaigns,
  emails,
};
