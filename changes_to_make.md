# SwitchedHit Development Roadmap

**Last Updated:** October 21, 2025  
**Platform Completion:** ~45% | **SaaS Readiness:** ~20%

This document outlines the implementation roadmap for transforming SwitchedHit from a prototype into a production-ready SaaS cricket simulation platform.


---

## 📊 Current Status

### ✅ Completed Features (Oct 20, 2025)
- **Single Team per User:** Database constraint + onboarding flow implemented
- **User Authentication:** Registration, login, role-based access
- **Team Management:** CRUD operations (except edit)
- **Player Generation:** Auto-creation with Indian nationality
- **Match System:** Creation, simulation, results display
- **Basic Statistics:** Ball-by-ball tracking
- **Player Skill System:** Split batting pace/spin, bowling pace/spin, fielding, and keeping attributes
- **Team Insights:** Team rating calculations with squad strength badges
- **Simulation Engine:** Configurable probabilities with admin-managed tuning presets

### 🔴 Critical Gaps Blocking Production
| Gap | Impact | Estimated Effort |
|-----|--------|-----------------|
| No timeline/aging system | Zero long-term engagement | 1-2 weeks |
| SQLite database | Cannot scale | 1-2 days |
| No payment system | Cannot monetize | 1 week |
| Weak security | Legal/trust risk | 4-5 days |
| No error monitoring | Cannot debug production | 2-3 days |

---

## 🎯 Development Phases

### Phase 0: Foundation Fixes (Completed October 21, 2025)
- Delivered granular player skills with updated generators, migrations, and UI displays.
- Introduced team rating metrics with colour-coded badges on admin and detail pages.
- Rebuilt the simulation engine around a configurable parameter set and new admin console.
- Seeded default tuning presets and ensured active configuration management.

### Phase 1: Timeline & Aging System (Week 2-3)
**Goal:** Implement core game progression mechanic

**Critical Context:** This is the FOUNDATION for:
- Training effectiveness (varies by age)
- League seasons (time-based)
- Player retirement & replacement
- Long-term user retention

#### Task 1.1: Database Schema (2 hours)
```prisma
model GameTime {
  id            String   @id @default("singleton")
  currentDate   DateTime @default(now())
  currentSeason String   @default("2025-26")
  dayNumber     Int      @default(0)
  weekNumber    Int      @default(0)  // 1 week = 1 game year
  lastUpdated   DateTime @updatedAt
  
  @@unique([id])
}

model Player {
  // Add to existing model
  age              Int      @default(25)
  peakAge          Int      @default(26)
  retirementAge    Int      @default(40)
  potentialGrowth  Int      @default(50)
  careerStartDate  DateTime @default(now())
  lastAgedDate     DateTime @default(now())
}

model PlayerAgeHistory {
  id           String   @id @default(cuid())
  playerId     String
  age          Int
  battingVsPace Int
  battingVsSpin Int
  recordedAt   DateTime @default(now())
  
  player       Player   @relation(fields: [playerId], references: [id])
}
```

#### Task 1.2: Timeline Service (1-2 days)
Create `src/lib/timeline.ts`:
```typescript
export async function advanceTimeline() {
  const gameTime = await prisma.gameTime.findUnique({ where: { id: 'singleton' } });
  
  // Advance 1 day
  const newDayNumber = gameTime.dayNumber + 1;
  const newWeekNumber = Math.floor(newDayNumber / 7);
  
  await prisma.gameTime.update({
    where: { id: 'singleton' },
    data: {
      dayNumber: newDayNumber,
      weekNumber: newWeekNumber,
      currentDate: new Date(gameTime.currentDate.getTime() + 24*60*60*1000)
    }
  });
  
  // If new week (= new year), trigger aging
  if (newWeekNumber > gameTime.weekNumber) {
    await ageAllPlayers();
  }
}
```

