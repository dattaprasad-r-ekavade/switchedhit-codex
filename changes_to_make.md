# Missing Features & Changes to Make

## Analysis Date: October 16, 2025

This document lists all features mentioned in `product_specs.md` that are currently **NOT implemented** in the SwitchedHit application. Features are categorized by priority and complexity.

---

## CRITICAL BUGS & DESIGN ISSUES (Fix Immediately)

### BUG #1: Multiple Teams Per User (Design Violation)
**Status**: CRITICAL BUG - Violates Core Design

**Current Behavior**:
- Users can create unlimited teams via a separate team creation flow
- One user can own multiple teams
- **SHOULD BE**: 1 User = 1 Team relationship (created automatically during registration)

**Correct Design**:
- Team should be created **automatically during user registration**
- User registers -> Team is auto-created -> User assigned as owner
- No separate "Create Team" flow for regular users
- Each user gets exactly one team throughout their lifecycle

**Required Fix**:

1. **Database Constraint**:
   ```prisma
   model User {
     // Change from teams Team[] to team Team?
     team Team? // One-to-one relationship
   }
   
   model Team {
     ownerId String @unique // Add @unique constraint
     owner   User   @relation(fields: [ownerId], references: [id])
   }
   ```

2. **Registration & Onboarding Flow**:
   
   **Step 1 - Registration** (`/api/register/route.ts`):
   - User registers with email, password, name (NO team name yet)
   - Create user account only
   - After successful registration, redirect to onboarding page
   
   **Step 2 - Onboarding Page** (`/onboarding/page.tsx`):
   - New dedicated onboarding page shown AFTER registration
   - Protected route (requires authentication)
   - User enters: Team Name, Short Name (optional auto-generate), Home Ground
   - Submit triggers team creation
   
   **Step 3 - Team Creation** (`/api/onboarding/create-team/route.ts`):
   - Verify user doesn't already have a team
   - Create team + generate 15 players in transaction
   - All players have `country: "India"` (hardcoded for v1)
   - Mark user as "onboarded"
   - Redirect to team dashboard
   
   ```typescript
   // Pseudo-code for onboarding
   // POST /api/onboarding/create-team
   await prisma.$transaction(async (tx) => {
     // Check if user already has team
     const existingTeam = await tx.team.findUnique({ 
       where: { ownerId: session.user.id } 
     })
     if (existingTeam) throw new Error("Team already exists")
     
     // Create team
     const team = await tx.team.create({ 
       name: teamName, // from onboarding form
       shortName: shortName || generateShortName(teamName),
       homeGround: homeGround,
       ownerId: session.user.id 
     })
     
     // Generate 15 Indian players
     const players = generateTeamPlayers(team.id, 15, "India")
     await tx.player.createMany({ data: players })
     
     // Mark user as onboarded (optional: add flag to User model)
     await tx.user.update({
       where: { id: session.user.id },
       data: { hasCompletedOnboarding: true }
     })
   })
   ```

3. **UI Updates**:
   - **Registration Form**: NO team name field (keep it simple: email, password, name only)
   - **New Onboarding Page**: Create `/app/onboarding/page.tsx`
     - Welcome message
     - Team creation form (name, short name, home ground)
     - "Create My Team" button
     - Cannot skip (required to access app)
   - **Middleware/Route Protection**: 
     - Check if the user has a team; if not, redirect to /onboarding
     - Prevent accessing main app without completing onboarding
   - **Remove** standalone team creation pages for regular users:
     - Remove or hide `/teams/create` for non-admin users
     - Remove "Create Team" buttons from teams listing for regular users
   - **Admin Only**: Keep team creation for admins (for testing/management)
   - Update navigation to remove team creation link for regular users

4. **Player Generation Update** (`src/lib/player-generator.ts`):
   - All generated players should have `country: "India"` (no random country selection)
   - Hide country field in player display UI (prepare for v2 multi-national feature)

5. **Migration Strategy**:
   - For existing users without teams: create team automatically
   - For existing users with multiple teams: keep first team, delete/reassign others
   - Run data cleanup script before applying constraint

**Impact**: High - Core game mechanic violation

**Note**: Multi-national players planned for v2. For now, all players are Indian.

---

### MISSING #2: Enhanced Player Skills & Simulation System
**Status**: Not Implemented (0%)

**Current Issues**:
- Match simulation works with hardcoded parameters
- Player skills too simple (single batting/bowling skill)
- No distinction between batting vs pace vs spin
- No distinction between seam bowling vs spin bowling
- No team rating system
- No way to adjust simulation probabilities
- No admin interface to control match engine
- Parameters are hardcoded in `src/lib/simulation.ts`

**Required Changes**:

### A. Enhanced Player Skill System

**Current Schema** (Too Simple):
```prisma
model Player {
  battingSkill Int @default(50)  // Single skill
  bowlingSkill Int @default(50)  // Single skill
}
```

**New Schema** (Detailed & Realistic):
```prisma
model Player {
  id               String   @id @default(cuid())
  name             String
  role             String   // BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
  
  // Batting Skills (0-100 each)
  battingVsPace    Int      @default(50)  // Skill against fast/medium bowling
  battingVsSpin    Int      @default(50)  // Skill against spin bowling
  
  // Bowling Skills (0-100 each)
  bowlingPace      Int      @default(50)  // Pace/seam bowling skill
  bowlingSpin      Int      @default(50)  // Spin bowling skill
  
  // Other skills
  fieldingSkill    Int      @default(50)  // Fielding ability
  wicketKeeping    Int      @default(0)   // WK skill (0 for non-keepers)
  
  // Existing fields...
  battingStyle     String?
  bowlingStyle     String?  // Determines which bowling skill to use
  age              Int
  country          String?
  // ... other fields
}
```

**Bowling Style to Skill Mapping**:
- `FAST` or `MEDIUM` -> uses `bowlingPace`
- `SPIN_OFF` or `SPIN_LEG` -> uses `bowlingSpin`

**Role-Based Skill Ranges** (for generator):
```typescript
const SKILL_RANGES = {
  BATSMAN: {
    battingVsPace: [60, 95],
    battingVsSpin: [60, 95],
    bowlingPace: [5, 30],
    bowlingSpin: [5, 30],
    fieldingSkill: [50, 80],
    wicketKeeping: [0, 0]
  },
  BOWLER: {
    battingVsPace: [10, 40],
    battingVsSpin: [10, 40],
    bowlingPace: [65, 95],  // OR bowlingSpin based on style
    bowlingSpin: [65, 95],
    fieldingSkill: [40, 70],
    wicketKeeping: [0, 0]
  },
  ALL_ROUNDER: {
    battingVsPace: [55, 85],
    battingVsSpin: [55, 85],
    bowlingPace: [55, 85],
    bowlingSpin: [55, 85],
    fieldingSkill: [60, 85],
    wicketKeeping: [0, 0]
  },
  WICKET_KEEPER: {
    battingVsPace: [50, 80],
    battingVsSpin: [50, 80],
    bowlingPace: [5, 25],
    bowlingSpin: [5, 25],
    fieldingSkill: [60, 85],
    wicketKeeping: [70, 95]
  }
}
```

### B. Team Rating System

