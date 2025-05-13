---
description: 
globs: 
alwaysApply: true
---
# Source Directory Structure and Guide

The `src` directory contains the main application logic for the project. Below is an overview of its structure and the purpose of key files and subdirectories:

## Main Entry Point
- [`index.ts`](mdc:src/index.ts): The main entry point for the application. It sets up the Hono app, defines API routes, integrates middleware, and exports the Cloudflare Worker handler. It also handles queue processing for both contact and screenshot jobs.

## Routing and Middleware
- [`routes.ts`](mdc:src/routes.ts): Defines OpenAPI route descriptions and response schemas for the main API endpoints, such as contact queueing and website screenshot jobs.
- [`middleware.ts`](mdc:src/middleware.ts): Contains authentication middleware and token validation logic, used to protect certain API endpoints.

## Schemas and Validation
- [`schemas.ts`](mdc:src/schemas.ts): Contains Zod schemas for validating incoming request payloads, such as the contact queue form and screenshot job requests.

## Utilities
- [`utils.ts`](mdc:src/utils.ts): Provides utility functions for CSV parsing, error response formatting, and object key transformation (e.g., snake_case conversion).

## Services
The `services` directory contains logic for interacting with external APIs, business logic, and integrations:
- [`services/apollo/`](mdc:src/services/apollo): Apollo contact schema and related logic for contact processing.
- [`services/webscreenshot/`](mdc:src/services/webscreenshot): Logic for handling website screenshot jobs.
- [`services/smartlead.ts`](mdc:src/services/smartlead.ts): Smartlead campaign integration logic.
- [`services/logger.ts`](mdc:src/services/logger.ts): Logging utilities.
- [`services/database/`](mdc:src/services/database): Database service logic.
- [`services/proxycurl/`](mdc:src/services/proxycurl): Proxycurl API integration and schemas.
- [`services/neverbounce/`](mdc:src/services/neverbounce): NeverBounce email validation integration.
- [`services/ai/`](mdc:src/services/ai): AI-related utilities, prompt generation, and email template logic.

## Workflows
- [`workflows/email-pipe.ts`](mdc:src/workflows/email-pipe.ts): Main workflow logic for processing email pipe jobs.
- [`workflows/index.ts`](mdc:src/workflows/index.ts): Workflow module entry point.

## Database
- [`database/schema.ts`](mdc:src/database/schema.ts): Database schema definitions.
- [`database/seed.sql`](mdc:src/database/seed.sql): SQL seed data for initializing the database.
- [`database/drizzle.config.ts`](mdc:src/database/drizzle.config.ts): Drizzle ORM configuration.
- [`database/migrations/`](mdc:src/database/migrations): SQL migration scripts for evolving the database schema.
- [`database/migrations/meta/`](mdc:src/database/migrations/meta): Metadata and snapshots for migration history.

## Data
- [`services/apollo/data/1.csv`](mdc:src/services/apollo/data/1.csv): Example CSV data for Apollo contact processing.

---

## Project Configuration
- [`wrangler.jsonc`](mdc:wrangler.jsonc): Cloudflare Worker configuration, including bindings for D1 database, queues, workflows, and R2 buckets. The main entry is set to [`src/index.ts`](mdc:src/index.ts). This file defines how the Worker interacts with Cloudflare services and resources.
- [`package.json`](mdc:package.json): Project dependencies, scripts, and tooling. Notable scripts include:
  - `dev`, `deploy`: For local development and deployment using Wrangler.
  - `db:generate`, `db:migrate`, `db:seed`, etc.: For managing the D1 database schema and data.
  - `types`: Generates Cloudflare Worker types and inserts them into the context automatically (run with `pnpm types`).

### Cloudflare Types
- **Cloudflare Worker types are generated and inserted into the hono env context automatically** by running the `types` script (`pnpm types`). This ensures up-to-date type safety for Worker bindings and environment variables.

---

**See individual module rules for more details on each file or subdirectory.**
