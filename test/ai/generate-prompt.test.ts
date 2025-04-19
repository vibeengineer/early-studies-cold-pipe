import { describe, expect, it } from "vitest";
import { generatePrompt } from "../../src/services/ai/prompt-generator";
import { MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE } from "../mocks/person";

const MOCK_PREVIOUS_EMAILS = [
  {
    subject: "IIEX in DC next week - will you be there?",
    message: `I'm heading to the IIEX Conference in DC next week (Apr 30-May 1) and was looking at folks doing interesting work in media analytics when I came across your profile. I'm the co-founder of Early Studies – we focus on understanding the 'why' behind audience behavior and social trends, often using methods that get around typical survey biases.

Given your work leading Insights & Analytics at Fox News Media, especially around audience intelligence and predictive modeling, I thought our approach to uncovering social narratives might resonate.

Are you planning to be at IIEX by any chance? If you are and have a spare 15 minutes, I'd love to grab a quick coffee. Curious to hear how you're tackling cross-platform measurement these days.

No worries if you're not making it to DC this time. I'd still be keen to connect briefly sometime virtually if you're open to it – seems like we're both digging into how people engage with media, just from different angles.

Best,
Sam 
`,
  },
  {
    subject: "Quick follow-up re: IIEX Conference",
    message: `Hi Jennifer,

Just a quick note as IIEX in DC is almost here - following up on my email last week. Any chance you'll be attending?

I noticed a track focused on advanced audience analytics and cross-platform measurement. Given your work leading insights at Fox News Media, especially with predictive modeling, thought some of those discussions might be right up your alley.

I'll likely be floating around near the main stage area between sessions if you happen to be there and have a spare moment for a quick hello. If DC isn't in the cards this year, no problem at all - maybe a quick virtual chat sometime after the conference wraps?

Best,
Sam`,
  },
  {
    subject: "Thoughts after IIEX + cross-platform audience insights",
    message: `
    Hi Jennifer,

Hope you're recovering from IIEX! Whether we managed to connect or just passed each other in the whirlwind, I wanted to share a quick thought.

That session with Dr. Anya Sharma on predictive models for cross-platform news engagement really stuck with me. Her point about the increasing fragmentation of audience attention and the challenge of building truly unified measurement felt spot-on, especially thinking about the scale you operate at with Fox News Media.

It echoes some of what we see in our work at Early Studies – how underlying social narratives often drive where and how people engage with content, sometimes in ways standard metrics don't immediately capture. Understanding those deeper patterns seems crucial for predicting shifts.

I jotted down some notes comparing different approaches to modeling audience behavior across platforms – happy to share them if that's useful for your work in insights and analytics. No polished deck, just some raw thoughts.

Anyway, hope the rest of your week goes well.

Best,
Sam
    `,
  },
];

describe("generatePrompt", () => {
  it("should generate a valid prompt for initial email (sequence 1)", async () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 1, []);
    console.log(prompt);
    expect(prompt).toBeDefined();
  });

  it("should generate a valid prompt for follow-up email (sequence 2)", () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 2, [
      MOCK_PREVIOUS_EMAILS[0],
    ]);

    console.log(`\n--- Generated Prompt for Email 2 ---\n${prompt}`);

    expect(prompt).toBeDefined();
  });

  it("should generate a valid prompt for post-conference email (sequence 3)", () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 3, [
      MOCK_PREVIOUS_EMAILS[0],
      MOCK_PREVIOUS_EMAILS[1],
    ]);

    console.log(`\n--- Generated Prompt for Email 3 ---\n${prompt}`);

    expect(prompt).toBeDefined();
  });

  it("should generate a valid prompt for Gen Z Research offer email (sequence 4)", () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 4, [
      MOCK_PREVIOUS_EMAILS[0],
      MOCK_PREVIOUS_EMAILS[1],
      MOCK_PREVIOUS_EMAILS[2],
    ]);

    console.log(`\n--- Generated Prompt for Email 4 ---\n${prompt}`);

    expect(prompt).toBeDefined();
  });

  it("should generate a valid prompt for case study email (sequence 5)", () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 5, [
      MOCK_PREVIOUS_EMAILS[0],
      MOCK_PREVIOUS_EMAILS[1],
      MOCK_PREVIOUS_EMAILS[2],
    ]);

    console.log(`\n--- Generated Prompt for Email 5 ---\n${prompt}`);

    expect(prompt).toBeDefined();
  });

  it("should generate a valid prompt for final break email (sequence 6)", () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 6, [
      MOCK_PREVIOUS_EMAILS[0],
      MOCK_PREVIOUS_EMAILS[1],
      MOCK_PREVIOUS_EMAILS[2],
    ]);

    console.log(`\n--- Generated Prompt for Email 6 ---\n${prompt}`);

    expect(prompt).toBeDefined();
  });

  it("should handle an invalid sequence number gracefully", () => {
    const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 7, []);

    console.log(`\n--- Generated Prompt for Invalid Sequence ---\n${prompt}`);

    expect(prompt).toBeDefined();
  });

  // it("should include enrichment data in the prompt when available", () => {
  //   const prompt = generatePrompt(MOCK_APOLLO_CONTACT, MOCK_ENRICHMENT_PERSON_PROFILE, 1, []);

  //   console.log(`\n--- Generated Prompt with Enrichment Data ---\n${prompt}`);
  // });

  // it("should handle null enrichment data gracefully", () => {
  //   const prompt = generatePrompt(MOCK_APOLLO_CONTACT, null, 1, []);

  //   console.log(`\n--- Generated Prompt without Enrichment Data ---\n${prompt}`);

  //   expect(prompt).toBeDefined();
  // });
});
