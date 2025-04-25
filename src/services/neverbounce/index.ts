import { env } from "cloudflare:workers";
import { z } from "zod";

const API_KEY = env.NEVERBOUNCE_API_KEY;
const API_URL = "https://api.neverbounce.com/v4.2/single/check";

const neverbounceResponseSchema = z.object({
  status: z.string(),
  result: z.string(),
  flags: z.array(z.string()),
  suggested_correction: z.string(),
  execution_time: z.number(),
  result_message: z.string().optional(),
  credits_used: z.number().optional(),
  credits_remaining: z.number().optional(),
});

const neverbounceAccountInfoResponseSchema = z.object({
  status: z.string(),
  credits_info: z.object({
    paid_credits_used: z.number(),
    free_credits_used: z.number(),
    paid_credits_remaining: z.number(),
    free_credits_remaining: z.number(),
  }),
  job_counts: z.object({
    completed: z.number(),
    under_review: z.number(),
    queued: z.number(),
    processing: z.number(),
  }),
  execution_time: z.number(),
});

export type NeverbounceResponse = z.infer<typeof neverbounceResponseSchema>;
export type NeverbounceAccountInfoResponse = z.infer<typeof neverbounceAccountInfoResponseSchema>;
export async function verifyEmail(email: string) {
  const url = `${API_URL}?key=${API_KEY}&email=${encodeURIComponent(email)}`;
  const apiResponse = await fetch(url);
  const responseJson = await apiResponse.json();
  const parsedResponse = neverbounceResponseSchema.parse(responseJson);
  return {
    success: parsedResponse.result === "valid",
    data: parsedResponse,
    error: null,
  };
}

export async function getNeverbounceAccountInfo() {
  const url = `https://api.neverbounce.com/v4.2/account/info?key=${API_KEY}`;
  const apiResponse = await fetch(url);
  const responseJson = await apiResponse.json();
  const parsedResponse = neverbounceAccountInfoResponseSchema.parse(responseJson);
  return {
    success: parsedResponse.credits_info.paid_credits_remaining > 0,
    data: parsedResponse,
    error: null,
  };
}
