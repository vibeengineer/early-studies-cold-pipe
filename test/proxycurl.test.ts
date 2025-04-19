import { expect, test } from "vitest";
import { fetchPersonProfile } from "../src/services/proxycurl/index";

test("expect proxycurl to return a valid person profile", async () => {
  const profile = await fetchPersonProfile("https://www.linkedin.com/in/samducker/");
  console.log(profile);
  expect(profile).toBeDefined();
});
