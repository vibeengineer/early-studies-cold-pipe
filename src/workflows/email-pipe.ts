import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { ApolloContact } from "../services/apollo/schema";
import { logger } from "../services/logger";

export type EmailPipeParams = {
  apolloContact: ApolloContact;
  cleanupAfter: boolean;
};

/**
 * Workflow for processing and categorizing news headlines
 */
export class EmailPipeWorkflow extends WorkflowEntrypoint<Env, EmailPipeParams> {
  async run(event: WorkflowEvent<EmailPipeParams>, step: WorkflowStep) {
    const { apolloContact, cleanupAfter } = event.payload;

    // logger.info("Starting EmailPipeWorkflow", { apolloContact, cleanupAfter });

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
      async () => {}
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
        logger.info("Starting email analysis", { apolloContact, cleanupAfter });
        return "other";
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
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
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
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
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
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
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
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
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
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
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
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
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
        logger.info("Attempting to store in database", { apolloContact, cleanupAfter });
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
        logger.info("Attempting to update contact", { apolloContact, cleanupAfter });
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
        logger.info("Attempting to sync contact with smart lead campaign", {
          apolloContact,
          cleanupAfter,
        });
      }
    );
  }
}
