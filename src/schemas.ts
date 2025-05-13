import z from "zod";
import "zod-openapi/extend";

export const ContactQueueFormSchema = z.object({
  smartleadCampaignId: z.coerce.number().openapi({
    description: "The id of the campaign to associate the contacts with.",
    example: 123,
  }),
  contactsFile: z
    .custom<File>((val) => val instanceof File, "Input must be a CSV file")
    .refine((file) => file.type === "text/csv", {
      message: "File must be a CSV.",
    })
    .refine((file) => file.size > 0, {
      message: "CSV file cannot be empty.",
    })
    .openapi({
      type: "string", // Important for OpenAPI spec generation for files
      format: "binary",
      description:
        "CSV file containing contacts. Headers must match Apollo contact fields (e.g., 'First Name', 'Email', 'Person Linkedin Url').",
    }),
});

export const WebScreenshotTestSchema = z.object({
  url: z.string().url().openapi({
    description: "The website URL to screenshot.",
    example: "https://example.com",
  }),
  templateImageKey: z.string().min(1).openapi({
    description: "R2 key for the template image.",
    example: "template.png",
  }),
  outputKey: z.string().min(1).openapi({
    description: "R2 key for the final image.",
    example: "final/example-com.png",
  }),
});