**Implementation**:
```typescript
function calculateTeamRating(team: Team): number {
  const players = team.players
  
  // Get top 5 batsmen (by average of battingVsPace & battingVsSpin)
  const batsmen = players
    .map(p => ({
      ...p,
      battingAvg: (p.battingVsPace + p.battingVsSpin) / 2
    }))
    .sort((a, b) => b.battingAvg - a.battingAvg)
    .slice(0, 5)
  
  // Get top 5 bowlers (by max of bowlingPace or bowlingSpin)
  const bowlers = players
    .map(p => ({
      ...p,
      bowlingMax: Math.max(p.bowlingPace, p.bowlingSpin)
    }))
    .sort((a, b) => b.bowlingMax - a.bowlingMax)
    .slice(0, 5)
  
  // Get wicketkeeper
  const keeper = players.find(p => p.role === 'WICKET_KEEPER')
  
  const topBatsmenSkills = batsmen.reduce((sum, p) => sum + p.battingAvg, 0)
  const topBowlersSkills = bowlers.reduce((sum, p) => sum + p.bowlingMax, 0)
  const keeperSkill = keeper ? keeper.wicketKeeping : 0
  
  // Team rating formula
  const teamRating = (topBatsmenSkills + topBowlersSkills + keeperSkill) / 11
  
  return Math.round(teamRating * 10) / 10  // Round to 1 decimal
}
```

**Display Requirements**:
- Show team rating on teams listing page
- Show team rating on team detail page
- Color code ratings: 
  - 80+ (Green - Elite)
  - 70-79 (Blue - Strong)
  - 60-69 (Yellow - Average)
  - Below 60 (Red - Weak)
- Update rating whenever players are added/modified/aged

### C. Enhanced Simulation Config

**Database Model**:
```prisma
model SimulationConfig {
  id                    String   @id @default(cuid())
  name                  String   @unique  // "default", "test", etc.
  isActive              Boolean  @default(false)
  
  // Base probability settings (0-1 range)
  baseWicketProbability Float    @default(0.05)
  extraProbability      Float    @default(0.08)
  
  // Skill influence multipliers
  battingSkillInfluence Float    @default(0.08)
  bowlingSkillInfluence Float    @default(0.1)
  
  // Matchup advantages
  paceVsSpinAdvantage   Float    @default(0.05)  // Advantage when matchup favors one
  spinVsPaceAdvantage   Float    @default(0.05)
  
  // Run distribution thresholds
  sixThreshold          Float    @default(0.95)
  fourThreshold         Float    @default(0.85)
  twoThreshold          Float    @default(0.70)
  singleThreshold       Float    @default(0.50)
  
  // Wicket type probabilities
  bowledProbability     Float    @default(0.25)
  caughtProbability     Float    @default(0.50)
  lbwProbability        Float    @default(0.15)
  stumpedProbability    Float    @default(0.05)
  runOutProbability     Float    @default(0.05)
  
  // Extra ball probabilities  
  wideProbability       Float    @default(0.06)
  noBallProbability     Float    @default(0.02)
  
  // Pitch/Ground conditions
  pitchBounce           Float    @default(0.5)   // 0-1, affects pace bowling
  pitchTurn             Float    @default(0.5)   // 0-1, affects spin bowling
  boundarySize          Float    @default(0.5)   // 0-1, affects six/four probability
  
  // Over phases (different behavior in different phases)
  powerplayMultiplier   Float    @default(1.2)   // Overs 1-6
  middleOversMultiplier Float    @default(0.9)   // Overs 7-15
  deathOversMultiplier  Float    @default(1.3)   // Overs 16-20
  
  // Pressure situations
  chasePressure         Float    @default(0.1)   // Extra pressure when chasing
  runRateRequirement    Float    @default(0.05)  // Pressure based on req run rate
  
  // Other parameters
  maxOvers              Int      @default(20)
  wicketsPerInnings     Int      @default(10)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### D. Enhanced Simulation Engine

**New Ball Simulation Logic**:
```typescript
function simulateBall(
  batsman: Player, 
  bowler: Player, 
  config: SimulationConfig,
  overNumber: number,
  targetScore?: number,
  currentScore?: number
): BallResult {
  
  // 1. Determine bowler type and select appropriate skills
  const isBowlerPace = ['FAST', 'MEDIUM'].includes(bowler.bowlingStyle)
  const bowlerSkill = isBowlerPace ? bowler.bowlingPace : bowler.bowlingSpin
  const batsmanSkill = isBowlerPace ? batsman.battingVsPace : batsman.battingVsSpin
  
  // 2. Calculate matchup advantage
  let matchupAdvantage = 0
  if (isBowlerPace && batsman.battingVsPace > batsman.battingVsSpin) {
    matchupAdvantage = config.paceVsSpinAdvantage
  } else if (!isBowlerPace && batsman.battingVsSpin > batsman.battingVsPace) {
    matchupAdvantage = config.spinVsPaceAdvantage
  }
  
  // 3. Calculate phase multiplier (powerplay, middle, death)
  let phaseMultiplier = config.middleOversMultiplier
  if (overNumber <= 6) {
    phaseMultiplier = config.powerplayMultiplier
  } else if (overNumber >= 16) {
    phaseMultiplier = config.deathOversMultiplier
  }
  
  // 4. Calculate pressure factor
  let pressureFactor = 0
  if (targetScore && currentScore) {
    const ballsRemaining = (20 - overNumber) * 6
    const requiredRunRate = (targetScore - currentScore) / (ballsRemaining / 6)
    pressureFactor = requiredRunRate * config.runRateRequirement + config.chasePressure
  }
  
  // 5. Calculate pitch conditions effect
  const pitchEffect = isBowlerPace ? config.pitchBounce : config.pitchTurn
  
  // 6. Final probability calculations
  const battingAdvantage = (batsmanSkill / 100) * config.battingSkillInfluence
  const bowlingAdvantage = (bowlerSkill / 100) * config.bowlingSkillInfluence
  
  const wicketProbability = config.baseWicketProbability 
    + bowlingAdvantage 
    - battingAdvantage 
    + matchupAdvantage
    + pressureFactor
    + (pitchEffect * 0.05)
  
  const extraProbability = config.extraProbability
  
  // 7. Roll for outcome
  const roll = Math.random()
  
  // Check for extra
  if (roll < extraProbability) {
    const wideRoll = Math.random()
    if (wideRoll < config.wideProbability / extraProbability) {
      return { runs: 1, isWicket: false, isExtra: true, extraType: 'WIDE', ... }
    } else {
      return { runs: 1, isWicket: false, isExtra: true, extraType: 'NO_BALL', ... }
    }
  }
  
  // Check for wicket
  if (roll < wicketProbability + extraProbability) {
    const wicketTypeRoll = Math.random()
    let wicketType = 'BOWLED'
    
    // Distribute wicket types based on config
    const cumulative = {
      bowled: config.bowledProbability,
      caught: config.bowledProbability + config.caughtProbability,
      lbw: config.bowledProbability + config.caughtProbability + config.lbwProbability,
      stumped: config.bowledProbability + config.caughtProbability + config.lbwProbability + config.stumpedProbability,
    }
    
    if (wicketTypeRoll < cumulative.bowled) wicketType = 'BOWLED'
    else if (wicketTypeRoll < cumulative.caught) wicketType = 'CAUGHT'
    else if (wicketTypeRoll < cumulative.lbw) wicketType = 'LBW'
    else if (wicketTypeRoll < cumulative.stumped) wicketType = 'STUMPED'
    else wicketType = 'RUN_OUT'
    
    return { runs: 0, isWicket: true, wicketType, ... }
  }
  
  // Normal ball - calculate runs with phase and boundary adjustments
  const runsRoll = Math.random() + battingAdvantage * phaseMultiplier
  const boundaryBonus = config.boundarySize * 0.1
  
  let runs = 0
  if (runsRoll > config.sixThreshold - boundaryBonus) runs = 6
  else if (runsRoll > config.fourThreshold - boundaryBonus) runs = 4
  else if (runsRoll > config.twoThreshold) runs = 2
  else if (runsRoll > config.singleThreshold) runs = 1
  else runs = 0
  
  return { runs, isWicket: false, isExtra: false, ... }
}
```

### E. Admin Interface

**Comprehensive Admin Panel** (`/admin/simulation/config`):

1. **Basic Parameters Tab**:
   - Base wicket/extra probabilities
   - Skill influence multipliers
   - Run distribution thresholds

2. **Advanced Parameters Tab**:
   - Wicket type distribution
   - Matchup advantages
   - Phase multipliers (powerplay/middle/death)

3. **Pitch Conditions Tab**:
   - Pitch bounce (affects pace)
   - Pitch turn (affects spin)
   - Boundary size

4. **Pressure & Situations Tab**:
   - Chase pressure
   - Run rate requirement pressure

5. **Test & Preview**:
   - Run test simulation with current settings
   - Show expected score distribution
   - Compare with real T20 averages (150-180)
   - Adjust until realistic

6. **Presets**:
   - Default (balanced)
   - Batting Paradise (high scoring)
   - Bowler Friendly (low scoring)
   - Spin-Friendly Pitch
   - Pace-Friendly Pitch

### F. UI Updates Required

**Teams Listing Page** (`/teams`):
```tsx
<Card>
  <CardHeader>
    <div className="flex justify-between items-center">
      <CardTitle>{team.name}</CardTitle>
      <Badge variant={getRatingColor(team.rating)}>
        Rating: {team.rating.toFixed(1)}
      </Badge>
    </div>
  </CardHeader>
  {/* ... */}
