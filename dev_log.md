## 2025-10-26

- Shipped Phase 3 Task 3.1 league system overhaul:
  - Added Prisma League/LeagueStanding models, migrations, seed resets, and generated client updates.
  - Implemented /api/leagues endpoints plus admin creation UI with automated double round-robin fixture scheduling and league-aware match form updates.
  - Built public league index/detail pages with standings, fixtures, results, and navigation links; surfaced management dashboard cards.
  - Wired simulation + timeline flows to recalculate standings, handle promotion/relegation rollovers, and revalidate relevant views.

## 2025-10-21

- Delivered Phase 0 foundation fixes:
  - Split player skill system (pace/spin batting & bowling, fielding, keeping) with generator, schema, migration, and UI updates.
  - Added team rating utilities and surfaced badges/cards across team listings and detail views.
  - Replaced the simulation engine with configurable parameters, new admin management UI, API endpoints, and seeded balanced presets.
- Seeded default simulation configuration and refreshed Prisma client.
- Updated roadmap (`changes_to_make.md`) to reflect completed work and revised platform readiness metrics.

## 2025-10-23

- Completed Phase 1 timeline/aging system:
  - Added `GameTime` model, player aging attributes, and historical tracking table with migrations and data backfill.
  - Implemented timeline and player aging services, including retirements, youth replacements, and history logging.
  - Created cron scheduler, admin timeline dashboard, and API endpoints for manual advancement plus reporting.
- Seeded timeline baseline, refreshed Prisma client (`npx prisma generate`), and installed `node-cron`.
- Updated roadmap metrics/statements to mark Phase 1 complete.
- Fixed onboarding issues:
  - Added session update after team creation to properly reflect `hasCompletedOnboarding` status.
  - Added test@test.com user (password: test@test.com) with Test Warriors team to seed data.
  - Consolidated all migrations into single `20251023000000_init` migration for reduced complexity.
- Implemented webhook-based cron solution for serverless deployment:
  - Created `/api/cron/advance-timeline` webhook endpoint with Bearer token authentication.
  - Added `CRON_SECRET` environment variable configuration.
  - Created comprehensive `CRON_SETUP.md` documentation with setup guides for cron-job.org, GitHub Actions, EasyCron, and Vercel Cron.
  - Local `node-cron` kept for development; webhook approach enables production deployment on Vercel and other serverless platforms.
