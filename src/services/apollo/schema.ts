import { z } from "zod";

// Helper for preprocessing empty strings to null for optional fields
const preprocessEmptyAsNull = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val === "" ? null : val), schema);

export const ApolloContactSchema = z.object({
  "First Name": z.string().min(1),
  // Optional simple strings generally handle "" okay, but pre-processing can make it consistent if needed
  "Last Name": preprocessEmptyAsNull(z.string().optional().nullable()),
  Title: preprocessEmptyAsNull(z.string().optional().nullable()),
  Company: preprocessEmptyAsNull(z.string().optional().nullable()),
  "Company Name for Emails": preprocessEmptyAsNull(z.string().optional().nullable()),
  Email: z.string().email().min(1), // Required email
  "Email Status": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Primary Email Source": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Email Confidence": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Primary Email Catch-all Status": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Primary Email Last Verified At": preprocessEmptyAsNull(
    z.string().datetime({ offset: true }).optional().nullable()
  ),
  Seniority: preprocessEmptyAsNull(z.string().optional().nullable()),
  Departments: preprocessEmptyAsNull(z.string().optional().nullable()),
  "Contact Owner": preprocessEmptyAsNull(z.string().email().optional().nullable()),
  "Work Direct Phone": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Home Phone": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Mobile Phone": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Corporate Phone": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Other Phone": preprocessEmptyAsNull(z.string().optional().nullable()),
  Stage: preprocessEmptyAsNull(z.string().optional().nullable()),
  Lists: preprocessEmptyAsNull(z.string().optional().nullable()),
  "Last Contacted": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Account Owner": preprocessEmptyAsNull(z.string().email().optional().nullable()),
  "# Employees": preprocessEmptyAsNull(z.coerce.number().optional().nullable()),
  Industry: preprocessEmptyAsNull(z.string().optional().nullable()),
  Keywords: preprocessEmptyAsNull(z.string().optional().nullable()),
  "Person Linkedin Url": z.string().url().min(1), // Required URL
  Website: preprocessEmptyAsNull(z.string().url().optional().nullable()),
  "Company Linkedin Url": preprocessEmptyAsNull(z.string().url().optional().nullable()),
  "Facebook Url": preprocessEmptyAsNull(z.string().url().optional().nullable()),
  "Twitter Url": preprocessEmptyAsNull(z.string().url().optional().nullable()),
  City: preprocessEmptyAsNull(z.string().optional().nullable()),
  State: preprocessEmptyAsNull(z.string().optional().nullable()),
  Country: preprocessEmptyAsNull(z.string().optional().nullable()),
  "Company Address": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Company City": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Company State": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Company Country": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Company Phone": preprocessEmptyAsNull(z.string().optional().nullable()),
  "SEO Description": preprocessEmptyAsNull(z.string().optional().nullable()),
  Technologies: preprocessEmptyAsNull(z.string().optional().nullable()),
  "Annual Revenue": preprocessEmptyAsNull(z.coerce.number().optional().nullable()),
  "Total Funding": preprocessEmptyAsNull(z.coerce.number().optional().nullable()),
  "Latest Funding": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Latest Funding Amount": preprocessEmptyAsNull(z.coerce.number().optional().nullable()),
  "Last Raised At": preprocessEmptyAsNull(
    z.string().datetime({ offset: true }).optional().nullable()
  ),
  "Email Sent": preprocessEmptyAsNull(z.string().optional().nullable()),
  // Booleans might need specific handling if "" is present; coerce usually handles non-strict bools okay
  "Email Open": z.coerce.boolean().optional().nullable(),
  "Email Bounced": z.coerce.boolean().optional().nullable(),
  Replied: z.coerce.boolean().optional().nullable(),
  Demoed: z.coerce.boolean().optional().nullable(),
  "Number of Retail Locations": preprocessEmptyAsNull(z.coerce.number().optional().nullable()),
  "Apollo Contact Id": z.string(), // Required
  "Apollo Account Id": z.string(), // Required
  "Secondary Email": preprocessEmptyAsNull(z.string().email().optional().nullable()),
  "Secondary Email Source": preprocessEmptyAsNull(z.string().optional().nullable()),
  "Tertiary Email": preprocessEmptyAsNull(z.string().email().optional().nullable()),
  "Tertiary Email Source": preprocessEmptyAsNull(z.string().optional().nullable()),
});

export type ApolloContact = z.infer<typeof ApolloContactSchema>;