</Card>
```

**Team Detail Page** (`/teams/[id]`):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Rating</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold">{teamRating.toFixed(1)}</div>
    <p className="text-sm text-muted-foreground">
      Based on top 5 batsmen, top 5 bowlers, and wicketkeeper
    </p>
    <div className="mt-4 space-y-2">
      <div>Top Batsmen Avg: {topBatsmenAvg.toFixed(1)}</div>
      <div>Top Bowlers Avg: {topBowlersAvg.toFixed(1)}</div>
      <div>Wicketkeeper: {keeperSkill}</div>
    </div>
  </CardContent>
</Card>
```

**Player Display** (Hide old single skills, show new split skills):
```tsx
{/* Batting Skills */}
<div>vs Pace: {player.battingVsPace}</div>
<div>vs Spin: {player.battingVsSpin}</div>

{/* Bowling Skills - show based on style */}
{player.bowlingStyle in ['FAST', 'MEDIUM'] && (
  <div>Pace Bowling: {player.bowlingPace}</div>
)}
{player.bowlingStyle in ['SPIN_OFF', 'SPIN_LEG'] && (
  <div>Spin Bowling: {player.bowlingSpin}</div>
)}

<div>Fielding: {player.fieldingSkill}</div>
{player.role === 'WICKET_KEEPER' && (
  <div>Wicket Keeping: {player.wicketKeeping}</div>
)}
```

**Required Files**:
- Update `prisma/schema.prisma` - new player skills
- Update `src/lib/player-generator.ts` - generate split skills
- Update `src/lib/simulation.ts` - new simulation logic
- Create `src/lib/team-rating.ts` - rating calculation
- Create `src/app/admin/simulation/config/page.tsx`
- Create `src/app/api/simulation/config/route.ts`
- Create `src/components/forms/simulation-config-form.tsx`
- Update all player display components
- Update team listing/detail pages with ratings

**Migration Required**:
```sql
-- Add new skill columns
ALTER TABLE Player ADD COLUMN battingVsPace INTEGER DEFAULT 50;
ALTER TABLE Player ADD COLUMN battingVsSpin INTEGER DEFAULT 50;
ALTER TABLE Player ADD COLUMN bowlingPace INTEGER DEFAULT 50;
ALTER TABLE Player ADD COLUMN bowlingSpin INTEGER DEFAULT 50;
ALTER TABLE Player ADD COLUMN fieldingSkill INTEGER DEFAULT 50;
ALTER TABLE Player ADD COLUMN wicketKeeping INTEGER DEFAULT 0;

-- Migrate old skills to new (rough approximation)
UPDATE Player SET 
  battingVsPace = battingSkill,
  battingVsSpin = battingSkill,
  bowlingPace = CASE WHEN bowlingStyle IN ('FAST', 'MEDIUM') THEN bowlingSkill ELSE 50 END,
  bowlingSpin = CASE WHEN bowlingStyle IN ('SPIN_OFF', 'SPIN_LEG') THEN bowlingSkill ELSE 50 END,
  fieldingSkill = 50,
  wicketKeeping = CASE WHEN role = 'WICKET_KEEPER' THEN 75 ELSE 0 END;

-- Drop old columns (optional, keep for compatibility)
-- ALTER TABLE Player DROP COLUMN battingSkill;
-- ALTER TABLE Player DROP COLUMN bowlingSkill;
```

**Impact**: HIGH - Makes simulation more realistic and controllable, improves game balance

---

##  Critical Missing Features (High Priority)

### 1. Timeline & Season System with Player Aging (Core Game Mechanic - Missing)
**Status**: Not Started (0%)

**Game Time Concept**:
- **Real Time to Game Time**: 1 real-world week = 1 game year
- **Daily Progression**: Each day advances the in-game timeline
- **Player Aging**: Players age automatically as game time progresses
- **Age Range**: Players are between 17-40 years old
- **Age Effects**: Age impacts training effectiveness and skill retention

**Missing Components**:
- Game timeline/calendar system
- Season progression mechanics
- Automatic player aging system
- Age-based training effectiveness
- Age-based skill degradation
- Player retirement system (age 40+)
- Youth player generation (age 17-20)
- Player career lifecycle tracking

**Required Database Changes**:
```prisma
model GameTime {
  id              String   @id @default(cuid())
  currentDate     DateTime // In-game date
  currentSeason   String   // e.g., "2025-26"
  dayNumber       Int      // Days since game start
  weekNumber      Int      // Weeks since game start (= years in game)
  lastUpdated     DateTime @default(now())
  
  @@unique([id]) // Singleton pattern - only one record
}

model Player {
  id               String   @id @default(cuid())
  name             String
  age              Int      // 17-40
  peakAge          Int      @default(26) // Age at peak performance
  retirementAge    Int      @default(40) // Age of retirement
  
  // Age-related attributes
  potentialGrowth  Int      @default(50) // How much player can improve (0-100)
  currentForm      Int      @default(50) // Current form level (0-100)
  
  // Existing fields...
  battingSkill     Int
  bowlingSkill     Int
  
  // Career tracking
  careerStartDate  DateTime @default(now()) // When player entered system
  lastAgedDate     DateTime @default(now()) // Last time age was incremented
  
  // ... other fields
}

model SeasonHistory {
  id              String   @id @default(cuid())
  seasonName      String
  startDate       DateTime
  endDate         DateTime
  status          String   // ACTIVE, COMPLETED
  createdAt       DateTime @default(now())
}

model PlayerAgeHistory {
  id              String   @id @default(cuid())
  playerId        String
  age             Int
  battingSkill    Int
  bowlingSkill    Int
  recordedAt      DateTime @default(now())
  
  player          Player   @relation(fields: [playerId], references: [id])
}
```

