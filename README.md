# SwitchedHit - T20 Cricket Simulation Platform

SwitchedHit is a T20 cricket simulation platform built with **Next.js 13**, **Tailwind CSS**, and **ShadCN UI** for a fast, responsive interface. It uses **Prisma ORM** with a **SQLite** database for efficient data handling, offering seamless team management, simulations, and admin controls in a modern full-stack setup.

## Features

- 🏏 **Team Management**: Create and manage cricket teams with detailed profiles
- 👥 **Player Management**: Comprehensive player roster with stats and roles
- 🎯 **Match Scheduling**: Schedule and organize T20 matches
- 🎲 **Match Simulation**: Realistic T20 cricket match simulation engine
- 📊 **Statistics Tracking**: Track team and player performance
- 🎨 **Modern UI**: Built with Tailwind CSS and ShadCN UI components
- 🚀 **High Performance**: Powered by Next.js 13 App Router

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Database**: SQLite with Prisma ORM
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm

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

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

4. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
switchedhit-codex/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts           # Database seed script
│   └── migrations/       # Database migrations
├── src/
│   ├── app/             # Next.js 13 app directory
│   │   ├── admin/       # Admin dashboard
│   │   ├── matches/     # Match pages
│   │   ├── teams/       # Team pages
│   │   └── page.tsx     # Home page
│   ├── components/      # React components
│   │   ├── ui/         # ShadCN UI components
│   │   └── navigation.tsx
│   └── lib/            # Utility functions
│       ├── prisma.ts   # Prisma client
│       ├── simulation.ts # Match simulation engine
│       └── utils.ts    # Helper utilities
└── public/             # Static assets
```

## Database Schema

The application uses the following main models:

- **Team**: Cricket teams with captain, coach, and home ground details
- **Player**: Individual players with roles, batting/bowling styles
- **Match**: T20 matches with venue, date, and status
- **Innings**: Match innings with runs, wickets, and overs
- **Ball**: Ball-by-ball details of each delivery

## Features Walkthrough

### Home Page
View platform statistics and quick access to teams and matches.

### Teams
- Browse all registered teams
- View team details with player rosters
- See recent match history

### Matches
- View scheduled and completed matches
- Track match status and results
- Access match details

### Admin Dashboard
- Create and manage teams
- Add and manage players
- Schedule matches
- Access administrative tools

## License

This project is private and proprietary.
