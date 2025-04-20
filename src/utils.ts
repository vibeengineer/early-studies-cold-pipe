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