**Age-Based Game Mechanics**:

1. **Training Effectiveness by Age**:
   - **Ages 17-22 (Youth)**: +20% training effectiveness, high potential growth
   - **Ages 23-28 (Prime)**: +10% training effectiveness, peak performance
   - **Ages 29-32 (Experienced)**: Normal training effectiveness
   - **Ages 33-36 (Veteran)**: -20% training effectiveness, start skill degradation
   - **Ages 37-40 (Declining)**: -40% training effectiveness, rapid skill loss
   - **Age 40+**: Auto-retirement

2. **Skill Degradation Formula**:
   ```typescript
   // Weekly skill degradation based on age
   if (age >= 33 && age <= 36) {
     skillLoss = -1 point per month
   } else if (age >= 37 && age <= 39) {
     skillLoss = -2 points per month
   } else if (age >= 40) {
     skillLoss = -5 points per month + force retirement
   }
   ```

3. **Peak Performance Calculation**:
   ```typescript
   function calculatePerformanceModifier(age: number): number {
     if (age < 17) return 0.5      // Too young
     if (age <= 22) return 0.8      // Developing
     if (age <= 28) return 1.0      // Peak
     if (age <= 32) return 0.95     // Still strong
     if (age <= 36) return 0.85     // Declining
     if (age <= 40) return 0.7      // Veteran
     return 0.5                      // Past prime
   }
   ```

**Required Implementation**:

1. **Timeline Management Service** (`src/lib/timeline.ts`):
   - Cron job or scheduled task (runs daily at midnight)
   - Advances game time by 1 day
   - Every 7 real days = 1 game year
   - Triggers player aging, training effects, season changes

2. **Player Aging Service** (`src/lib/player-aging.ts`):
   - Automatically ages players based on timeline
   - Applies skill degradation for older players
   - Handles player retirement (age 40+)
   - Generates replacement youth players

3. **Admin Interface**:
   - `/admin/timeline/page.tsx` - View and control game time
   - Manual time advancement (for testing)
   - View upcoming events (aging, retirements, season end)
   - Season management interface

4. **Player Profile Updates**:
   - Display age prominently
   - Show "Prime" / "Declining" / "Youth" status
   - Career timeline visualization
   - Age-based potential indicator

5. **Background Job System**:
   - Set up cron job (node-cron or similar)
   - Daily task: advance timeline, age players, apply effects
   - Weekly task: advance game year, generate new youth players
   - Log all timeline changes for audit

**Impact**: Critical - Core game progression mechanic

---

### 2. League System (Core Feature - Completely Missing)
**Status**: Not Started (0%)

**Missing Components**:
- League model in database schema
- Season model in database schema
- LeagueStanding/Points table model
- Promotion and relegation mechanics
- Multi-tier league structure (upper, middle, lower divisions)
- League tables and standings display
- Season progression system
- League management UI for admins
- Team registration to leagues
- League parameters configuration

**Required Database Changes**:
```prisma
model League {
  id          String   @id @default(cuid())
  name        String
  tier        Int      // 1 = top tier, 2 = second tier, etc.
  season      String
  maxTeams    Int
  // relationships
}

model Season {
  id          String   @id @default(cuid())
  name        String
  startDate   DateTime
  endDate     DateTime
  status      String   // ACTIVE, COMPLETED, UPCOMING
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
}
```

**Required Implementation**:
- Admin pages: `/admin/leagues/create`, `/admin/leagues/[id]`
- League standings page: `/leagues/[id]/standings`
- Season management interface
- Promotion/relegation calculation logic
- Points calculation system

---

### 2. Player Management Pages (Missing Admin Interface)
**Status**: Not Started (0%)

**Missing Components**:
- Player listing page (`/admin/players`)
- Individual player detail page (`/players/[id]`)
- Player creation page (`/admin/players/create`)
- Player edit page (`/admin/players/[id]/edit`)
- Player deletion functionality
- Bulk player operations
- Player search and filtering
- Player statistics display

**Required Implementation**:
- Create `src/app/admin/players/page.tsx` - List all players
- Create `src/app/admin/players/create/page.tsx` - Add new player
- Create `src/app/admin/players/[id]/page.tsx` - Player details
- Create `src/app/admin/players/[id]/edit/page.tsx` - Edit player
- Create `src/app/players/[id]/page.tsx` - Public player profile
- Create player form component
- Add player API routes for CRUD operations

**Important Notes**:
- **Nationality**: All players are Indian for v1 (hardcode `country: "India"`)
- Hide country/nationality field in UI (prepare for v2 multi-national feature)
- Player generator should only create Indian players
- Admin can manually add players but should default to India

---

### 3. Team Edit Functionality
**Status**: Not Implemented (0%)

**Missing Components**:
- Team edit page (`/admin/teams/[id]/edit`)
- Team edit form component
- Team update API endpoint
- Team deletion functionality
- Owner transfer functionality

**Required Implementation**:
- Create `src/app/admin/teams/[id]/edit/page.tsx`
- Create team edit form component
- Add PUT/PATCH endpoint to `/api/teams/[id]/route.ts`
- Add DELETE endpoint for team deletion
- Update team detail page to show edit button conditionally

---

##  Major Missing Features (Medium-High Priority)

### 4. Training System (Complete Feature Missing)
**Status**: Not Started (0%)

**Missing Components**:
- Training session model in database
- Daily training mechanics
- Player skill improvement over time
- **Age-based training effectiveness** (critical integration)
- Training UI for team owners
- Special training modules (focused training)
- Training history tracking
- Training effectiveness calculation
- Training schedule system

**Required Database Changes**:
```prisma
model TrainingSession {
  id                 String   @id @default(cuid())
  teamId             String
  playerId           String
  playerAge          Int      // Capture age at time of training
  
  // Training type and specific skill targeted
  trainingType       String   // BATTING_PACE, BATTING_SPIN, BOWLING_PACE, BOWLING_SPIN, FIELDING, WICKET_KEEPING
  targetSkill        String   // battingVsPace, battingVsSpin, bowlingPace, bowlingSpin, fieldingSkill, wicketKeeping
  
  duration           Int      // Minutes
  baseEffectiveness  Float    // 0-100% base effectiveness
  ageModifier        Float    // Age-based multiplier
  finalEffectiveness Float    // baseEffectiveness * ageModifier
  skillImprovement   Int      // Points gained (adjusted for age)
  skillBefore        Int      // Skill value before training
  skillAfter         Int      // Skill value after training
  
  date               DateTime
  createdAt          DateTime @default(now())
  
  player             Player   @relation(fields: [playerId], references: [id])
  team               Team     @relation(fields: [teamId], references: [id])
}
```

**Training Types Mapped to New Skills**:
- `BATTING_PACE` -> trains `battingVsPace`
- `BATTING_SPIN` -> trains `battingVsSpin`
- `BOWLING_PACE` -> trains `bowlingPace` (for pace bowlers)
- `BOWLING_SPIN` -> trains `bowlingSpin` (for spin bowlers)
- `FIELDING` -> trains `fieldingSkill`
- `WICKET_KEEPING` -> trains `wicketKeeping` (WK only)

