import fs from "node:fs";
import { defineWorkersProject, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject(async () => {
  const migrations = await readD1Migrations("./src/database/migrations");
  const seedSql = fs.readFileSync("./src/database/seed.sql", "utf-8");

  return {
    test: {
      setupFiles: ["./test/setup/apply-migrations.ts", "./test/setup/seed-database.ts"],
      globals: true,
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
          isolatedStorage: false,
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations, SQL_SEED: seedSql },
          },
        },
      },
    },
  };
});
