import { env } from "cloudflare:workers";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
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