**Age-Based Training System**:

1. **Training Effectiveness Formula**:
   ```typescript
   function calculateTrainingEffectiveness(
     baseTraining: number,
     playerAge: number,
     trainingType: string
   ): number {
     let ageModifier = 1.0
     
     // Youth bonus (17-22)
     if (playerAge >= 17 && playerAge <= 22) {
       ageModifier = 1.2  // +20% learning rate
     }
     // Prime years (23-28)
     else if (playerAge >= 23 && playerAge <= 28) {
       ageModifier = 1.1  // +10% learning rate
     }
     // Peak experience (29-32)
     else if (playerAge >= 29 && playerAge <= 32) {
       ageModifier = 1.0  // Normal rate
     }
     // Veteran declining (33-36)
     else if (playerAge >= 33 && playerAge <= 36) {
       ageModifier = 0.8  // -20% learning rate
     }
     // Late career (37-40)
     else if (playerAge >= 37 && playerAge <= 40) {
       ageModifier = 0.6  // -40% learning rate
     }
     
     return baseTraining * ageModifier
   }
   ```

2. **Training Constraints**:
   - Young players (17-22): Can train any skill, high gains
   - Prime players (23-32): Moderate gains, maintain skills
   - Veterans (33+): Low gains, focus on maintenance
   - Training slows natural skill degradation for older players

3. **Skill Caps by Age**:
   ```typescript
   function getSkillCap(age: number): number {
     if (age <= 22) return 85  // Still growing
     if (age <= 28) return 100 // Can reach maximum
     if (age <= 32) return 95  // Minor decline
     if (age <= 36) return 90  // Notable decline
     if (age <= 40) return 80  // Significant decline
     return 70                  // Past prime
   }
   ```

**Required Implementation**:
- Training dashboard page: `/teams/[id]/training`
- Training session creation interface with age warnings
- **Age-aware skill improvement calculation logic**
- Training history view showing age at time of training
- Daily training reminders/notifications
- Age-based training recommendations
- Display "potential" indicator based on age
- Warning when training older players (diminishing returns)

---

### 5. Playing XI & Lineup Management
**Status**: Not Implemented (0%)

**Missing Components**:
- Playing XI selection interface
- Batting order customization
- Bowling lineup management
- Team formation/strategy settings
- Lineup storage in database
- Match-specific lineup configuration
- Substitute player management

**Required Database Changes**:
```prisma
model MatchLineup {
  id              String   @id @default(cuid())
  matchId         String
  teamId          String
  playerId        String
  battingOrder    Int?
  bowlingOrder    Int?
  isPlaying       Boolean  @default(true)
  isSubstitute    Boolean  @default(false)
}
```

**Required Implementation**:
- Lineup management page: `/teams/[id]/lineup` or `/matches/[id]/lineup/[teamId]`
- Drag-and-drop interface for batting order
- Bowling rotation configuration
- Squad selection (11 players + substitutes)
- Lineup validation logic

---

### 6. Ground Customization System
**Status**: Not Implemented (0%)

**Missing Components**:
- Ground model in database with detailed attributes
- Pitch condition settings (spin-friendly, pace-friendly, flat)
- Home ground advantages calculation
- Ground upgrade system
- Venue customization UI
- Ground facility management
- Pitch condition impact on match simulation

**Required Database Changes**:
```prisma
model Ground {
  id              String   @id @default(cuid())
  name            String   @unique
  location        String?
  capacity        Int?
  pitchType       String   // SPIN_FRIENDLY, PACE_FRIENDLY, FLAT, BALANCED
  bounceLevel     Int      @default(50)  // 0-100
  spinAssist      Int      @default(50)  // 0-100
  paceAssist      Int      @default(50)  // 0-100
  facilityLevel   Int      @default(1)   // Upgrade level
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Required Implementation**:
- Ground customization page: `/teams/[id]/ground`
- Ground upgrade system
- Integration with match simulation engine
- Home advantage calculation logic
- Ground statistics and performance tracking

---

### 7. Automated Match Scheduling System
**Status**: Partially Implemented (20%)

**Current State**:
- Manual match creation by admin
- Automatic scheduling at specific times
- Recurring match schedules
- Season-based fixture generation
- Automatic simulation execution
- Scheduled task runner

**Missing Components**:
- Cron job or scheduled task system
- Auto-generate fixtures for league
- Time-based match simulation trigger
- Background job queue
- Match scheduling algorithm

**Required Implementation**:
- Fixture generation algorithm for leagues
- Background job system (e.g., BullMQ, node-cron)
- Auto-simulation service
- Match notification system
- Schedule configuration interface

---

### 8. Notification System
**Status**: Not Implemented (0%)

**Missing Components**:
- Notification model in database
- In-app notifications
- Email notifications
- Push notifications (for mobile)
- Notification preferences
- Notification history
- Alert types (matches, training, league updates, auctions)

**Required Database Changes**:
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String   // MATCH, TRAINING, LEAGUE, AUCTION, SYSTEM
  title       String
  message     String
  isRead      Boolean  @default(false)
  link        String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
}
```

**Required Implementation**:
- Notification dropdown in navigation
- Notification API endpoints
- Email sending service integration
- Notification creation triggers throughout app
- User notification preferences page

---

##  Minor Missing Features (Medium Priority)

### 9. Enhanced Player Statistics
**Status**: Partially Implemented (30%)

**Current State**:
- Ball-by-ball data stored
- Basic innings statistics
- Aggregated player career stats
- Player performance graphs
- Season-wise statistics breakdown
- Head-to-head player comparisons

**Missing Components**:
- Player career statistics calculation
- Performance charts and graphs
- Statistics aggregation queries
- Player performance trends
- Statistical comparison tools
- Export statistics functionality

**Required Implementation**:
- Statistics calculation service
- Player stats page with charts
- Team statistics dashboard
- Comparative analysis tools
- Historical data visualization

---

### 10. Team Customization Features
**Status**: Partially Implemented (40%)

**Current State**:
- Team creation with basic info
- Logo URL field
- Logo upload functionality
- Team colors customization
- Jersey design customization
- Team branding elements

**Missing Components**:
- File upload for logos
- Color picker for team colors
- Jersey designer interface
- Team branding preview
- Image storage service

**Required Implementation**:
- File upload API endpoint
- Image storage (local or cloud like S3)
- Color picker UI component
- Jersey template system
- Team appearance preview

---

### 11. Match History & Archives
**Status**: Partially Implemented (50%)

**Current State**:
- Match listing by status
- Match detail view
- Ball-by-ball commentary
- Advanced match filtering
- Search functionality
- Date range filtering
- Export match reports

**Missing Components**:
- Advanced search filters
- Match archive page with pagination
- Export to PDF/CSV
- Match report generation
- Download match statistics

**Required Implementation**:
- Enhanced match search page
- Filter by date range, teams, venue, status
- Match report generator
- Export functionality
- Pagination for large match lists

---

### 12. User Profile & Settings
**Status**: Minimal Implementation (10%)

**Current State**:
- Basic user authentication
- Role-based access
- User profile page
- Profile editing
- Password change
- Account settings

**Missing Components**:
- User profile page (`/profile`)
- Profile edit functionality
- Password change form
- Account preferences
- Avatar/photo upload
- User statistics (teams owned, matches, etc.)

