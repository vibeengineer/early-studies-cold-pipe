import { differenceInDays } from "date-fns";
import { DATE_OF_IEX } from "./constants";
import type { EmailGuidance } from "./types";

export const getEmailSequenceGuidance = (numberInSequence = 1): EmailGuidance | string => {
  const TODAYS_DATE = new Date();
  const daysTillIex = differenceInDays(DATE_OF_IEX, TODAYS_DATE);

  // Email 1: Initial Contact About Meeting at IIEX Conference
  const initial: EmailGuidance = {
    title: "Email 1: Initial Contact About Meeting at IIEX Conference",
    description: `Create an initial outreach email from Sam Peskin (CEO and cofounder of Early Studies) to [recipient_name], [recipient_title] at [recipient_company]. Sam is attending the IIEX Conference in Washington DC on April 30-May 1 and wants to connect with experienced research professionals who might be interested in innovative methodologies, without assuming they'll be at the conference.`,
    guidancePoints: [
      "Feel like a personal note from one research professional to another.",
      "Briefly mention Early Studies' focus on [personalized_research_area_relevant_to_recipient].",
      "Inquire if they're attending the conference, and if so, suggest a brief meeting.",
      "Include a value proposition for connecting even if they're not attending.",
      "Be conversational and informal in tone.",
      "Be concise (3-4 short paragraphs maximum).",
      "Avoid marketing language, jargon, or anything that sounds AI-written.",
      "Include a casual sign-off that feels human.",
      "Fill in all bracketed placeholders.",
    ],
    subjectLine: "IIEX in DC next week - will you be there?",
    exampleStructure: `
Subject: IIEX in DC next week - will you be there?

Hi [recipient_name],

I'm heading to the IIEX Conference in DC next week and was looking through attendee backgrounds when I came across your profile. I'm the co-founder of Early Studies, where we've been developing some interesting approaches to [personalized_research_area_relevant_to_recipient] that seem relevant to the consumer insights work you're leading at [recipient_company].

Are you planning to attend IIEX this year? If so, I'd love to grab coffee between sessions if you have 15 minutes. I'm particularly interested in hearing about [specific interest based on recipient profile].

If you're not making it to DC this time, I'd still be happy to connect virtually sometime - I've been following [mention something specific about their work/company], and it looks like we're tackling similar questions from different angles.

Cheers,
Sam
`,
  };

  // Email 2: Follow-up Reminder About the Conference
  const followUp: EmailGuidance = {
    title: "Email 2: Follow-up Reminder About the Conference",
    description:
      "Create a brief follow-up email from Sam Peskin to [recipient_name] who hasn't responded to the initial outreach about the IIEX Conference. The conference is now just a few days away. This email should work whether or not the recipient is planning to attend.",
    guidancePoints: [
      "Be extremely brief (2-3 short paragraphs at most).",
      "Reference the previous email without sounding pushy.",
      "Mention a specific session or topic at IIEX that connects to their professional interests (e.g., research automation, Gen Z engagement).",
      "Offer flexibility for meeting if they are attending, or suggest a brief call after the conference if they're not.",
      "Include a personal touch that makes it clear this isn't an automated follow-up (e.g., reference specific work).",
      "Avoid any language that could be perceived as pressuring or sales-oriented.",
      "Fill in all bracketed placeholders.",
    ],
    subjectLine: "Quick follow-up re: IIEX Conference",
    exampleStructure: `
Subject: Quick follow-up re: IIEX Conference

Hi [recipient_name],

Just a quick note as IIEX approaches next week - wondering if you'll be there? I'm particularly looking forward to the [specific session/topic] session that seems aligned with [reference their work/interests].

I'll be [mention your availability/location, e.g., at the Innovations Showcase from 2-4pm on Wednesday] if you're around and have time for a quick hello. And if you're not making it to DC this year, I'd still be interested in hearing your thoughts on [mention relevant Early Studies topic] - perhaps a brief call in May?

All the best,
Sam
`,
  };

  // Email 3: Post-Conference Follow-up Sharing Insights
  const postIexEmail: EmailGuidance = {
    title: "Email 3: Post-Conference Follow-up Sharing Insights",
    description:
      "Create a post-conference follow-up email from Sam Peskin to [recipient_name] after the IIEX Conference. The email should work for both people Sam met and those he didn't manage to connect with.",
    guidancePoints: [
      "Include a specific observation or insight from the conference that would be relevant to [recipient_name]'s role and industry.",
      "Briefly mention something Sam learned that relates to Early Studies' work.",
      "Reference a specific speaker or session in a way that shows Sam actually attended (e.g., 'That panel discussion with Maria Chen...').",
      "Include a natural transition to suggest continuing the conversation.",
      "Offer to share some relevant research findings or notes without being pushy ('happy to share them if it's relevant').",
      "End with a casual, friendly closing.",
      "Avoid marketing language or anything that sounds templated.",
      "Fill in all bracketed placeholders.",
    ],
    subjectLine: "Thoughts after IIEX + [specific_conference_topic]",
    exampleStructure: `
Subject: Thoughts after IIEX + [specific_conference_topic, e.g., that surprising Gen Z panel]

Hi [recipient_name],

Whether we managed to connect at IIEX or not (the conference was a bit of a whirlwind this year!), I wanted to share a quick thought that might interest you.

That panel discussion with [Specific Speaker] on [Specific Topic] really hit home. Their point about [Specific Point] aligns with what we've been seeing in our own research. I was particularly struck by the data showing [Specific Data Point, e.g., a 34% increase in engagement...].

I made some rough notes on [Related Topic] - happy to share them if it's relevant to what you're working on at [recipient_company]. No fancy presentation, just some observations that might save you time.

Enjoy the rest of your week,
Sam
`,
  };

  // Email 4: Offering Access to Gen Z Research Data
  const dropGenZEmail: EmailGuidance = {
    title: "Email 4: Offering Access to Gen Z Research Data",
    description:
      "Create an email from Sam Peskin offering to share some valuable Gen Z research data with [recipient_name]. This should not be a sales email but rather a genuine offer to share useful insights with a fellow research professional.",
    guidancePoints: [
      "Reference a recent industry development or news item relevant to [recipient_company].",
      "Mention a specific data point or finding from Early Studies' research that connects to this news (e.g., '72% of our Gen Z panel said...').",
      "Offer to share more detailed findings that might help their team ('Happy to share it if it would be helpful...').",
      "Include a personal note or question that encourages response ('How's the new initiative being received so far?').",
      "Be written in a casual, helpful tone as one professional to another.",
      "Avoid marketing language, CTAs, or anything that sounds like a sales pitch.",
      "Be relatively brief (3-4 paragraphs).",
      "Fill in all bracketed placeholders.",
    ],
    subjectLine: "Interesting Gen Z data point you might find useful",
    exampleStructure: `
Subject: Interesting Gen Z data point you might find useful

Hi [recipient_name],

I came across [mention recent news/article about recipient_company or industry] yesterday - looks like an interesting direction, especially with [mention specific aspect].

It reminded me of some research we just wrapped up at Early Studies on [related research topic]. One finding surprised us: [Specific Data Point, e.g., 72% of our Gen Z panel said they actively research...].

We've compiled the full dataset showing [mention dataset details]. Happy to share it if it would be helpful for your team's work on [relate to their initiative].

How's [mention their initiative or a related topic] being received so far? Always curious to hear how these campaigns are landing in the real world.

Best,
Sam
`,
  };

  // Email 5: Sharing a Relevant Case Study with Results
  const caseStudyEmail: EmailGuidance = {
    title: "Email 5: Sharing a Relevant Case Study with Results",
    description:
      "Create an email from Sam Peskin sharing a relevant case study with [recipient_name]. The case study should relate to a challenge that [recipient_company] likely faces based on their industry and recent news.",
    guidancePoints: [
      "Begin with a personal touch or reference to previous communication (if any).",
      "Briefly describe a challenge that a similar company (unnamed) faced.",
      "Outline 1-2 key approaches used to address the challenge.",
      "Mention 1-2 specific, quantifiable results (e.g., 'response rate jumped to 18%').",
      "Offer to share more details in a conversation rather than including them all in the email.",
      "Ask a question about [recipient_name]'s experience with similar challenges.",
      "Use natural, conversational language throughout.",
      "Be concise and focused on value rather than selling.",
      "Fill in all bracketed placeholders.",
    ],
    subjectLine: "Quick case study: [relevant_topic] for [recipient_industry]",
    exampleStructure: `
Subject: Quick case study: [relevant_topic, e.g., declining survey response rates] in [recipient_industry, e.g., retail]

Hi [recipient_name],

Hope your [mention timely event, e.g., Q2 planning] is going smoothly. I remembered our brief chat about [mention topic] when I was reviewing a project we just completed.

We worked with a [company type, e.g., retailer] (similar size to [recipient_company]) that was seeing [describe challenge, e.g., steadily declining response rates on their post-purchase surveys].

We helped them redesign their approach using [describe approach 1] and [describe approach 2]. The most effective change was [mention key change].

[Time frame, e.g., Six weeks in], their [metric 1] [result 1, e.g., response rate jumped to 18%], and they were [result 2, e.g., capturing input from...].

Have you been experimenting with anything similar at [recipient_company]? I'm curious if you've found other approaches that work well.

Cheers,
Sam
`,
  };

  // Email 6: "Break" Email Mentioning International Travel
  const final: EmailGuidance = {
    title: 'Email 6: "Break" Email Mentioning International Travel',
    description:
      'Create a casual "break" email from Sam Peskin mentioning upcoming international travel to [recipient_name]. This should feel like a genuine update rather than a sales tactic.',
    guidancePoints: [
      "Be extremely brief and conversational (2-3 short paragraphs).",
      "Mention upcoming travel to a specific international location for a research-related purpose.",
      "Include a genuine question or observation related to [recipient_company] or [recipient_name]'s professional interests.",
      "Reference something timely (season, industry event, etc.).",
      "Feel like a personal note rather than a marketing email.",
      "Avoid any direct sales language or calls to action.",
      "End with a casual sign-off that feels authentic.",
      "Fill in all bracketed placeholders.",
    ],
    subjectLine: "Quick hello before heading to [international_location]",
    exampleStructure: `
Subject: Quick hello before heading to [international_location]

Hi [recipient_name],

Just wanted to drop a quick note before I head to [international_location] next week for [mention research purpose, e.g., some research work with a few European CPG brands]. I'll be looking at [mention specific focus].

I noticed [mention observation related to recipient company/interest, e.g., Acme just launched that new product line...]. Have you found [ask genuine question related to observation]?

Enjoy the [mention timely thing, e.g., start of summer] - I'll be back stateside [mention return time, e.g., mid-June].

Cheers,
Sam
`,
  };

  // Return the appropriate guidance object based on the sequence number
  switch (numberInSequence) {
    case 1:
      return initial;
    case 2:
      return followUp;
    case 3:
      return postIexEmail;
    case 4:
      return dropGenZEmail;
    case 5:
      return caseStudyEmail;
    case 6:
      return final;
    default:
      // Consider throwing an error or returning a more specific error object
      return "Invalid sequence number provided.";
  }
};
