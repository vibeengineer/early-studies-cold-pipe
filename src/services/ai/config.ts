import { env } from "cloudflare:workers";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const geminiModel = google("gemini-2.5-pro-exp-03-25", {
  safetySettings: [
    { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "OFF" },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "OFF",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "OFF",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "OFF",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "OFF",
    },
  ],
});

export const geminiFlashModel = google("gemini-2.5-flash-preview-04-17", {
  safetySettings: [
    { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "OFF" },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "OFF",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "OFF",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "OFF",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "OFF",
    },
  ],
});

export const openaiModel = openai("o4-mini-2025-04-16");

export const anthropicModel = anthropic("claude-3-7-sonnet-20250219");
