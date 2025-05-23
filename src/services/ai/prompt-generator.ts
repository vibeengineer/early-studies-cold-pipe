import type { ApolloContact } from "../apollo/schema";
import type { LinkedinProfile } from "../proxycurl/schemas";
import { CONTEXT_ABOUT_EARLY_STUDIES_BUSINESS, KEY_CLIENTS_OF_EARLY_STUDIES } from "./constants";
import { getEmailSequenceGuidance } from "./email-templates";
import type { GenerateEmail } from "./types";
import { formatProfileForPrompt } from "./utils";

export const generatePrompt = (
  contactData: ApolloContact,
  enrichmentData: LinkedinProfile | null,
  sequenceNumber: number,
  previousEmails: GenerateEmail[] = []
) => {
  const emailGuidance = getEmailSequenceGuidance(sequenceNumber);

  if (typeof emailGuidance === "string") {
    console.error("Error generating prompt: Invalid sequence number.");
    return "Error: Invalid sequence number provided.";
  }

  const previousEmailsSummary =
    previousEmails.length > 0
      ? `PREVIOUS EMAILS SENT:\n${previousEmails
          .map(
            (email, index) =>
              `--- Email ${index + 1} ---\nSubject: ${email.subject}\nBody:\n${email.message}\n--- End Email ${index + 1} ---`
          )
          .join("\n\n")}`
      : "INFO: This is the very first email to this person.";

  const formattedProfile = formatProfileForPrompt(contactData);
  const formattedClients = KEY_CLIENTS_OF_EARLY_STUDIES.map((client) => `- ${client}`).join("\n");

  let enrichmentContext = "";
  const hasEnrichmentData = enrichmentData !== null;

  if (hasEnrichmentData) {
    const sections = [];

    if (enrichmentData.summary) {
      sections.push(`Profile Summary: ${enrichmentData.summary}`);
    }

    if (enrichmentData.experiences && enrichmentData.experiences.length > 0) {
      const currentExp = enrichmentData.experiences[0];
      sections.push(
        `Current Role: ${currentExp.title || "Unknown"} at ${currentExp.company || "Unknown"}`
      );
      if (currentExp.description) {
        sections.push(`Current Role Description: ${currentExp.description}`);
      }
    }

    if (enrichmentData.education && enrichmentData.education.length > 0) {
      const educationList = enrichmentData.education
        .map((edu) =>
          `${edu.degree_name || ""} ${edu.field_of_study || ""} at ${edu.school || ""}`.trim()
        )
        .filter(Boolean);
      if (educationList.length > 0) {
        sections.push(`Education: ${educationList.join("; ")}`);
      }
    }

    if (enrichmentData.skills && enrichmentData.skills.length > 0) {
      sections.push(`Skills: ${enrichmentData.skills.join(", ")}`);
    }

    if (sections.length > 0) {
      enrichmentContext = `\nADDITIONAL LINKEDIN ENRICHMENT DATA:\n---\n${sections.join("\n")}\n---\n`;
    }
  }

  const finalInstruction = hasEnrichmentData
    ? "Remember to personalize significantly using the PERSON CONTEXT fields and the ADDITIONAL LINKEDIN ENRICHMENT DATA if available."
    : "Remember to personalize significantly using the PERSON CONTEXT fields.";

  const promptText = `
You are an AI assistant simulating Sam Peskin, Founder of Early Studies. Your task is to draft a personalized outreach email based on the provided contact data.

GENERAL GUIDELINES FOR ALL EMAILS:
1. Review emails for anything sounding automated, templated, or AI-generated.
2. Use conversational, friendly language, but avoid over-familiarity (e.g., phrases like 'right up your alley'). Maintain professionalism.
3. Keep sentences/paragraphs short (2-3 sentences/paragraph max).
4. Include specific details showing knowledge of the recipient/industry. Do your research.
5. When matching our content/event themes to their interests, stick to broad topics like AI, automation, and data quality unless you find recent (past 3 months) evidence of specific interest (e.g., posts, positive comments). Do not guess or make assumptions.
6. Avoid perfect grammar; occasional sentence fragments or conversational structures are good.
7. Use simple, natural transitions.
8. Incorporate subtle, relevant personal details about Sam to sound human.
9. Ensure subject lines are brief, specific, and conversational.
10. Never use marketing buzzwords, jargon, or overly enthusiastic language.
11. Create variation between emails to different recipients using the same template.
12. When talking about industry trends be authoritative and come across like you have good industry knowledge.

TASK: Generate Email #${sequenceNumber} in the sequence.
OUTPUT FORMAT: You MUST output ONLY the subject line and the email body, matching the 'generateEmailSchema' (JSON with 'subject' and 'message' keys). DO NOT include any other text, greetings, or explanations before or after the JSON output.

PERSON CONTEXT (Recipient):
---
${formattedProfile}
---
${enrichmentContext}
COMPANY CONTEXT (Early Studies):
---
${CONTEXT_ABOUT_EARLY_STUDIES_BUSINESS}
---

KEY EARLY STUDIES CLIENTS (Mention ONLY if contextually relevant):
---
${formattedClients}
---

COMMUNICATION HISTORY:
---
${previousEmailsSummary}
---

SPECIFIC GUIDANCE FOR THIS EMAIL (${emailGuidance.title}):
---
Description: ${emailGuidance.description}

Key Instructions:
${emailGuidance.guidancePoints.map((point) => `- ${point}`).join("\n")}

Required Subject Line Template: ${emailGuidance.subjectLine}
(You MUST replace placeholders like '[their industry/field]' using the PERSON CONTEXT, particularly the Industry field if available.)

Example Structure (Use as a guide ONLY, personalize heavily based on PERSON CONTEXT):
--- START EXAMPLE ---
${emailGuidance.exampleStructure}
--- END EXAMPLE ---

FINAL INSTRUCTION: Generate the email content (subject and message) based on all the above. ${finalInstruction} Adhere strictly to the OUTPUT FORMAT. Replace all placeholders like [Name], [Title], [Company], [their industry/field], etc.
`;

  return promptText;
};
