import { promises as fs } from "node:fs";
import { env } from "cloudflare:workers";
import { RateLimiter } from "limiter";
import Papa from "papaparse";
import type { ApolloContact } from "./schema";
import { ApolloContactSchema } from "./schema";

// Allow 50 requests per 5 seconds
const limiter = new RateLimiter({ tokensPerInterval: 50, interval: 5000 });

export async function queueApolloContact(contact: ApolloContact) {
  try {
    await env.QUEUE.send(contact);
    return {
      success: true,
      error: null,
      data: null,
    };
  } catch (error: unknown) {
    console.error("Error queuing contact:", contact.Email, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

export async function processApolloCsv(csvPath: string) {
  try {
    const fileContent = await fs.readFile(csvPath, "utf-8");

    const parseResult = Papa.parse<Record<string, unknown>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors);
      throw new Error("Failed to parse CSV file.");
    }

    const rawContacts = parseResult.data;
    console.log(`Found ${rawContacts.length} potential contacts in the CSV.`);

    let validationSkippedCount = 0;
    let successfullyQueuedCount = 0;
    let queueFailedCount = 0;
    const queuePromises = [];

    for (const rawContact of rawContacts) {
      const validationResult = ApolloContactSchema.safeParse(rawContact);

      if (!validationResult.success) {
        validationSkippedCount++;
        // Optional: Log specific validation errors for debugging
        // console.warn(`Skipping contact due to validation errors: ${validationResult.error.flatten().fieldErrors}`);
        // console.warn('Raw data:', rawContact);
        continue; // Skip this contact
      }

      // Validation passed, proceed with queueing
      const validContact = validationResult.data;

      // Wait for the limiter
      await limiter.removeTokens(1);
      // console.log(`Processing contact: ${validContact.Email}`); // Log moved to queue function
      queuePromises.push(
        queueApolloContact(validContact).then((result) => {
          // Return a combined result for easier tracking in Promise.allSettled
          return { ...result, contactEmail: validContact.Email };
        })
      );
    }

    const results = await Promise.allSettled(queuePromises);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        successfullyQueuedCount++;
      } else {
        queueFailedCount++;
        const email =
          result.status === "fulfilled" ? result.value.contactEmail : "unknown (promise rejected)";
        const errorReason = result.status === "rejected" ? result.reason : result.value.error;
        console.error(`Failed to queue contact ${email}:`, errorReason);
      }
    }

    console.log("--- Processing Summary ---");
    console.log(`Total rows parsed: ${rawContacts.length}`);
    console.log(`Skipped (validation failed): ${validationSkippedCount}`);
    console.log(`Attempted to queue: ${queuePromises.length}`);
    console.log(`Successfully queued: ${successfullyQueuedCount}`);
    console.log(`Failed to queue: ${queueFailedCount}`);
    console.log("--------------------------");

    if (queueFailedCount > 0) {
      // Optional: Throw error only if queueing fails, not validation skips
      throw new Error(`${queueFailedCount} contacts failed during the queueing process.`);
    }
  } catch (error) {
    console.error(`Error processing CSV file ${csvPath}:`, error);
    throw error; // Re-throw the error to be caught by the calling script
  }
}

/**
 * Reads an Apollo CSV file and returns contacts that have a Person Linkedin Url.
 * @param csvPath The path to the CSV file.
 * @returns A promise that resolves to an array of ApolloContact objects with LinkedIn URLs.
 */
export async function analyzeApolloCsv(csvPath: string): Promise<ApolloContact[]> {
  try {
    const fileContent = await fs.readFile(csvPath, "utf-8");

    // Parse into generic records first
    const parseResult = Papa.parse<Record<string, unknown>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Consistent parsing approach
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors);
      // Optionally log only the first few errors
      // console.error('First parsing error:', parseResult.errors[0]);
      throw new Error("Failed to parse CSV file during analysis.");
    }

    const potentialContacts = parseResult.data;
    console.log(`Total potential contacts found for analysis: ${potentialContacts.length}`);

    // Assuming the column header is exactly "Person Linkedin Url"
    const linkedInUrlHeader = "Person Linkedin Url";

    const contactsWithLinkedIn: ApolloContact[] = [];
    for (const contactData of potentialContacts) {
      const url = contactData[linkedInUrlHeader];
      // Check if the URL exists and is a non-empty string
      if (typeof url === "string" && url.trim() !== "") {
        // We found a LinkedIn URL, now we can potentially treat/cast it
        // as ApolloContact if needed downstream, or just return the subset.
        // For now, let's assume the structure matches ApolloContact for the return type.
        // A safer approach might be to return Partial<ApolloContact>[] or a custom type.
        contactsWithLinkedIn.push(contactData as ApolloContact);
      }
    }

    return contactsWithLinkedIn;
  } catch (error) {
    console.error(`Error analyzing CSV file ${csvPath}:`, error);
    throw error; // Re-throw the error to be caught by the calling script
  }
}
