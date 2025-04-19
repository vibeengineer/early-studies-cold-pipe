import { env } from "cloudflare:workers";
import NeverBounce from "neverbounce";

const neverbounce = new NeverBounce({ apiKey: env.NEVERBOUNCE_API_KEY });

export async function verifyEmail(email: string) {
  const response = (await neverbounce.single.check(email)) as NeverBounceResponse;

  return response;
}

type NeverBounceResponse = {
  status: string;
  result: string;
  flags: string[];
  suggested_correction: string;
  execution_time: number;
  result_message: string;
  credits_used: number;
  credits_remaining: number;
};
