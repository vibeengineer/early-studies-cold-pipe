PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`smartlead_campaign_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
INSERT INTO `__new_campaigns`("id", "name", "smartlead_campaign_id", "created_at", "updated_at") SELECT "id", "name", "smartlead_campaign_id", "created_at", "updated_at" FROM `campaigns`;--> statement-breakpoint
DROP TABLE `campaigns`;--> statement-breakpoint
ALTER TABLE `__new_campaigns` RENAME TO `campaigns`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_smartlead_campaign_id_unique` ON `campaigns` (`smartlead_campaign_id`);--> statement-breakpoint
CREATE INDEX `campaigns_smartlead_campaign_id_idx` ON `campaigns` (`smartlead_campaign_id`);--> statement-breakpoint
CREATE TABLE `__new_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`subject` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`person_id` text,
	`campaign_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_emails`("id", "message", "subject", "sequence_number", "person_id", "campaign_id", "created_at", "updated_at") SELECT "id", "message", "subject", "sequence_number", "person_id", "campaign_id", "created_at", "updated_at" FROM `emails`;--> statement-breakpoint
DROP TABLE `emails`;--> statement-breakpoint
ALTER TABLE `__new_emails` RENAME TO `emails`;--> statement-breakpoint
CREATE INDEX `emails_person_id_idx` ON `emails` (`person_id`);--> statement-breakpoint
CREATE TABLE `__new_people` (
	`first_name` text,
	`last_name` text,
	`phone_number` text,
	`company_name` text,
	`website` text,
	`location` text,
	`company_url` text,
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`linkedin_url` text NOT NULL,
	`email_has_been_checked` integer DEFAULT false,
	`email_verified` integer DEFAULT false,
	`emails_written` integer DEFAULT false,
	`linkedin_profile_fetched` integer DEFAULT false,
	`synced_to_smartlead` integer DEFAULT false,
	`apollo_contact_json` text NOT NULL,
	`proxycurl_profile_json` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
INSERT INTO `__new_people`("first_name", "last_name", "phone_number", "company_name", "website", "location", "company_url", "id", "email", "linkedin_url", "email_has_been_checked", "email_verified", "emails_written", "linkedin_profile_fetched", "synced_to_smartlead", "apollo_contact_json", "proxycurl_profile_json", "created_at", "updated_at") SELECT "first_name", "last_name", "phone_number", "company_name", "website", "location", "company_url", "id", "email", "linkedin_url", "email_has_been_checked", "email_verified", "emails_written", "linkedin_profile_fetched", "synced_to_smartlead", "apollo_contact_json", "proxycurl_profile_json", "created_at", "updated_at" FROM `people`;--> statement-breakpoint
DROP TABLE `people`;--> statement-breakpoint
ALTER TABLE `__new_people` RENAME TO `people`;--> statement-breakpoint
CREATE UNIQUE INDEX `people_email_idx` ON `people` (`email`);