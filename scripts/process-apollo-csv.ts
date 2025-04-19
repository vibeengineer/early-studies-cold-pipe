import path from "path";
import minimist from "minimist";
import { processApolloCsv } from "../src/services/apollo"; // Adjust path if needed

async function main() {
  const args = minimist(process.argv.slice(2));
  const dataArg = args.data;

  if (!dataArg || typeof dataArg !== "string") {
    console.error("Usage: pnpm run process --data=<filename.csv>");
    process.exit(1);
  }

  const csvFileName = dataArg;
  const dataFolderPath = path.resolve(__dirname, "..", "src", "services", "apollo", "data"); // Adjust relative path as needed
  const csvFilePath = path.join(dataFolderPath, csvFileName);

  console.log(`Processing file: ${csvFilePath}`);

  try {
    await processApolloCsv(csvFilePath);
    console.log("Successfully processed CSV.");
  } catch (error) {
    console.error("Error processing CSV:", error);
    process.exit(1);
  }
}

main();
