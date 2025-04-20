import type { ApolloContact } from "../apollo/schema";
import type { LinkedinProfile } from "../proxycurl/schemas";

export const formatProfileForPrompt = (contact: ApolloContact): string => {
  let profileSummary = `Name: ${contact["First Name"] || ""} ${contact["Last Name"] || ""}\n`;
  if (contact.Title) profileSummary += `Title: ${contact.Title}\n`;
  if (contact.Company) profileSummary += `Company: ${contact.Company}\n`;
  profileSummary += `LinkedIn: ${contact["Person Linkedin Url"]}\n`; // LinkedIn URL is required in schema
  if (contact.City || contact.State || contact.Country) {
    profileSummary += `Location: ${[contact.City, contact.State, contact.Country].filter(Boolean).join(", ")}\n`;
  }
  if (contact.Industry) profileSummary += `Industry: ${contact.Industry}\n`;
  if (contact.Keywords) profileSummary += `Keywords: ${contact.Keywords}\n`;
  return profileSummary.trim();
};

export const extractPersonalizationData = (contact: ApolloContact, profile: LinkedinProfile) => {
  const industryOrField =
    contact.Industry || (profile.industry ?? "") || contact.Title || "your field";

  const currentRole = contact.Title || profile.headline || "your role";

  const company = contact.Company || "your company";

  const firstName = contact["First Name"] || profile.first_name || "there";
  const fullName =
    `${contact["First Name"] || profile.first_name || ""} ${contact["Last Name"] || profile.last_name || ""}`.trim();

  const currentExperience =
    profile.experiences && profile.experiences.length > 0 ? profile.experiences[0] : null;

  const education =
    profile.education && profile.education.length > 0
      ? profile.education.map((edu) => edu.school).join(", ")
      : "";

  return {
    industryOrField,
    currentRole,
    company,
    firstName,
    fullName,
    currentExperience,
    education,
    skills: profile.skills || [],
  };
};

export const buildPersonalizedContent = (
  personalData: ReturnType<typeof extractPersonalizationData>
): string => {
  let personalizedContent = "";

  if (personalData.currentExperience?.description) {
    personalizedContent += `I noticed your work with ${personalData.company} where you've focused on ${personalData.currentExperience.description.substring(0, 100)}... `;
  } else if (personalData.skills && personalData.skills.length > 0) {
    personalizedContent += `Your expertise in ${personalData.skills.slice(0, 3).join(", ")} caught my attention. `;
  }

  // Add reference to education if available
  if (personalData.education) {
    personalizedContent += `Your educational background from ${personalData.education} provides a strong foundation for your current work. `;
  }

  return (
    personalizedContent ||
    `I came across your profile and was particularly interested in your work in ${personalData.industryOrField}.`
  );
};
