import Papa from "papaparse";
import type { z } from "zod";
import { type ApolloContact, ApolloContactSchema } from "./services/apollo/schema";

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

export type SnakeCaseKeys<T> = T extends object
  ? T extends Array<infer U>
    ? Array<SnakeCaseKeys<U>>
    : { [K in keyof T as SnakeToCamelCase<K & string>]: SnakeCaseKeys<T[K]> }
  : T;

// Recursive function to convert keys to snake_case
export function convertToSnakeCase(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    return obj; // Return non-objects/null as is
  }

  if (Array.isArray(obj)) {
    // If it's an array, map over its elements and convert each one
    return obj.map(convertToSnakeCase);
  }

  // If it's an object, create a new object with snake_case keys
  const newObj: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert key to snake_case
      const snakeCaseKey = key
        .replace(/^[^a-zA-Z0-9]+/, "") // Remove leading non-alphanumeric chars
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2") // Insert _ before caps following caps (e.g., HTTPRequest -> HTTP_Request)
        .replace(/([a-z\d])([A-Z])/g, "$1_$2") // Insert _ before caps following lowercase/digit
        .replace(/[-\s]+/g, "_") // Replace spaces and hyphens with _
        .toLowerCase(); // Convert to lowercase

      // Recursively convert the value associated with the key
      newObj[snakeCaseKey] = convertToSnakeCase((obj as Record<string, unknown>)[key]);
    }
  }
  return newObj;
}

// Define the set of keys that should remain at the root level
const ROOT_KEYS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "company_name",
  "website",
  "location",
  "linkedin_profile",
  "company_url",
  // Add any other keys that should always be at the root
]);

/**
 * Converts object keys to snake_case and restructures the object,
 * moving keys not specified in ROOT_KEYS into a nested 'custom_fields' object.
 *
 * @param obj The input object.
 * @returns The restructured object.
 */
export function structureObjectWithCustomFields<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const snakeCasedObj = convertToSnakeCase(obj) as Record<string, unknown>;

  const rootObj: Record<string, unknown> = {};
  const customFieldsObj: Record<string, unknown> = {};

  for (const key in snakeCasedObj) {
    if (Object.prototype.hasOwnProperty.call(snakeCasedObj, key)) {
      if (ROOT_KEYS.has(key)) {
        rootObj[key] = snakeCasedObj[key];
      } else {
        customFieldsObj[key] = snakeCasedObj[key];
      }
    }
  }

  const result = { ...rootObj };
  if (Object.keys(customFieldsObj).length > 0) {
    result.custom_fields = customFieldsObj;
  }

  return result;
}

/**
 * Parses a CSV string into an array of ApolloContact objects.
 * Assumes CSV headers exactly match the keys in ApolloContactSchema.
 *
 * @param csvString The CSV content as a string.
 * @returns A promise that resolves with an array of parsed contacts or rejects with an error.
 */
export function parseContactsFromCsv(csvString: string): Promise<ApolloContact[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(csvString, {
      header: true, // Use the first row as headers
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Trim header whitespace
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
          // Reject with the first error message or a generic message
          return reject(new Error(results.errors[0]?.message || "Failed to parse CSV"));
        }

        // Validate each row against the schema
        const validatedContacts: ApolloContact[] = [];
        const validationErrors: { row: number; errors: z.ZodIssue[] }[] = [];

        results.data.forEach((row, index) => {
          // Filter out potential empty objects from PapaParse results
          if (
            Object.keys(row).length === 0 ||
            Object.values(row).every((v) => v === "" || v === null || v === undefined)
          ) {
            // Skip truly empty rows silently
            return;
          }
          const parsed = ApolloContactSchema.safeParse(row);
          if (parsed.success) {
            validatedContacts.push(parsed.data);
          } else {
            // Collect validation errors instead of rejecting immediately
            validationErrors.push({ row: index + 2, errors: parsed.error.issues }); // +2 because of header row and 0-based index
          }
        });

        // Log errors if any occurred, but don't reject the promise
        if (validationErrors.length > 0) {
          console.error(
            `CSV Validation Errors (${validationErrors.length} rows skipped):`,
            JSON.stringify(validationErrors, null, 2)
          );
          // Optionally, you could return more detailed info about errors here if needed by the caller
        }

        // Always resolve with the contacts that passed validation.
        // If validationErrors.length > 0 but validatedContacts is empty,
        // it means parsing succeeded but no rows met the schema criteria (or all valid rows were filtered out).
        // The calling function should handle the case where validatedContacts might be empty.
        if (
          validatedContacts.length === 0 &&
          results.data.filter(
            (r) =>
              Object.keys(r).length > 0 &&
              !Object.values(r).every((v) => v === "" || v === null || v === undefined)
          ).length > 0 // Check if there were non-empty rows to begin with
        ) {
          // Log if parsing seemed successful but yielded no valid contacts from non-empty input rows
          console.warn(
            "CSV parsing resulted in zero valid contacts after processing potentially invalid rows. Check validation errors above and ensure the file content matches the expected format."
          );
          // Still resolve with an empty array
        }

        resolve(validatedContacts);
      },
      error: (error: Error) => {
        console.error("CSV Parsing Failed Critically:", error);
        reject(error);
      },
    });
  });
}
