import { env } from "cloudflare:workers";
import { z } from "zod";
import { structureObjectWithCustomFields } from "../utils";
import type { GenerateEmail } from "./ai/types";
import type { ApolloContact } from "./apollo/schema";
import type { LinkedinProfile } from "./proxycurl/schemas";

// "first_name": "Cristiano"
// "last_name": "Ronaldo"
// "email": "cristiano@mufc.com"
// "phone_number": 0239392029
// "company_name": "Manchester United"
// "website": "mufc.com"
// "location": "London"
// "custom_fields": {"Title": "Regional Manager", "First_Line": "Loved your recent post about remote work on Linkedin" } // max 20 fields
// "linkedin_profile": "http://www.linkedin.com/in/cristianoronaldo"
// "company_url": "mufc.com"

const smartleadLeadSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone_number: z.union([z.number(), z.string()]).nullable().optional(),
  company_name: z.string(),
  location: z.string(),
  custom_fields: z.any(),
  linkedin_profile: z.string(),
  company_url: z.string(),
});

const smartleadLeadsSchema = z.array(smartleadLeadSchema);

type SmartleadLead = z.infer<typeof smartleadLeadSchema>;

export async function uploadLeadsToSmartlead(
  campaignId: number,
  leads: SmartleadLead[]
): Promise<UploadLeadsResponse> {
  const parsedLeads = smartleadLeadsSchema.parse(leads);
  const response = await fetch(
    `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads?api_key=${env.SMARTLEAD_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        lead_list: parsedLeads,
        settings: {
          ignore_global_block_list: false,
          ignore_unsubscribe_list: false,
          ignore_community_bounce_list: false,
          ignore_duplicate_leads_in_other_campaign: false,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload leads to Smartlead: ${response.statusText}`);
  }

  const data = await response.json();
  return uploadLeadsResponseSchema.parse(data);
}

const createCampaignResponseSchema = z.object({
  ok: z.boolean(),
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
});

type CreateSmartleadCampaignResponse = z.infer<typeof createCampaignResponseSchema>;

const genericSmartleadResponseSchema = z.object({
  ok: z.boolean(),
});

type GenericSmartleadResponse = z.infer<typeof genericSmartleadResponseSchema>;

const uploadLeadsResponseSchema = z.object({
  ok: z.boolean(),
  upload_count: z.number(),
  total_leads: z.number(),
  block_count: z.number(),
  duplicate_count: z.number(),
  invalid_email_count: z.number(),
  invalid_emails: z.array(z.string()),
  already_added_to_campaign: z.number(),
  unsubscribed_leads: z.array(z.string()),
  is_lead_limit_exhausted: z.boolean(),
  lead_import_stopped_count: z.number(),
  bounce_count: z.number(),
});

// {
// 	"id": 372
// 	"user_id": 124
// 	"created_at":  "2022-05-26T03:47:31.448094+00:00"
// 	"updated_at": "2022-05-26T03:47:31.448094+00:00"
// 	"status": "ACTIVE" // ENUM (DRAFTED/ACTIVE/COMPLETED/STOPPED/PAUSED)
// 	"name": "My Epic Campaign"
// 	"track_settings": "DONT_REPLY_TO_AN_EMAIL" // ENUM (DONT_EMAIL_OPEN/DONT_LINK_CLICK/DONT_REPLY_TO_AN_EMAIL)
// 	"scheduler_cron_value": "{ tz: 'Australia/Sydney', days: [ 1, 2, 3, 4, 5 ], endHour: '23:00', startHour: '10:00' }"
// 	"min_time_btwn_emails": 10 // minutes
// 	"max_leads_per_day": 10
// 	"stop_lead_settings": "REPLY_TO_AN_EMAIL" // ENUM (REPLY_TO_AN_EMAIL/CLICK_ON_A_LINK/OPEN_AN_EMAIL)
// 	"unsubscribe_text": "Don't Contact Me",
// 	"client_id": 23 // null if the campaign is not attached to a client,
// 	"enable_ai_esp_matching": true, // leads will be matched with similar ESP mailboxes IF they exist, else normal sending occurs
// 	"send_as_plain_text": true, // emails for this campaign are sent as plain text (parsing out any html)
// 	"follow_up_percentage": 40% // the follow up percetange allocated - it is assumed 60% is new leads
// }

const getCampaignResponseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  status: z.union([
    z.literal("DRAFTED"),
    z.literal("ACTIVE"),
    z.literal("COMPLETED"),
    z.literal("STOPPED"),
    z.literal("PAUSED"),
  ]),
  name: z.string(),
  track_settings: z.array(
    z.union([
      z.literal("DONT_EMAIL_OPEN"),
      z.literal("DONT_LINK_CLICK"),
      z.literal("DONT_REPLY_TO_AN_EMAIL"),
    ])
  ),
  scheduler_cron_value: z.any().nullable(),
  min_time_btwn_emails: z.number(),
  max_leads_per_day: z.number(),
  stop_lead_settings: z.union([
    z.literal("REPLY_TO_AN_EMAIL"),
    z.literal("CLICK_ON_A_LINK"),
    z.literal("OPEN_AN_EMAIL"),
  ]),
  unsubscribe_text: z.string().nullable(),
  client_id: z.number().nullable(),
  enable_ai_esp_matching: z.boolean(),
  send_as_plain_text: z.boolean(),
  follow_up_percentage: z.number(),
});

type GetCampaignResponse = z.infer<typeof getCampaignResponseSchema>;

type UploadLeadsResponse = z.infer<typeof uploadLeadsResponseSchema>;

export async function createCampaign(
  campaignName?: string
): Promise<CreateSmartleadCampaignResponse> {
  const response = await fetch(
    `https://server.smartlead.ai/api/v1/campaigns/create?api_key=${env.SMARTLEAD_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...(campaignName && { name: campaignName }),
        client_id: null,
      }),
    }
  );

  if (!response.ok) {
    console.log(await response.json());
    throw new Error(`Failed to create campaign: ${response.statusText}`);
  }

  const data = await response.json();
  return createCampaignResponseSchema.parse(data);
}

export async function getCampaign(campaignId: number) {
  try {
    const response = await fetch(
      `https://server.smartlead.ai/api/v1/campaigns/${campaignId.toString()}?api_key=${env.SMARTLEAD_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get campaign: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedData = getCampaignResponseSchema.parse(data);

    return {
      data: parsedData,
      success: true,
      error: null,
    };
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    return {
      data: null,
      success: false,
      error: "Failed to get campaign",
    };
  }
}

export async function updateCampaign(
  campaignId: number,
  campaignName: string
): Promise<GenericSmartleadResponse> {
  const response = await fetch(
    `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/settings?api_key=${env.SMARTLEAD_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: campaignName,
      }),
    }
  );

  if (!response.ok) {
    console.log(await response.json());
    throw new Error(`Failed to update campaign: ${response.statusText}`);
  }

  const data = await response.json();

  return genericSmartleadResponseSchema.parse(data);
}

export async function deleteCampaign(campaignId: number): Promise<GenericSmartleadResponse> {
  const response = await fetch(
    `https://server.smartlead.ai/api/v1/campaigns/${campaignId}?api_key=${env.SMARTLEAD_API_KEY}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    console.log(await response.json());
    throw new Error(`Failed to delete campaign: ${response.statusText}`);
  }

  const data = await response.json();
  return genericSmartleadResponseSchema.parse(data);
}
