import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

export type EmailPipeParams = {
  email: string;
};

/**
 * Workflow for processing and categorizing news headlines
 */
export class EmailPipeWorkflow extends WorkflowEntrypoint<Env, EmailPipeParams> {
  async run(event: WorkflowEvent<EmailPipeParams>, step: WorkflowStep) {
    const { email } = event.payload;

    // Simple logger for workflow steps
    const workflowLogger = {
      log: (message: string, data?: object) =>
        console.log(
          `[WF ${event.instanceId ?? "N/A"}] ${message}`,
          data ? JSON.stringify(data) : ""
        ),
      warn: (message: string, data?: object) =>
        console.warn(
          `[WF ${event.instanceId ?? "N/A"}] WARN: ${message}`,
          data ? JSON.stringify(data) : ""
        ),
      error: (message: string, data?: object) =>
        console.error(
          `[WF ${event.instanceId ?? "N/A"}] ERROR: ${message}`,
          data ? JSON.stringify(data) : ""
        ),
    };

    workflowLogger.log("Starting EmailPipeWorkflow", { email });

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
        workflowLogger.log("Starting email analysis", { email });
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
        workflowLogger.log("Attempting use gemini ai to generate a structured person record", {
          email,
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
        workflowLogger.log("Attempting use gemini ai to write personalised emails", {
          email,
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
        workflowLogger.log("Attempting to store in database", { email });
      }
    );
  }
}