**Required Implementation**:
- Create `src/app/profile/page.tsx`
- Create `src/app/profile/edit/page.tsx`
- Password change API endpoint
- Profile update API endpoint
- User preferences storage

---

### 13. Dashboard Enhancements
**Status**: Basic Implementation (40%)

**Current State**:
- Basic stats cards (teams, players, matches count)
- Feature cards
- User-specific dashboard
- Recent activity feed
- Quick actions
- Personalized recommendations

**Missing Components**:
- User dashboard (owned teams, upcoming matches)
- Activity timeline
- Quick action shortcuts
- Performance summaries
- Notifications panel

**Required Implementation**:
- User-specific dashboard layout
- Activity feed component
- Quick actions widget
- Personalized content
- Dashboard widgets system

---

##  Nice-to-Have Features (Low Priority)

### 14. Social Features
**Status**: Not Implemented (0%)

**Missing Components**:
- User profiles (public)
- Follow/friend system
- Chat or messaging
- Comments on matches
- Team/match sharing
- Social media integration

---

### 15. Payment/Monetization System
**Status**: Not Implemented (0%)

**Missing Components**:
- Payment gateway integration
- Subscription plans
- Premium features
- Virtual currency
- In-app purchases

---

### 16. Mobile Application
**Status**: Not Started (0%)

**Current State**:
- Responsive web design
- Native mobile app (iOS/Android)
- Progressive Web App (PWA) features
- Mobile-specific optimizations

---

### 17. Real-time Features
**Status**: Not Implemented (0%)

**Missing Components**:
- Live match streaming
- Real-time score updates
- WebSocket integration
- Live commentary feed
- Live match watching feature

---

### 18. Advanced Analytics
**Status**: Not Implemented (0%)

**Missing Components**:
- Team performance analytics
- Player performance predictions
- Win probability calculator
- Advanced statistical models
- Data visualization dashboard
- Export analytics reports

---

### 19. Auction System
**Status**: Not Implemented (0%)

**Missing Components**:
- Player auction model
- Auction scheduling
- Bidding mechanism
- Virtual currency/budget system
- Auction UI
- Auction history

---

### 20. Achievement/Badge System
**Status**: Not Implemented (0%)

**Missing Components**:
- Achievement definitions
- Badge/trophy system
- Progress tracking
- Rewards system
- Leaderboards

---

## Implementation Summary

### Critical Bugs to Fix
| Bug | Impact | Priority | Effort |
|-----|--------|----------|--------|
| Multiple Teams Per User | High | CRITICAL | 2-3 hours |
| No Simulation Parameter Control | High | HIGH | 1 day |

### Feature Completion Status
| Category | Status | Completion % | Priority |
|----------|--------|--------------|----------|
| Authentication & Authorization | Complete | 100% | Critical |
| Team Management (Basic) | Complete | 90% | Critical |
| Team Edit Functionality | Missing | 0% | High |
| Player Management (CRUD) | Missing | 0% | High |
| Match Management (Basic) | Complete | 80% | Critical |
| Match Simulation | Complete | 90% | Critical |
| **Timeline & Player Aging System** | Missing | 0% | **CRITICAL** |
| Statistics Tracking | Partial | 30% | High |
| League System | Missing | 0% | Critical |
| Season Management | Missing | 0% | Critical |
| Training System (Age-Aware) | Missing | 0% | High |
| Playing XI Management | Missing | 0% | High |
| Ground Customization | Missing | 0% | Medium |
| Automated Scheduling | Partial | 20% | Medium |
| Notifications | Missing | 0% | Medium |
| User Profile | Partial | 10% | Medium |
| Team Customization | Partial | 40% | Low |
| Social Features | Missing | 0% | Low |
| Payment System | Missing | 0% | Low |
| Mobile App | Missing | 0% | Low |
| Real-time Features | Missing | 0% | Low |

### Overall Platform Completion: ~30%
*Note: Adjusted down due to critical timeline/aging system missing*

---

## Recommended Implementation Order

### Phase 0: Critical Bug Fixes & Core Mechanics (URGENT - 3-5 days)

1. **Fix one-team-per-user constraint with Onboarding Flow**
   - Update database schema (add @unique to ownerId)
   - Create onboarding page flow (separate from registration)
   - **Registration**: Only email, password, name (simple)
   - **Onboarding**: After registration, ask for team details
   - Create `/app/onboarding/page.tsx` - Team creation form
   - Create `/api/onboarding/create-team/route.ts` - Team creation endpoint
   - Add middleware/protection: redirect to onboarding if no team
   - Optional: Add `hasCompletedOnboarding` flag to User model
   - Update UI to prevent multiple team creation
   - Data migration for existing users with multiple teams

2. **Enhanced Player Skills System** (CRITICAL for realistic simulation)
   - Update Player model with split skills:
     - battingVsPace, battingVsSpin (replace battingSkill)
     - bowlingPace, bowlingSpin (replace bowlingSkill)
     - Add fieldingSkill, wicketKeeping
   - Migration script to convert old skills to new
   - Update player-generator.ts with new skill ranges
   - Update all player display components

3. **Team Rating System**
   - Implement calculateTeamRating() function
   - Add rating display to teams listing page
   - Add detailed rating breakdown to team detail page
   - Color-code ratings (Elite/Strong/Average/Weak)
   - Auto-update ratings when players change

4. **Enhanced Simulation Parameters**
   - Create comprehensive SimulationConfig model (30+ parameters)
   - Include: wicket types, pitch conditions, phase multipliers, pressure factors
   - Build advanced admin interface with tabs:
     - Basic Parameters
     - Advanced Parameters
     - Pitch Conditions
     - Pressure & Situations
     - Test & Preview
   - Update simulation engine with new logic:
     - Matchup-based (pace vs spin)
     - Phase-aware (powerplay/middle/death)
     - Pressure-sensitive (chase situations)
     - Pitch-condition effects
   - Add configuration presets

5. **Set all players to Indian nationality**
   - Update existing players: `UPDATE Player SET country = 'India'`
   - Hide country field in UI
   - Update player generator to hardcode India

### Phase 1: Timeline & Player Aging System (CRITICAL - 1-2 weeks)
**This is the foundation for game progression - must be built early**

1. **Database schema updates**
   - Add GameTime singleton model
   - Update Player model with age-related fields
   - Create SeasonHistory and PlayerAgeHistory models

2. **Timeline management service**
   - Create `src/lib/timeline.ts`
   - Implement daily progression (1 real week = 1 game year)
   - Background cron job for automatic time advancement

3. **Player aging system**
   - Create `src/lib/player-aging.ts`
   - Auto-age players based on timeline
   - Implement skill degradation for older players (33+)
   - Player retirement at age 40+
   - Youth player generation (age 17-20)

4. **Admin timeline controls**
   - Create `/admin/timeline/page.tsx`
   - Manual time advancement (for testing)
   - View game calendar and upcoming events
   - Monitor player ages and retirements

5. **UI updates**
   - Display player age prominently
   - Show age-based status (Youth/Prime/Veteran/Declining)
   - Career timeline visualization
   - Retirement warnings

### Phase 2: Core League System (Critical - 2-3 weeks)
1. Database schema updates (League, Season, LeagueStanding models)
2. League creation and management (admin UI)
3. Season management (integrate with timeline system)
4. Points table/standings display
5. Promotion/relegation logic

### Phase 3: Enhanced Management (High Priority - 2 weeks)
1. Player CRUD pages (admin interface)
2. Team edit functionality
3. Playing XI and lineup management
4. Player statistics enhancement

