import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { generateEmail } from "../services/ai";
import type { ApolloContact } from "../services/apollo/schema";
import { checkIfPersonWithEmailExistsInDb } from "../services/database";
import { logger } from "../services/logger";
import { fetchPersonProfile } from "../services/proxycurl";
import { uploadLeadsToSmartlead } from "../services/smartlead";

export type EmailPipeParams = {
  apolloContact: ApolloContact;
  campaignId: string;
  contactEmail: string;
};

export class EmailPipeWorkflow extends WorkflowEntrypoint<Env, EmailPipeParams> {
  async run(event: WorkflowEvent<EmailPipeParams>, step: WorkflowStep) {
    const { apolloContact, campaignId, contactEmail } = event.payload;

    const existingEmail = await step.do(
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
        const result = await checkIfPersonWithEmailExistsInDb(contactEmail);
        if (result.data.exists) {
          logger.info("Person with email already exists in database", {
            apolloContact,
            campaignId,
            contactEmail,
          });
          return {
            data: {
              exists: true,
            },
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }
        return {
          data: {
            exists: false,
          },
          success: true,
          error: null,
          shouldEndWorkflow: false,
        };
      }
    );

    const enrichedLinkedinProfile = await step.do(
      "enrich contact with linkedin profile",
      {
        retries: {
          limit: 3,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (existingEmail.shouldEndWorkflow) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }

        logger.info("Starting email analysis", { apolloContact, campaignId, contactEmail });
        const result = await fetchPersonProfile(apolloContact.Email);

        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false as const,
        };
      }
    );

