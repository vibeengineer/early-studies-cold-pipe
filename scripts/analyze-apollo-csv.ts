import path from "path";
import minimist from "minimist";
import { analyzeApolloCsv } from "../src/services/apollo"; // Adjust path if needed

async function main() {
  const args = minimist(process.argv.slice(2));
  const dataArg = args.data;

  if (!dataArg || typeof dataArg !== "string") {
    console.error("Usage: pnpm run analyze --data=<filename.csv>");
    process.exit(1);
  }

  const csvFileName = dataArg;
  // Assuming data is in the same directory as the process script uses
  const dataFolderPath = path.resolve(__dirname, "..", "src", "services", "apollo", "data");
  const csvFilePath = path.join(dataFolderPath, csvFileName);

  console.log(`Analyzing file: ${csvFilePath}`);

  try {
    const contactsWithLinkedIn = await analyzeApolloCsv(csvFilePath);
    console.log(`Found ${contactsWithLinkedIn.length} contacts with LinkedIn URLs.`);
    // Optional: Log the contacts or save them to a file
    // console.log(contactsWithLinkedIn);
    // Example: Saving to a JSON file
    // import fs from 'fs/promises';
    // const outputPath = path.join(__dirname, '..', 'results', `${csvFileName}.linkedin.json`);
    // await fs.mkdir(path.dirname(outputPath), { recursive: true });
    // await fs.writeFile(outputPath, JSON.stringify(contactsWithLinkedIn, null, 2));
    // console.log(`Results saved to ${outputPath}`);
  } catch (error) {
    console.error("Error analyzing CSV:", error);
    process.exit(1);
  }
}

main();
