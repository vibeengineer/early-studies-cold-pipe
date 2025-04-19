import { env } from "cloudflare:test";

export async function seedDatabase() {
  const statements = env.SQL_SEED.split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
    .map((statement) => env.DB.prepare(`${statement};`));

  if (statements.length > 0) {
    const res = await env.DB.batch(statements);
  } else {
    throw new Error("No statements found in seed file.");
  }
}

await seedDatabase();
