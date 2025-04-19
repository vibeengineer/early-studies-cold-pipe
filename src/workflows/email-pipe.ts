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

    logger.info("Starting EmailPipeWorkflow", { apolloContact, cleanupAfter });

    // Step 1: Check if headline exists
    const existingEmail = await step.do(
      "check database for existing record",
      {
        retries: {
          limit: 3,
          delay: "1 second",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {}
    );

    const enrichedEmail = await step.do(
      "enrich email",
      {
        retries: {
          limit: 3,
          delay: "5 seconds",
          backoff: "exponential",
        },
        timeout: "1 minute",
      },
      async () => {
        logger.info("Starting email analysis", { apolloContact, cleanupAfter });
        return "other";
      }
    );

    const personRecord = await step.do(
      "use AI to generate a structured person record",
      {
        retries: {
          limit: 3,
          delay: "1 second",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {
        logger.info("Attempting use gemini ai to generate a structured person record", {
          apolloContact,
          cleanupAfter,
        });
      }
    );

    const personalisedEmails = await step.do(
      "use AI to write personalised emails",
      {
        retries: {
          limit: 3,
          delay: "1 second",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {
        logger.info("Attempting use gemini ai to write personalised emails", {
          apolloContact,
          cleanupAfter,
        });
      }
    );

    const storedInDb = await step.do(
      "store in database",
      {
        retries: {
          limit: 3,
          delay: "1 second",
          backoff: "exponential",
        },
        timeout: "30 seconds",
      },
      async () => {
        logger.info("Attempting to store in database", { apolloContact, cleanupAfter });
      }
    );
  }
}