### Phase 4: Age-Aware Training System (High Priority - 2-3 weeks)
**Must be built after timeline/aging system**

1. Training system implementation with age modifiers
2. Age-based training effectiveness calculation
3. Skill improvement capped by age
4. Training recommendations based on player age
5. Maintenance training for veterans

### Phase 5: Strategic Features (Medium Priority - 2-3 weeks)
1. Ground customization system
2. Automated scheduling system
3. Notification system

### Phase 4: User Experience (Medium Priority - 1-2 weeks)
1. User profile and settings
2. Dashboard enhancements
3. Team customization (colors, logos)
4. Advanced match filters and search

### Phase 5: Polish & Nice-to-Have (Low Priority - As needed)
1. Social features
2. Real-time updates
3. Advanced analytics
4. Achievement system
5. Mobile app development

---

##  Technical Debt & Improvements

### Code Quality Issues
- [x] **CRITICAL**: User can create multiple teams (design violation) - NEEDS FIX
- [x] **CRITICAL**: No timeline/aging system (core game mechanic missing) - NEEDS IMPLEMENTATION
- [x] **CRITICAL**: Overly simple player skills (single batting/bowling) - NEEDS ENHANCEMENT
- [x] **HIGH**: No team rating system - NEEDS IMPLEMENTATION
- [x] **HIGH**: No admin control over simulation parameters - NEEDS IMPLEMENTATION
- [x] **HIGH**: Simulation too basic, not realistic enough - NEEDS ENHANCEMENT
- [ ] No background job system for timeline progression - NEEDS IMPLEMENTATION
- [ ] Missing error handling in some API routes
- [ ] Limited input validation in forms
- [ ] No API rate limiting
- [ ] Missing test coverage
- [ ] No API documentation (Swagger/OpenAPI)

### Performance Optimizations Needed
- [ ] Database query optimization (add more indexes)
- [ ] Implement caching (Redis or similar)
- [ ] Image optimization for team logos
- [ ] API response pagination
- [ ] Lazy loading for large lists

### Security Enhancements
- [ ] Add CSRF tokens to forms
- [ ] Implement API rate limiting
- [ ] Add input sanitization
- [ ] Enhance password requirements
- [ ] Add 2FA support
- [ ] Audit logging for admin actions

### DevOps & Infrastructure
- [x] **CRITICAL**: Set up cron job system for timeline/aging (node-cron or similar) - REQUIRED
- [ ] Set up CI/CD pipeline
- [ ] Add database backup system
- [ ] Implement logging system (especially for timeline changes)
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring
- [ ] Production deployment configuration

### Background Jobs Required (CRITICAL)
**Essential for timeline/aging system to function**

1. **Daily Timeline Advancement** (Runs at midnight):
   - Advance game calendar by 1 day
   - Check if 7 days passed -> advance 1 game year
   - Trigger player aging when year advances
   - Log all timeline changes

2. **Player Aging Job** (Triggered weekly):
   - Age all players by 1 year
   - Apply skill degradation to players 33+
   - Process retirements (age 40+)
   - Generate replacement youth players

3. **Skill Degradation Job** (Runs monthly):
   - Calculate age-based skill loss
   - Update player attributes
   - Notify users of significant changes

4. **Implementation Options**:
   - **Option 1**: node-cron (simple, built-in)
   - **Option 2**: BullMQ + Redis (robust, scalable)
   - **Option 3**: External cron service (for deployment)

5. **Required Package**:
   ```bash
   npm install node-cron
   # or
   npm install bullmq ioredis
   ```

---

##  Notes

### Critical Design Decisions

- **WARNING ONE USER = ONE TEAM**: This is a core design principle that must be enforced at database and application level
  - Team creation happens via **separate onboarding page AFTER registration**
  - No separate team creation flow for regular users (except onboarding)
  - **User Flow**: 
    1. Register (email, password, name only)
    2. Auto-login and redirect to onboarding
    3. Onboarding page: Enter team details
    4. Team created with 15 players
    5. User assigned as owner
  - **Why separate onboarding**: Keeps registration simple, better UX, clear step-by-step process

- ** ENHANCED PLAYER SKILL SYSTEM (REALISTIC GAME MECHANICS)**:
  - **Split Batting Skills**:
    - `battingVsPace` (0-100) - Performance against fast/medium bowling
    - `battingVsSpin` (0-100) - Performance against spin bowling
  - **Split Bowling Skills**:
    - `bowlingPace` (0-100) - Pace/seam bowling ability
    - `bowlingSpin` (0-100) - Spin bowling ability
  - **Additional Skills**:
    - `fieldingSkill` (0-100) - General fielding ability
    - `wicketKeeping` (0-100) - Wicket keeping skill (0 for non-keepers)
  - **Replaces**: Old simple `battingSkill` and `bowlingSkill`
  - **Why**: More realistic matchups, allows specialization, better game balance

- ** TEAM RATING SYSTEM**:
  - **Formula**: (Top 5 Batsmen + Top 5 Bowlers + Wicketkeeper) / 11
  - **Batsman Score**: Average of (battingVsPace + battingVsSpin) / 2
  - **Bowler Score**: Max of (bowlingPace, bowlingSpin)
  - **Display**: Prominently on teams listing and detail pages
  - **Color Coding**: 80+ (Elite), 70-79 (Strong), 60-69 (Average), <60 (Weak)

- **WARNING COMPREHENSIVE SIMULATION CONTROL**: 
  - Admins need granular control over 30+ simulation parameters
  - Includes: probabilities, pitch conditions, phase multipliers, pressure factors
  - Simulation must be realistic (T20 average: 150-180 runs)
  - Must account for: matchups (pace vs spin), game phases, chase pressure
  
- **India ALL PLAYERS ARE INDIAN (v1)**: 
  - Current version: All players have nationality = "India"
  - Hide country/nationality field in UI
  - Player generator hardcodes country to "India"
  - Multi-national players planned for v2
  - Prepare database/UI structure for future multi-nationality support

- **Alarm TIMELINE & AGING SYSTEM (CRITICAL GAME MECHANIC)**:
  - **Time Conversion**: 1 real-world week = 1 game year
  - **Player Age Range**: 17-40 years old
  - **Daily Progression**: Game advances each real day (cron job at midnight)
  - **Age Effects**: 
    - Young players (17-22): High training effectiveness, rapid skill growth
    - Prime players (23-32): Peak performance, moderate skill growth
    - Veterans (33-40): Declining training effectiveness, skill degradation begins
    - Retirement: Automatic at age 40+
  - **Skill Degradation**:
    - Ages 33-36: -1 skill point per month
    - Ages 37-39: -2 skill points per month  
    - Ages 40+: -5 skill points per month + forced retirement
  - **Training Integration**: All training effectiveness multiplied by age modifier
  - **Youth Generation**: New 17-20 year old players generated to replace retirees
  - **Career Tracking**: Complete lifecycle from youth to retirement

### Technical Notes
- **Database Migration**: Several features require schema changes. Plan migrations carefully.
- **Breaking Changes**: The one-team-per-user constraint is a breaking change requiring data migration.
- **Testing**: No testing infrastructure in place. Consider adding before major features.
- **Documentation**: API documentation and user guides are needed.
- **Mobile Responsiveness**: Current UI is responsive but not fully optimized for mobile.

### Data Migration Required

