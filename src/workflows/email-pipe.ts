import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { generateEmail } from "../services/ai";
import type { ApolloContact } from "../services/apollo/schema";
import {
  checkIfPersonWithEmailExistsInDb,
  createCampaign,
  getCampaignByName,
} from "../services/database";
import { logger } from "../services/logger";
import { fetchPersonProfile } from "../services/proxycurl";
import {
  createCampaign as createSmartleadCampaign,
  uploadLeadsToSmartlead,
} from "../services/smartlead";

export type EmailPipeParams = {
  apolloContact: ApolloContact;
  campaignName: string;
  contactEmail: string;
};

export class EmailPipeWorkflow extends WorkflowEntrypoint<Env, EmailPipeParams> {
  async run(event: WorkflowEvent<EmailPipeParams>, step: WorkflowStep) {
    const { apolloContact, campaignName, contactEmail } = event.payload;

    const upsertSmartleadCampaign = await step.do(
      "check db for campaign, if it does not exist create within db and smart lead",
      {
        retries: {
          limit: 3,
          delay: "10 seconds",
          backoff: "exponential",
        },
        timeout: "2 minutes",
      },
      async () => {
        const campaign = await getCampaignByName(campaignName);
        if (!campaign.data) {
          await createCampaign(campaignName);
          await createSmartleadCampaign(campaignName);
        }
      }
    );

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
            campaignName,
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

        logger.info("Starting email analysis", { apolloContact, campaignName, contactEmail });
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
          campaignName,
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
          campaignName,
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
          campaignName,
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
          campaignName,
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
          campaignName,
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
          campaignName,
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
        logger.info("Attempting to store in database", {
          apolloContact,
          campaignName,
          contactEmail,
        });
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
        logger.info("Attempting to update contact", {
          apolloContact,
          campaignName,
          contactEmail,
        });
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
            shouldEndWorkflow: true,
          };
        logger.info("Attempting to sync contact with smart lead campaign", {
          apolloContact,
          campaignName,
          contactEmail,
        });
        await uploadLeadsToSmartlead(campaignName, [
          {
            ...apolloContact,
            ...(enrichedLinkedinProfile.data || {}),
            background_cover_image_url:
              enrichedLinkedinProfile.data?.background_cover_image_url ?? null,
            city: enrichedLinkedinProfile.data?.city ?? null,
            country: enrichedLinkedinProfile.data?.country ?? null,
            country_full_name: enrichedLinkedinProfile.data?.country_full_name ?? null,
            first_name: enrichedLinkedinProfile.data?.first_name ?? null,
            full_name: enrichedLinkedinProfile.data?.full_name ?? null,
            headline: enrichedLinkedinProfile.data?.headline ?? null,
            last_name: enrichedLinkedinProfile.data?.last_name ?? null,
            occupation: enrichedLinkedinProfile.data?.occupation ?? null,
            profile_pic_url: enrichedLinkedinProfile.data?.profile_pic_url ?? null,
            public_identifier: enrichedLinkedinProfile.data?.public_identifier ?? null,
            state: enrichedLinkedinProfile.data?.state ?? null,
            summary: enrichedLinkedinProfile.data?.summary ?? null,
            follower_count: enrichedLinkedinProfile.data?.follower_count ?? null,
            connections: enrichedLinkedinProfile.data?.connections ?? null,
            accomplishment_courses: enrichedLinkedinProfile.data?.accomplishment_courses ?? [],
            accomplishment_honors_awards:
              enrichedLinkedinProfile.data?.accomplishment_honors_awards ?? [],
            accomplishment_organisations:
              enrichedLinkedinProfile.data?.accomplishment_organisations ?? [],
            accomplishment_patents: enrichedLinkedinProfile.data?.accomplishment_patents ?? [],
            accomplishment_projects: enrichedLinkedinProfile.data?.accomplishment_projects ?? [],
            accomplishment_publications:
              enrichedLinkedinProfile.data?.accomplishment_publications ?? [],
            accomplishment_test_scores:
              enrichedLinkedinProfile.data?.accomplishment_test_scores ?? [],
            activities: enrichedLinkedinProfile.data?.activities ?? [],
            articles: enrichedLinkedinProfile.data?.articles ?? [],
            certifications: enrichedLinkedinProfile.data?.certifications ?? [],
            education: enrichedLinkedinProfile.data?.education ?? [],
            experiences: enrichedLinkedinProfile.data?.experiences ?? [],
            groups: enrichedLinkedinProfile.data?.groups ?? [],
            people_also_viewed: enrichedLinkedinProfile.data?.people_also_viewed ?? [],
            recommendations: enrichedLinkedinProfile.data?.recommendations ?? [],
            similarly_named_profiles: enrichedLinkedinProfile.data?.similarly_named_profiles ?? [],
            skills: enrichedLinkedinProfile.data?.skills ?? [],
            volunteer_work: enrichedLinkedinProfile.data?.volunteer_work ?? [],
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
