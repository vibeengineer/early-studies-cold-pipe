PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`emails_written` integer DEFAULT false,
	`linkedin_profile_fetched` integer DEFAULT false,
	`synced_to_smartlead` integer DEFAULT false,
	`apollo_contact_json` text NOT NULL,
	`proxycurl_profile_json` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_people`("first_name", "last_name", "phone_number", "company_name", "website", "location", "company_url", "id", "email", "linkedin_url", "emails_written", "linkedin_profile_fetched", "synced_to_smartlead", "apollo_contact_json", "proxycurl_profile_json", "created_at", "updated_at") SELECT "first_name", "last_name", "phone_number", "company_name", "website", "location", "company_url", "id", "email", "linkedin_url", "emails_written", "linkedin_profile_fetched", "synced_to_smartlead", "apollo_contact_json", "proxycurl_profile_json", "created_at", "updated_at" FROM `people`;--> statement-breakpoint
DROP TABLE `people`;--> statement-breakpoint
ALTER TABLE `__new_people` RENAME TO `people`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `people_email_idx` ON `people` (`email`);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `smartlead_campaign_id` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_smartlead_campaign_id_unique` ON `campaigns` (`smartlead_campaign_id`);--> statement-breakpoint
CREATE INDEX `campaigns_smartlead_campaign_id_idx` ON `campaigns` (`smartlead_campaign_id`);