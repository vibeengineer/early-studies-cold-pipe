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

export type NeverbounceResponse = z.infer<typeof neverbounceResponseSchema>;

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
