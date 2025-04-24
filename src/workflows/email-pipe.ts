import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js";
import { z } from "zod";
import { emails } from "../database/schema";
import { generateAllEmails, generateEmail } from "../services/ai";
import { type ApolloContact, ApolloContactSchema } from "../services/apollo/schema";
import {
  addPersonRecordToDB,
  checkIfPersonWithEmailExistsInDb,
  createEmails,
  updatePersonRecordInDB,
} from "../services/database";
import { getCampaignById } from "../services/database";
import { logger } from "../services/logger";
import { fetchPersonProfile, getProxycurlCreditBalance } from "../services/proxycurl";
import {
  createCampaign as createSmartleadCampaign,
  getCampaign as getSmartleadCampaign,
  uploadLeadsToSmartlead,
} from "../services/smartlead";

export type EmailPipeParams = {
  contact: ApolloContact;
  contactEmail: string;
  campaignId: string;
};

const workflowSchema = z.object({
  contact: ApolloContactSchema,
  contactEmail: z.string(),
  campaignId: z.string(),
});

export class EmailPipeWorkflow extends WorkflowEntrypoint<Env, EmailPipeParams> {
  async run(event: WorkflowEvent<EmailPipeParams>, step: WorkflowStep) {
    const { contact, contactEmail, campaignId } = event.payload;

    await step.do("validates all parameters and throws non retryable if missing", async () => {
      const result = workflowSchema.safeParse(event.payload);
      if (!result.success) {
        logger.error("Invalid parameters ending workflow", { error: result.error });
        throw new NonRetryableError("Invalid parameters");
      }
    });

    const campaign = await step.do(
      "checks the db and smartlead for a campaign id",
      {
        retries: {
          limit: 3,
          delay: "10 seconds",
          backoff: "exponential",
        },
        timeout: "2 minutes",
      },
      async () => {
        const [campaign, smartleadCampaign] = await Promise.all([
          getCampaignById(campaignId),
          getSmartleadCampaign(campaignId),
        ]);

        if (
          !campaign.data ||
          !smartleadCampaign.data ||
          campaign.data.smartleadCampaignId !== smartleadCampaign.data.id
        ) {
          logger.error("Campaign not found ending workflow");
          throw new NonRetryableError("Campaign not found");
        }

        return {
          smartleadCampaignId: smartleadCampaign.data.id,
          dbCampaignId: campaign.data.id,
        };
      }
    );

    const contactRecord = await step.do(
      "check database for existing record",
      {
        retries: {
          limit: 3,
          delay: "10 seconds",
          backoff: "exponential",
        },
        timeout: "2 minutes",
      },
      async () => {
        const { data } = await checkIfPersonWithEmailExistsInDb(contactEmail);

        if (data.exists) {
          if (!data.person) throw new NonRetryableError("Should never happen");
          if (
            data.person.syncedToSmartlead &&
            data.person.linkedinProfileFetched &&
            data.person.emailsWritten
          ) {
            logger.info(
              "Contact already synced to smartlead and has linkedin profile and emails written",
              {
                contactId: data.person.id,
              }
            );
            throw new NonRetryableError(
              "Contact already synced to smartlead and has linkedin profile and emails written"
            );
          }
          return data.person;
        }

        const person = await addPersonRecordToDB(contact);

        return person.data;
      }
    );

    const linkedInProfile = await step.do(
      "enrich contact with linkedin profile or return existing profile",
      {
        retries: {
          limit: 3,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (contactRecord.linkedinProfileFetched && contactRecord.proxycurlProfileJson) {
          return contactRecord.proxycurlProfileJson;
        }

        const creditBalance = await getProxycurlCreditBalance();

        if (creditBalance <= 0) {
          return null;
        }

        const result = await fetchPersonProfile(contact["Person Linkedin Url"]);
        await updatePersonRecordInDB(contactRecord.id, {
          proxycurlProfileJson: result.data,
          linkedinProfileFetched: true,
        });

        return result.data;
      }
    );

    const personalisedEmails = await step.do(
      "use AI to write personalised emails",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateAllEmails(
          contact,
          linkedInProfile ? linkedInProfile : undefined
        );

        if (!result.data || result.error) throw new Error("Failed to generate emails");

        const { data: emails, success } = await createEmails(result.data, campaign.dbCampaignId);

        if (!success) throw new Error("Failed to create emails");

        await updatePersonRecordInDB(contactRecord.id, {
          emailsWritten: true,
        });

        return emails;
      }
    );

    const syncContactWithSmartLeadCampaign = await step.do(
      "sync contact with smart lead campaign",
      {
        retries: {
          limit: 3,
          delay: "2 seconds",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {
        await uploadLeadsToSmartlead(campaign.smartleadCampaignId, [
          {
            first_name: contact["First Name"],
            last_name: contact["Last Name"],
            email: contactEmail,
            phone_number: contact["Mobile Phone"],
            company_name: contact["Company Name for Emails"],
            location: contact.City,
            custom_fields: {
              emailOneSubject: personalisedEmails[0].subject,
              emailOneMessage: personalisedEmails[0].message,
              emailTwoSubject: personalisedEmails[1].subject,
              emailTwoMessage: personalisedEmails[1].message,
              emailThreeSubject: personalisedEmails[2].subject,
              emailThreeMessage: personalisedEmails[2].message,
              emailFourSubject: personalisedEmails[3].subject,
              emailFourMessage: personalisedEmails[3].message,
              emailFiveSubject: personalisedEmails[4].subject,
              emailFiveMessage: personalisedEmails[4].message,
              emailSixSubject: personalisedEmails[5].subject,
              emailSixMessage: personalisedEmails[5].message,
            },
            linkedin_profile: contact["Person Linkedin Url"],
            company_url: contact.Website,
          },
        ]);

        await updatePersonRecordInDB(contactRecord.id, {
          syncedToSmartlead: true,
        });
      }
    );
  }
}