    const personalisedEmailOne = await step.do(
      "use AI to write personalised email one",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (enrichedLinkedinProfile.shouldEndWorkflow) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true as const,
          };
        }

        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          campaignId,
          contactEmail,
        });

        const result = await generateEmail(apolloContact, 1, enrichedLinkedinProfile.data, []);

        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false as const,
        };
      }
    );

    const personalisedEmailTwo = await step.do(
      "use AI to write personalised email two",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (personalisedEmailOne.shouldEndWorkflow) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }

        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          campaignId,
          contactEmail,
        });
        const result = await generateEmail(apolloContact, 2, enrichedLinkedinProfile.data, [
          personalisedEmailOne.data,
        ]);

        if (!result.success) {
          logger.error("Error generating email", { error: result.error });
          return {
            data: null,
            success: false,
            error: result.error,
            shouldEndWorkflow: true as const,
          };
        }
        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false as const,
        };
      }
    );
    const personalisedEmailThree = await step.do(
      "use AI to write personalised email three",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (personalisedEmailTwo.shouldEndWorkflow || !personalisedEmailOne.data) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          campaignId,
          contactEmail,
        });
        const result = await generateEmail(apolloContact, 3, enrichedLinkedinProfile.data, [
          personalisedEmailOne.data,
          personalisedEmailTwo.data,
        ]);
        if (!result.success) {
          logger.error("Error generating email", { error: result.error });
          return {
            data: null,
            success: false,
            error: result.error,
            shouldEndWorkflow: false,
          };
        }
        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false,
        };
      }
    );
    const personalisedEmailFour = await step.do(
      "use AI to write personalised email four",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (
          personalisedEmailThree.shouldEndWorkflow ||
          !personalisedEmailOne.data ||
          !personalisedEmailTwo.data ||
          !personalisedEmailThree.data
        ) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          campaignId,
          contactEmail,
        });
        const result = await generateEmail(apolloContact, 4, enrichedLinkedinProfile.data, [
          personalisedEmailOne.data,
          personalisedEmailTwo.data,
          personalisedEmailThree.data,
        ]);
        if (!result.success) {
          logger.error("Error generating email", { error: result.error });
          return {
            data: null,
            success: false,
            error: result.error,
            shouldEndWorkflow: false,
          };
        }
        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false as const,
        };
      }
    );

    const personalisedEmailFive = await step.do(
      "use AI to write personalised email five",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (
          personalisedEmailFour.shouldEndWorkflow ||
          !personalisedEmailOne.data ||
          !personalisedEmailTwo.data ||
          !personalisedEmailThree.data ||
          !personalisedEmailFour.data
        ) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          campaignId,
          contactEmail,
        });
        const result = await generateEmail(apolloContact, 5, enrichedLinkedinProfile.data, [
          personalisedEmailOne.data,
          personalisedEmailTwo.data,
          personalisedEmailThree.data,
          personalisedEmailFour.data,
        ]);
        if (!result.success) {
          logger.error("Error generating email", { error: result.error });
          return {
            data: null,
            success: false,
            error: result.error,
            shouldEndWorkflow: false,
          };
        }
        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false as const,
        };
      }
    );

    const personalisedEmailSix = await step.do(
      "use AI to write personalised email six",
      {
        retries: {
          limit: 6,
          delay: "30 seconds",
          backoff: "exponential",
        },
        timeout: "30 minutes",
      },
      async () => {
        if (
          personalisedEmailFive.shouldEndWorkflow ||
          !personalisedEmailOne.data ||
          !personalisedEmailTwo.data ||
          !personalisedEmailThree.data ||
          !personalisedEmailFour.data ||
          !personalisedEmailFive.data
        ) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          campaignId,
          contactEmail,
        });
        const result = await generateEmail(apolloContact, 6, enrichedLinkedinProfile.data, [
          personalisedEmailOne.data,
          personalisedEmailTwo.data,
          personalisedEmailThree.data,
          personalisedEmailFour.data,
          personalisedEmailFive.data,
        ]);
        if (!result.success) {
          logger.error("Error generating email", { error: result.error });
          return {
            data: null,
            success: false,
            error: result.error,
            shouldEndWorkflow: false,
          };
        }
        return {
          data: result.data,
          success: true,
          error: null,
          shouldEndWorkflow: false as const,
        };
      }
    );

    const storeEmailsInDb = await step.do(
      "store emails in database",
      {
        retries: {
          limit: 3,
          delay: "2 seconds",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {
        if (
          personalisedEmailSix.shouldEndWorkflow ||
          !personalisedEmailOne.data ||
          !personalisedEmailTwo.data ||
          !personalisedEmailThree.data ||
          !personalisedEmailFour.data ||
          !personalisedEmailFive.data ||
          !personalisedEmailSix.data
        ) {
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        }
        logger.info("Attempting to store in database", { apolloContact, campaignId, contactEmail });
        return {
          data: "other",
          success: true,
          error: null,
          shouldEndWorkflow: false,
        };
      }
    );
    const updateContactWithEmailsGeneratedStatus = await step.do(
      "update contact with emails generated status",
      {
        retries: {
          limit: 3,
          delay: "2 seconds",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {
        if (storeEmailsInDb.shouldEndWorkflow)
          return {
            data: null,
            success: true,
            error: null,
            shouldEndWorkflow: true,
          };
        logger.info("Attempting to update contact", { apolloContact, campaignId, contactEmail });
        return {
          data: "other",
          success: true,
          error: null,
          shouldEndWorkflow: false,
        };
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
        if (
          updateContactWithEmailsGeneratedStatus.shouldEndWorkflow ||
          !personalisedEmailOne.data ||
          !personalisedEmailTwo.data ||
          !personalisedEmailThree.data ||
          !personalisedEmailFour.data ||
          !personalisedEmailFive.data ||
          !personalisedEmailSix.data
        )
          return {
            data: null,
            success: true,
          };
        logger.info("Attempting to sync contact with smart lead campaign", {
          apolloContact,
          campaignId,
          contactEmail,
        });
        await uploadLeadsToSmartlead(campaignId, [
          {
            ...apolloContact,
            ...enrichedLinkedinProfile.data,
            email1: personalisedEmailOne.data,
            email2: personalisedEmailTwo.data,
            email3: personalisedEmailThree.data,
            email4: personalisedEmailFour.data,
            email5: personalisedEmailFive.data,
            email6: personalisedEmailSix.data,
          },
        ]);
        return {
          data: "other",
          success: true,
          error: null,
          shouldEndWorkflow: false,
        };
      }
    );
  }
}
