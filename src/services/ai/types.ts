import { z } from "zod";

// Define a type for the structured email guidance
export type EmailGuidance = {
  title: string;
  description: string;
  guidancePoints: string[];
  exampleStructure: string;
  subjectLine: string;
};

export const generateEmailSchema = z.object({
  subject: z.string().describe("The email subject line."),
  message: z.string().describe("The full email body content."),
});

export type GenerateEmail = z.infer<typeof generateEmailSchema>;