#### Task 1.3: Player Aging Service (2 days)
Create `src/lib/player-aging.ts`:
```typescript
export async function ageAllPlayers() {
  const players = await prisma.player.findMany();
  
  for (const player of players) {
    const newAge = player.age + 1;
    
    // Apply skill degradation
    let skillLoss = 0;
    if (newAge >= 33 && newAge <= 36) skillLoss = -1;
    else if (newAge >= 37 && newAge <= 39) skillLoss = -2;
    else if (newAge >= 40) skillLoss = -5;
    
    if (newAge >= 40) {
      // Retire player
      await retirePlayer(player.id);
      await generateYouthReplacement(player.teamId);
    } else {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          age: newAge,
          battingVsPace: Math.max(0, player.battingVsPace + skillLoss),
          battingVsSpin: Math.max(0, player.battingVsSpin + skillLoss),
          // ... apply to all skills
        }
      });
    }
    
    // Record in history
    await prisma.playerAgeHistory.create({ /* ... */ });
  }
}
```

#### Task 1.4: Background Cron Job (1 day)
Create `src/lib/cron.ts`:
```typescript
import cron from 'node-cron';
import { advanceTimeline } from './timeline';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Advancing timeline...');
  await advanceTimeline();
});
```

Add to `src/app/layout.tsx` or create API route that initializes on app start.

#### Task 1.5: Admin Interface (1-2 days)
Create `/admin/timeline/page.tsx`:
- Display current game time
- Manual time advancement button (for testing)
- View upcoming events (retirements)
- View aging history

**Package to Install:**
```bash
npm install node-cron
```

---

### Phase 2: Production Readiness (Week 4-5)
**Goal:** Make platform secure, scalable, and monetizable

#### Task 2.1: Migrate to PostgreSQL (1-2 days)
**Why:** SQLite doesn't support concurrent writes, unsuitable for production.

**Steps:**
1. Choose provider (Supabase, Neon, or Railway recommended)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Generate new migration
4. Test locally with Docker PostgreSQL
5. Deploy to chosen provider

**Environment Variable:**
```env
DATABASE_URL="postgresql://user:password@host:5432/switchedhit"
```

---

#### Task 2.2: Payment Integration (1 week)
**Tiers:**
- **Free:** 1 team, 3 training/week, ads
- **Pro ($4.99/mo):** Unlimited training, advanced stats, no ads
- **Elite ($9.99/mo):** League creation, API access, data export

**Implementation:**
1. Install Stripe: `npm install stripe @stripe/stripe-js`
2. Add to `prisma/schema.prisma`:
   ```prisma
   model User {
     // Add
     subscriptionTier    String   @default("FREE")  // FREE, PRO, ELITE
     stripeCustomerId    String?
     subscriptionStatus  String?  // active, canceled, past_due
   }
   ```
3. Create subscription API routes:
   - `/api/stripe/create-checkout`
   - `/api/stripe/webhook`
   - `/api/stripe/manage-subscription`
4. Add pricing page: `/pricing`
5. Add subscription management: `/dashboard/subscription`
6. Implement feature gates in middleware

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

#### Task 2.3: Security Hardening (4-5 days)

**Subtask 2.3.1: Rate Limiting (1 day)**
```bash
npm install express-rate-limit
```

Create `src/middleware/rate-limit.ts`:
```typescript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 min
  message: 'Too many login attempts'
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**Subtask 2.3.2: Input Validation (1-2 days)**
```bash
npm install zod
```

Add Zod schemas to all API routes:
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

// In route:
const body = registerSchema.parse(await req.json());
```

**Subtask 2.3.3: Other Security (2 days)**
- Add CSRF tokens to forms
- Implement stronger password requirements
- Add 2FA support (optional for users, required for admins)
- Audit logging for admin actions

---

#### Task 2.4: Error Monitoring (2-3 days)

**Install Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Add Health Check:**
Create `/api/health/route.ts`:
```typescript
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return Response.json({ status: 'error', database: 'disconnected' }, { status: 500 });
  }
}
```

**Add Logging:**
```bash
npm install winston
```

Create `src/lib/logger.ts` for structured logging.

---

#### Task 2.5: Performance Optimization (2-3 days)

**Subtask 2.5.1: Database Indexes**
```prisma
model Match {
  @@index([status, date])
  @@index([homeTeamId])
  @@index([awayTeamId])
}

model Player {
  @@index([teamId, role])
}
```

