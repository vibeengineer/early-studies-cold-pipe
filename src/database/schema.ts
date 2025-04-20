import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import type { ApolloContact } from "../services/apollo/schema";
import type { LinkedinProfile } from "../services/proxycurl/schemas";

export const people = sqliteTable(
  "people",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(8)),
    email: text("email").notNull(),
    linkedinUrl: text("linkedin_url").notNull(),
    apolloContactJson: text("apollo_contact_json", { mode: "json" })
      .$type<ApolloContact>()
      .notNull(),
    proxycurlProfileJson: text("proxycurl_profile_json", { mode: "json" })
      .$type<LinkedinProfile>()
      .notNull(),
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

export const campaigns = sqliteTable("campaigns", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(8)),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => sql`(strftime('%s', 'now'))`),
});

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
