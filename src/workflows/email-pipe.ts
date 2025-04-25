import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { z } from "zod";
import { generateEmail } from "../services/ai";
import { type ApolloContact, ApolloContactSchema } from "../services/apollo/schema";
import {
  addPersonRecordToDB,
  checkIfPersonWithEmailExistsInDb,
  createEmails,
  updatePersonRecordInDB,
} from "../services/database";
import { getCampaignById } from "../services/database";
import { logger } from "../services/logger";
import { getNeverbounceAccountInfo, verifyEmail } from "../services/neverbounce";
import { fetchPersonProfile, getProxycurlCreditBalance } from "../services/proxycurl";
import { getCampaign as getSmartleadCampaign, uploadLeadsToSmartlead } from "../services/smartlead";

export type EmailPipeParams = {
  contact: ApolloContact;
  contactEmail: string;
  smartleadCampaignId: number;
};

const workflowSchema = z.object({
  contact: ApolloContactSchema,
  contactEmail: z.string(),
  smartleadCampaignId: z.number(),
});

export class EmailPipeWorkflow extends WorkflowEntrypoint<Env, EmailPipeParams> {
  async run(event: WorkflowEvent<EmailPipeParams>, step: WorkflowStep) {
    const validatedParams = await step.do(
      "validates all parameters and throws non retryable if missing",
      async () => {
        const result = workflowSchema.safeParse(event.payload);
        if (!result.success) {
          throw new NonRetryableError("Invalid parameters");
        }
        return result.data;
      }
    );

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
          getCampaignById(validatedParams.smartleadCampaignId),
          getSmartleadCampaign(validatedParams.smartleadCampaignId),
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
        const { data } = await checkIfPersonWithEmailExistsInDb(validatedParams.contactEmail);

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

            if (data.person.emailHasBeenChecked && !data.person.emailIsValid)
              throw new NonRetryableError("Email is invalid skipping record");
            throw new NonRetryableError(
              "Contact already synced to smartlead and has linkedin profile and emails written"
            );
          }
          return data.person;
        }

        const person = await addPersonRecordToDB(validatedParams.contact);

        return person.data;
      }
    );

    await step.do(
      "check email is valid with neverbounce",
      {
        retries: {
          limit: 3,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const haveNeverbounceCredits = await getNeverbounceAccountInfo();
        if (!haveNeverbounceCredits.success)
          throw new NonRetryableError("No neverbounce credits remaining");
        const valid = await verifyEmail(validatedParams.contactEmail);
        await updatePersonRecordInDB(contactRecord.id, {
          emailIsValid: valid.success,
          emailHasBeenChecked: true,
        });
        if (!valid.success) throw new NonRetryableError("Email is invalid");
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
        const result = await fetchPersonProfile(validatedParams.contact["Person Linkedin Url"]);
        if (!result.success) return null;
        await updatePersonRecordInDB(contactRecord.id, {
          proxycurlProfileJson: result.data,
          linkedinProfileFetched: true,
        });

        return result.data;
      }
    );

    const email1 = await step.do(
      "write email one with ai",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateEmail(
          validatedParams.contact,
          1,
          [],
          linkedInProfile ? linkedInProfile : undefined
        );
        await createEmails(
          [
            {
              message: result.data.message,
              subject: result.data.subject,
              sequenceNumber: 1,
            },
          ],
          campaign.smartleadCampaignId
        );
        return result.data;
      }
    );

    const email2 = await step.do(
      "write email two with ai",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateEmail(
          validatedParams.contact,
          2,
          [email1],
          linkedInProfile ? linkedInProfile : undefined
        );
        await createEmails(
          [
            {
              message: result.data.message,
              subject: result.data.subject,
              sequenceNumber: 2,
            },
          ],
          campaign.smartleadCampaignId
        );
        return result.data;
      }
    );

    const email3 = await step.do(
      "write email three with ai",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateEmail(
          validatedParams.contact,
          3,
          [email1, email2],
          linkedInProfile ? linkedInProfile : undefined
        );
        await createEmails(
          [
            {
              message: result.data.message,
              subject: result.data.subject,
              sequenceNumber: 3,
            },
          ],
          campaign.smartleadCampaignId
        );
        return result.data;
      }
    );

    const email4 = await step.do(
      "write email four with ai",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateEmail(
          validatedParams.contact,
          4,
          [email1, email2, email3],
          linkedInProfile ? linkedInProfile : undefined
        );
        await createEmails(
          [
            {
              message: result.data.message,
              subject: result.data.subject,
              sequenceNumber: 4,
            },
          ],
          campaign.smartleadCampaignId
        );
        return result.data;
      }
    );

    const email5 = await step.do(
      "write email five with ai",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateEmail(
          validatedParams.contact,
          5,
          [email1, email2, email3, email4],
          linkedInProfile ? linkedInProfile : undefined
        );
        await createEmails(
          [
            {
              message: result.data.message,
              subject: result.data.subject,
              sequenceNumber: 5,
            },
          ],
          campaign.smartleadCampaignId
        );
        return result.data;
      }
    );

    const email6 = await step.do(
      "write email six with ai",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        const result = await generateEmail(
          validatedParams.contact,
          6,
          [email1, email2, email3, email4, email5],
          linkedInProfile ? linkedInProfile : undefined
        );
        await createEmails(
          [
            {
              message: result.data.message,
              subject: result.data.subject,
              sequenceNumber: 6,
            },
          ],
          campaign.smartleadCampaignId
        );

        await updatePersonRecordInDB(contactRecord.id, {
          emailsWritten: true,
        });

        return result.data;
      }
    );

    await step.do(
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
        if (contactRecord.syncedToSmartlead) {
          console.log("Contact already synced to smartlead");
          return;
        }
        await uploadLeadsToSmartlead(campaign.smartleadCampaignId, [
          {
            first_name: validatedParams.contact["First Name"],
            last_name: validatedParams.contact["Last Name"],
            email: validatedParams.contactEmail,
            phone_number: validatedParams.contact["Mobile Phone"],
            company_name: validatedParams.contact["Company Name for Emails"],
            location: validatedParams.contact.City,
            custom_fields: {
              emailOneSubject: email1.subject,
              emailOneMessage: email1.message,
              emailTwoSubject: email2.subject,
              emailTwoMessage: email2.message,
              emailThreeSubject: email3.subject,
              emailThreeMessage: email3.message,
              emailFourSubject: email4.subject,
              emailFourMessage: email4.message,
              emailFiveSubject: email5.subject,
              emailFiveMessage: email5.message,
              emailSixSubject: email6.subject,
              emailSixMessage: email6.message,
            },
            linkedin_profile: validatedParams.contact["Person Linkedin Url"],
            company_url: validatedParams.contact.Website,
          },
        ]);

        await updatePersonRecordInDB(contactRecord.id, {
          syncedToSmartlead: true,
        });

        logger.info("Contact synced to smartlead", {
          contactId: contactRecord.id,
        });
      }
    );
  }
}
