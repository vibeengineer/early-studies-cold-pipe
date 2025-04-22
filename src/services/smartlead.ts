import { env } from "cloudflare:workers";
import { z } from "zod";
import { structureObjectWithCustomFields } from "../utils";
import type { GenerateEmail } from "./ai/types";
import type { ApolloContact } from "./apollo/schema";
import type { LinkedinProfile } from "./proxycurl/schemas";

type Lead = ApolloContact &
  LinkedinProfile & {
    email1: GenerateEmail;
    email2: GenerateEmail;
    email3: GenerateEmail;
    email4: GenerateEmail;
    email5: GenerateEmail;
    email6: GenerateEmail;
  };

export async function uploadLeadsToSmartlead(
  campaignId: string,
  leads: Lead[]
): Promise<UploadLeadsResponse> {
  const camelCaseLeads = leads.map(structureObjectWithCustomFields);
  const response = await fetch(
    `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads?api_key=${env.SMARTLEAD_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        lead_list: camelCaseLeads,
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

export async function updateCampaign(
  campaignId: string,
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

export async function deleteCampaign(campaignId: string): Promise<GenericSmartleadResponse> {
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
