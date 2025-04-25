import { env } from "cloudflare:workers";
import { z } from "zod";
import PersonProfileSchema, { type LinkedinProfile } from "./schemas";

export const PROXYCURL_API_BASE = "https://nubela.co/proxycurl/api/v2/linkedin";

const creditBalanceResponseSchema = z.object({
  credit_balance: z.number(),
});

export async function getProxycurlCreditBalance() {
  const response = await fetch("https://nubela.co/proxycurl/api/credit-balance", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.PROXYCURL_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Proxycurl API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const validatedData = creditBalanceResponseSchema.parse(data);

  return validatedData.credit_balance;
}

export async function fetchPersonProfile(linkedinProfileUrl: string) {
  try {
    z.string().url().parse(linkedinProfileUrl);
  } catch (error) {
    throw new Error(`Invalid LinkedIn Profile URL provided: ${linkedinProfileUrl}`);
  }

  const url = new URL(PROXYCURL_API_BASE);
  url.searchParams.append("linkedin_profile_url", linkedinProfileUrl);
  url.searchParams.append("extra", "include");
  url.searchParams.append("skills", "include");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.PROXYCURL_API_KEY}`,
    },
  });

  if (!response.ok) {
    return {
      success: false,
      data: null,
      error: "Profile not found",
    };
  }

  const data = await response.json();

  const validatedData = PersonProfileSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      success: false,
      data: null,
      error: "Invalid profile data",
    };
  }

  return {
    success: true,
    data: validatedData.data,
    error: null,
  };
}