**Subtask 2.5.2: API Pagination**
Add to all list endpoints:
```typescript
const page = parseInt(searchParams.page) || 1;
const limit = 20;
const skip = (page - 1) * limit;

const matches = await prisma.match.findMany({
  take: limit,
  skip,
  orderBy: { date: 'desc' }
});
```

**Subtask 2.5.3: Caching (Optional)**
```bash
npm install @upstash/redis
```

Cache team data, league standings (5-30 min TTL).

---

### Phase 3: Core Features (Week 6-8)
**Goal:** Build engaging gameplay mechanics

#### Task 3.1: League System (2-3 weeks)

**Schema:**
```prisma
model League {
  id          String   @id @default(cuid())
  name        String
  tier        Int      // 1 = top division
  season      String
  maxTeams    Int      @default(16)
  status      String   // UPCOMING, ACTIVE, COMPLETED
  
  standings   LeagueStanding[]
  matches     Match[]
}

model LeagueStanding {
  id          String   @id @default(cuid())
  leagueId    String
  teamId      String
  played      Int      @default(0)
  won         Int      @default(0)
  lost        Int      @default(0)
  points      Int      @default(0)
  netRunRate  Float    @default(0)
  
  league      League   @relation(fields: [leagueId], references: [id])
  team        Team     @relation(fields: [teamId], references: [id])
  
  @@unique([leagueId, teamId])
}
```

**Implementation:**
1. Admin league creation interface
2. Season management (integrated with timeline)
3. Automatic fixture generation
4. Points calculation after each match
5. Standings display page
6. Promotion/relegation logic (top 3 up, bottom 3 down)

**Files:**
- `/admin/leagues/create/page.tsx`
- `/leagues/[id]/standings/page.tsx`
- `src/lib/league-utils.ts` (fixture generation, standings calculation)

---

#### Task 3.2: Training System (1-2 weeks)

**Schema:**
```prisma
model TrainingSession {
  id                 String   @id @default(cuid())
  playerId           String
  playerAge          Int
  trainingType       String   // BATTING_PACE, BATTING_SPIN, etc.
  targetSkill        String
  ageModifier        Float
  skillImprovement   Int
  date               DateTime @default(now())
  
  player             Player   @relation(fields: [playerId], references: [id])
}
```

**Age-Based Effectiveness:**
```typescript
function getTrainingModifier(age: number): number {
  if (age >= 17 && age <= 22) return 1.2;  // +20%
  if (age >= 23 && age <= 28) return 1.1;  // +10%
  if (age >= 29 && age <= 32) return 1.0;  // normal
  if (age >= 33 && age <= 36) return 0.8;  // -20%
  if (age >= 37) return 0.6;               // -40%
  return 1.0;
}
```

**Implementation:**
1. Training dashboard: `/teams/[id]/training`
2. Daily training limits (3 for free, unlimited for Pro)
3. Skill-specific training options
4. Age warnings ("diminishing returns for older players")
5. Training history & progress tracking

---

#### Task 3.3: Player & Team Management (3-4 days)

**Create missing pages:**
1. `/admin/players` - List all players with filters
2. `/admin/players/create` - Manual player creation
3. `/admin/players/[id]/edit` - Edit player
4. `/admin/teams/[id]/edit` - Edit team
5. `/players/[id]` - Public player profile

**Features:**
- Search & filter (by role, age, skills, team)
- Bulk operations (retire multiple players)
- Player statistics display
- Team color/logo customization

---

#### Task 3.4: Notification System (4-5 days)

**Schema:**
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // MATCH, TRAINING, LEAGUE, SYSTEM
  title     String
  message   String
  isRead    Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

**Implementation:**
1. Notification dropdown in navbar
2. Create notifications on:
   - Match completion
   - Training completion
   - League updates (promotion/relegation)
   - Player retirement
3. Mark as read functionality
4. Email notifications (optional)

**Files:**
- `src/components/notification-bell.tsx`
- `/api/notifications/route.ts`
- Email service integration (optional: SendGrid, Resend)

---

### Phase 4: UX Polish (Week 9-10)
**Goal:** Professional, production-ready interface

#### Task 4.1: Loading & Error States (2 days)
- Add loading spinners to all async operations
- Skeleton screens for data-heavy pages
- User-friendly error messages (no stack traces)
- Empty states with helpful CTAs