- **User-Team Relationship**: Existing users with multiple teams need to be handled:
  - Option 1: Keep first team, delete others
  - Option 2: Keep first team, reassign others to new placeholder users
  - Option 3: Manual review and assignment by admin

- **Users Without Teams**: Create team automatically for any existing users without teams

- **Player Nationality**: Update all existing players to have `country: "India"`
  ```sql
  UPDATE Player SET country = 'India';
  ```

- **Player Skills Migration** (CRITICAL - Convert old simple skills to new split skills):
  ```sql
  -- Add new skill columns
  ALTER TABLE Player ADD COLUMN battingVsPace INTEGER DEFAULT 50;
  ALTER TABLE Player ADD COLUMN battingVsSpin INTEGER DEFAULT 50;
  ALTER TABLE Player ADD COLUMN bowlingPace INTEGER DEFAULT 50;
  ALTER TABLE Player ADD COLUMN bowlingSpin INTEGER DEFAULT 50;
  ALTER TABLE Player ADD COLUMN fieldingSkill INTEGER DEFAULT 50;
  ALTER TABLE Player ADD COLUMN wicketKeeping INTEGER DEFAULT 0;
  
  -- Migrate existing battingSkill to both pace and spin (equal split)
  UPDATE Player SET 
    battingVsPace = battingSkill,
    battingVsSpin = battingSkill;
  
  -- Migrate bowlingSkill based on bowling style
  UPDATE Player SET 
    bowlingPace = bowlingSkill 
  WHERE bowlingStyle IN ('FAST', 'MEDIUM');
  
  UPDATE Player SET 
    bowlingSpin = bowlingSkill 
  WHERE bowlingStyle IN ('SPIN_OFF', 'SPIN_LEG');
  
  -- Set fielding skill based on role
  UPDATE Player SET fieldingSkill = 60 WHERE role = 'ALL_ROUNDER';
  UPDATE Player SET fieldingSkill = 55 WHERE role = 'BATSMAN';
  UPDATE Player SET fieldingSkill = 45 WHERE role = 'BOWLER';
  UPDATE Player SET fieldingSkill = 70 WHERE role = 'WICKET_KEEPER';
  
  -- Set wicket keeping skill
  UPDATE Player SET wicketKeeping = 75 WHERE role = 'WICKET_KEEPER';
  UPDATE Player SET wicketKeeping = 0 WHERE role != 'WICKET_KEEPER';
  
  -- Optional: Drop old columns after verification
  -- ALTER TABLE Player DROP COLUMN battingSkill;
  -- ALTER TABLE Player DROP COLUMN bowlingSkill;
  ```

- **Player Age Assignment**: Assign ages to existing players (if any exist without age)
  ```sql
  -- Random age distribution for existing players
  UPDATE Player SET age = 17 + (RANDOM() % 24) WHERE age IS NULL;
  -- Ensure age is between 17-40
  ```

- **GameTime Initialization**: Create initial game time record
  ```sql
  INSERT INTO GameTime (id, currentDate, currentSeason, dayNumber, weekNumber)
  VALUES ('singleton', CURRENT_TIMESTAMP, '2025-26', 0, 0);
  ```

- **Player Age Fields**: Add new age-related fields to Player table
  - `peakAge`, `retirementAge`, `potentialGrowth`, `currentForm`
  - `careerStartDate`, `lastAgedDate`

- **Simulation Config Initialization**: Create default simulation config
  ```sql
  INSERT INTO SimulationConfig (
    name, isActive, 
    baseWicketProbability, extraProbability,
    battingSkillInfluence, bowlingSkillInfluence,
    -- ... all other defaults
  ) VALUES (
    'default', true,
    0.05, 0.08,
    0.08, 0.1,
    -- ... 
  );
  ```

### Registration & Onboarding Flow Changes

**Two-Step Process**:

**Step 1 - Registration** (`/auth/register`):
1. User fills in: Email, Password, Name (ONLY - keep it simple)
2. Create user account in database
3. Login user automatically after registration
4. Redirect to onboarding page

**Step 2 - Onboarding** (`/onboarding`):
1. Check if user already has a team (if yes, redirect to dashboard)
2. Show welcome message and team creation form
3. User fills in: Team Name, Short Name, Home Ground
4. Submit -> Create team with 15 Indian players (transaction)
5. Mark user as onboarded
6. Redirect to team dashboard

**Technical Implementation**:
- Use database transaction for team + players creation (atomicity)
- Add route protection: users without teams must complete onboarding
- Handle errors gracefully (rollback if any step fails)
- Optional: Add `hasCompletedOnboarding` boolean to User model for tracking

---

##  Quick Summary of Critical Changes

### Immediate Actions Required (Phase 0 - Days 1-3):
1.  Enforce 1 user = 1 team (add @unique constraint)
2.  Create separate onboarding page for team creation (NOT during registration)
3.  Registration: email, password, name ONLY (simple)
4.  Onboarding: ask for team name AFTER registration
5.  Set all players to Indian nationality
6.  Add simulation parameter control for admins

### Foundation System (Phase 1 - Weeks 1-2):
**Timeline & Aging System - THE MOST CRITICAL FEATURE**
- Build before training system (training depends on it)
- Build before league system (seasons depend on it)
- Requires background job infrastructure
- Impacts ALL future features

**Why Timeline is Critical:**
- Determines game progression pace
- Controls player lifecycle (youth -> prime -> decline -> retirement)
- Enables seasonal structure
- Foundation for training effectiveness
- Drives long-term engagement

### Core Dependencies:
```
Timeline System
    Dependencies:
    |-- Training System (uses age modifiers)
    |-- League System (uses seasons)
    |-- Player Management (retirement, youth generation)
    \-- Statistics (career tracking, historical data)
```

### Key Game Mechanics to Remember:

**Timeline & Aging**:
- **1 real week = 1 game year** (accelerated timeline)
- **Age range: 17-40 years**
- **Training effectiveness**: 120% at youth -> 100% at prime -> 60% at decline
- **Skill degradation**: Starts at age 33, accelerates at 37, retirement at 40

**Player Skills** (NEW - Enhanced System):
- **Batting**: Split into `battingVsPace` and `battingVsSpin`
- **Bowling**: Split into `bowlingPace` and `bowlingSpin`
- **Additional**: `fieldingSkill` and `wicketKeeping`
- **Matchup-based**: Pace bowler vs batsman's pace skill, spin bowler vs spin skill

**Team Rating**:
- Formula: (Top 5 Batsmen + Top 5 Bowlers + WK) / 11
- Display prominently on all team pages
- Color-coded: Elite (80+), Strong (70-79), Average (60-69), Weak (<60)

**Simulation Engine** (NEW - Comprehensive):
- 30+ configurable parameters
- Matchup-aware (pace vs spin)
- Phase-aware (powerplay/middle/death with different multipliers)
- Pressure-sensitive (chase situations, run rate requirements)
- Pitch conditions (bounce, turn, boundary size)
- Realistic scoring (T20 average: 150-180)

**General**:
- **All players Indian** (multi-national in v2)
- **Onboarding flow**: Team creation happens AFTER registration on separate page
- **Registration**: Simple (email, password, name only)
- **Onboarding**: Team details (name, short name, home ground)
- **1 user = 1 team** (enforced at DB level)

---

*Last Updated: October 16, 2025*
*Version: 1.4 - Separated Onboarding from Registration*
*Document Version: 1.4*
