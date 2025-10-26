# SwitchedHit - T20 Cricket Simulation Platform

SwitchedHit is a T20 cricket simulation platform built with **Next.js 13**, **Tailwind CSS**, and **ShadCN UI**. It leverages **Prisma ORM** with a **SQLite** database to deliver fast team management, immersive simulations, and a streamlined administrative experience.

## Features

- **Role-Based Authentication**: Credential login backed by NextAuth with User/Admin roles
- **Team Management**: Create and manage franchises with detailed metadata and ownership
- **Player Management**: Maintain rosters with batting/bowling roles and attributes
- **Match Scheduling**: Organise fixtures with venues, dates, and match types
- **Simulation Engine**: Run realistic ball-by-ball match simulations
- **Statistics Tracking**: Monitor performance metrics across teams and matches
- **Modern UI**: Responsive interface powered by Tailwind CSS and ShadCN UI components

### What’s New

- Complete sign-in/sign-up flow with secure password hashing (bcrypt)
- Protected admin dashboard that only Admins can access
- Team creation forms for both managers and admins, automatically assigning ownership
- Seed data now provisions default Admin/User accounts for quick testing

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (Radix primitives)
- **Database**: SQLite via Prisma ORM
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dattaprasad-r-ekavade/switchedhit-codex.git
   cd switchedhit-codex
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` if the example file exists, otherwise edit `.env` directly.
   - Set `DATABASE_URL` (defaults to `file:./dev.db` for SQLite).
   - Set `NEXTAUTH_SECRET` to a secure random string.
   - Set `CRON_SECRET` for webhook-based scheduled tasks (see [CRON_SETUP.md](./CRON_SETUP.md)).

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. (Optional) Seed the database with sample data and default accounts:
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run start` — Start the production server
- `npm run lint` — Run ESLint
- `npm run db:seed` — Seed the database with sample data

## Project Structure

```
switchedhit-codex/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seed script
│   └── migrations/         # Prisma migrations
├── src/
│   ├── app/                # App Router routes
│   │   ├── admin/          # Admin dashboard & forms
│   │   ├── api/            # API route handlers
│   │   ├── auth/           # Login & registration flows
│   │   ├── matches/        # Match listing
│   │   └── teams/          # Team listing & creation
│   ├── components/         # Shared React components
│   │   ├── forms/          # Form components
│   │   ├── providers/      # Context providers (e.g., SessionProvider)
│   │   └── ui/             # ShadCN UI wrappers
│   └── lib/                # Utilities (Prisma, auth config, simulation)
└── public/                 # Static assets
```

## Default Accounts

The seed script provisions these helpful accounts:

| Role   | Email                 | Password |
| ------ | --------------------- | -------- |
| Admin  | `admin@switchedhit.com` | `admin123` |
| User   | `user@switchedhit.com`  | `user123`  |
| Test   | `test@test.com`         | `test@test.com` |

- Admins can access `/admin`, create teams, and optionally assign ownership by email.
- Users can create teams via `/teams/create`; ownership is automatically linked to their account.

## Scheduled Tasks (Cron Jobs)

The platform includes automated timeline advancement and player aging features. For production deployment on serverless platforms like Vercel:

- See **[CRON_SETUP.md](./CRON_SETUP.md)** for complete webhook configuration guide
- Recommended: Use cron-job.org or GitHub Actions to trigger `/api/cron/advance-timeline` daily
- Local development uses `node-cron` automatically

## Feature Walkthrough

- **Home Page**: High-level overview and quick links.
- **Teams**: Browse all teams, view details, and (when signed in) create new franchises.
- **Matches**: Inspect scheduled fixtures and past results.
- **Admin Dashboard**: Role-gated hub for managing teams, players, and matches.

## License

This project is private and proprietary.