#### Task 4.2: Form Improvements (1-2 days)
- Real-time validation as user types
- Clear error messages under fields
- Required field indicators
- Disable submit until valid

#### Task 4.3: Mobile Responsiveness (2 days)
- Test on actual mobile devices
- Touch-friendly buttons (min 44x44px)
- Readable text (min 16px)
- Responsive tables (horizontal scroll or card layout)

#### Task 4.4: Accessibility (2 days)
- Keyboard navigation
- ARIA labels
- Color contrast 4.5:1+
- Screen reader testing

#### Task 4.5: Onboarding Experience (1 day)
- Welcome tour for new users
- Tooltips on first visit
- Sample data/demo mode
- Help documentation

---

### Phase 5: Launch Prep (Week 11-12)
**Goal:** Deploy and monitor

#### Task 5.1: Testing (1 week)
```bash
npm install --save-dev jest @testing-library/react cypress
```

- Unit tests for critical logic (simulation, rating, aging)
- Integration tests for API routes
- E2E tests for user flows (Cypress)
- Target: 70%+ coverage

#### Task 5.2: CI/CD Pipeline (2-3 days)
- GitHub Actions workflow
- Automated testing on PR
- Automated deployment to Vercel
- Database migrations automation

#### Task 5.3: Documentation (2-3 days)
- User guide (how to play)
- API documentation (Swagger/OpenAPI)
- FAQ
- Developer documentation

#### Task 5.4: Beta Testing (1-2 weeks)
- Invite 20-50 beta users
- Gather feedback
- Fix critical bugs
- Monitor performance/errors

---

## 📊 Quick Reference

### Technology Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, NextAuth.js
- **Database:** PostgreSQL (migrate from SQLite)
- **ORM:** Prisma
- **Payments:** Stripe
- **Monitoring:** Sentry
- **Deployment:** Vercel

### Key Dependencies to Install
```bash
# Timeline & background jobs
npm install node-cron

# Payment
npm install stripe @stripe/stripe-js

# Security
npm install express-rate-limit zod

# Monitoring
npm install @sentry/nextjs winston

# Testing
npm install --save-dev jest @testing-library/react cypress

# Performance (optional)
npm install @upstash/redis
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="<32+ char random string>"
NEXTAUTH_URL="https://yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."

# Email (optional)
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASSWORD="..."
```

### Cost Estimates
**Development Time:** 10-12 weeks (400-480 hours)  
**Monthly Operating:** $100-150  
- Hosting (Vercel): $20-50
- Database (Supabase): $25-50
- Monitoring (Sentry): $25
- Email: $10-20

### Success Metrics to Track
- **Activation:** % completing onboarding
- **Engagement:** DAU/MAU ratio
- **Retention:** Day 1, 7, 30 retention rates
- **Revenue:** MRR, conversion rate (free → paid)
- **Quality:** Error rate, avg response time

---

## 🚨 Critical Reminders

### Design Principles
1. **One User = One Team** (enforced at DB level)
2. **1 Real Week = 1 Game Year** (timeline progression)
3. **All Players Indian** (v1 simplification)
4. **Registration ≠ Team Creation** (separate onboarding flow)

### Game Balance
- **Player Age:** 17-40 years
- **Peak Age:** 23-28 years
- **Skill Degradation:** Starts at 33
- **T20 Average Score:** 150-180 runs (tune simulation to this)

### Development Order Matters
```
Phase 0 (Skills/Simulation) → Phase 1 (Timeline/Aging) → Phase 2 (Production) → Phase 3 (Features)
```

**Do NOT start training or leagues before timeline system is built.**

---

## 📞 Next Steps

1. **Review with team** - Discuss timeline and scope
2. **Set up project board** - GitHub Projects or similar
3. **Start with Phase 0** - Foundation fixes (Week 1)
4. **Daily standups** - Track progress and blockers
5. **Weekly demos** - Show progress to stakeholders

**Estimated Launch:** 12 weeks from start  
**MVP Feature Set:** Enhanced simulation + timeline + payments + security

---

## 📋 Appendix: Deferred Features

### Post-Launch Features (Phase 6+)
These features are intentionally deferred to focus on MVP completion:

**Player & Team Management Enhancements:**
- Individual player profile pages (`/players/[id]`)
- Advanced player statistics with charts
- Team logo upload & customization
- Jersey color designer
- Player search & bulk operations

**Match Features:**
- Playing XI lineup management
- Match history advanced filters
- Export match reports (PDF/CSV)
- Match commentary enhancements

**Ground System:**
- Ground customization (pitch types, conditions)
- Home ground advantages
- Ground upgrade system
- Facility management

**Social & Community:**
- Public user profiles
- Follow/friend system
- Match comments & sharing
- Team rivalries tracking

**Analytics:**
- Advanced performance analytics
- Win probability calculator
- Player performance predictions
- Data export functionality

**Real-time Features:**
- Live match streaming
- WebSocket integration
- Real-time score updates
- Live commentary feed

**Auction System:**
- Player auction mechanism
- Virtual currency/budget system
- Bidding UI
- Auction history

**Achievements:**
- Badge/trophy system
- Progress tracking
- Leaderboards
- Rewards system

**Mobile:**
- Native iOS/Android apps
- PWA features (can be done earlier)
- Mobile-specific optimizations

**Miscellaneous:**
- Automated match scheduling algorithms
- Enhanced dashboard widgets
- User profile customization
- Email/push notifications (basic in-app first)

---

## 📝 Technical Notes

### Data Migration Scripts

**Player Skills Migration:**
```sql
-- Add new columns
ALTER TABLE Player ADD COLUMN battingVsPace INT DEFAULT 50;
ALTER TABLE Player ADD COLUMN battingVsSpin INT DEFAULT 50;
ALTER TABLE Player ADD COLUMN bowlingPace INT DEFAULT 50;
ALTER TABLE Player ADD COLUMN bowlingSpin INT DEFAULT 50;
ALTER TABLE Player ADD COLUMN fieldingSkill INT DEFAULT 50;
ALTER TABLE Player ADD COLUMN wicketKeeping INT DEFAULT 0;

-- Migrate data
UPDATE Player SET 
  battingVsPace = battingSkill,
  battingVsSpin = battingSkill,
  bowlingPace = CASE WHEN bowlingStyle IN ('FAST', 'MEDIUM') THEN bowlingSkill ELSE 50 END,
  bowlingSpin = CASE WHEN bowlingStyle IN ('SPIN_OFF', 'SPIN_LEG') THEN bowlingSkill ELSE 50 END,
  fieldingSkill = 50,
  wicketKeeping = CASE WHEN role = 'WICKET_KEEPER' THEN 75 ELSE 0 END;
```

**Nationality Migration:**
```sql
UPDATE Player SET country = 'India' WHERE country IS NULL OR country = '';
```

**Player Age Assignment:**
```sql
UPDATE Player SET age = 17 + (RANDOM() % 24) WHERE age IS NULL;
```

**GameTime Initialization:**
```sql
INSERT INTO GameTime (id, currentDate, currentSeason, dayNumber, weekNumber)
VALUES ('singleton', CURRENT_TIMESTAMP, '2025-26', 0, 0);
```

### Design Patterns

**Singleton Pattern for GameTime:**
```typescript
// Only one record with id='singleton'
const gameTime = await prisma.gameTime.upsert({
  where: { id: 'singleton' },
  update: { /* ... */ },
  create: { id: 'singleton', /* ... */ }
});
```

**Feature Gating by Subscription:**
```typescript
// middleware.ts
if (requiredTier === 'PRO' && user.subscriptionTier === 'FREE') {
  return NextResponse.redirect('/pricing');
}
```

**Age-Based Calculations:**
```typescript
function getAgeModifier(age: number, context: 'training' | 'performance'): number {
  if (context === 'training') {
    if (age <= 22) return 1.2;
    if (age <= 28) return 1.1;
    if (age <= 32) return 1.0;
    if (age <= 36) return 0.8;
    return 0.6;
  }
  // performance modifier
  if (age <= 28) return 1.0;
  if (age <= 32) return 0.95;
  if (age <= 36) return 0.85;
  return 0.7;
}
```

---

*Document Version: 3.0 (Restructured)*  
*Last Updated: October 20, 2025*
