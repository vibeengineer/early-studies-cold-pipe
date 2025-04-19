import { env } from "cloudflare:workers";
import { z } from "zod";
import PersonProfileSchema, { type PersonProfile } from "./schemas";

export const PROXYCURL_API_BASE = "https://nubela.co/proxycurl/api/v2/linkedin";

export async function fetchPersonProfile(linkedinProfileUrl: string): Promise<PersonProfile> {
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
    let errorBodyText = `Status: ${response.status} ${response.statusText}`;
    try {
      const errorBodyJson = await response.json();
      errorBodyText = JSON.stringify(errorBodyJson);
    } catch (e) {
      errorBodyText = await response.text();
    }
    throw new Error(`Proxycurl API request failed: ${errorBodyText}`);
  }

  const data = await response.json();

  const validatedData = PersonProfileSchema.parse(data);

  return validatedData;
}
