# Product Specifications - SwitchedHit

## Product Overview

**SwitchedHit** is a comprehensive T20 cricket simulation platform that enables users to create, manage, and compete with cricket teams in a structured multi-season league system. Built with modern web technologies, it provides realistic match simulations, strategic team management, and comprehensive performance tracking capabilities.

## Core Identity

- **Product Name**: SwitchedHit
- **Version**: 0.1.0
- **Platform Type**: Web Application
- **Target Audience**: Cricket enthusiasts, fantasy sports players, team managers, and league administrators
- **Primary Purpose**: T20 cricket team management and match simulation platform

## Technology Stack

### Frontend
- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (Built on Radix UI primitives)
- **Icons**: Lucide React

### Backend
- **Database**: SQLite (local, embedded)
- **ORM**: Prisma (v6.17.1)
- **Authentication**: NextAuth.js v4.24.11
- **Password Hashing**: bcryptjs

### Development Tools
- **Package Manager**: npm
- **TypeScript**: v5
- **ESLint**: Configured for Next.js

## Key Features & Capabilities

### 1. Authentication & Authorization

#### User Registration
- Email-based registration system
- Secure password hashing using bcrypt
- Automatic account creation with default USER role
- Form validation for email and password requirements

#### User Login
- Credential-based authentication via NextAuth
- Session management with secure tokens
- Persistent login sessions
- Protected route access based on authentication state

#### Role-Based Access Control (RBAC)
- **Two user roles**: USER and ADMIN
- Role-specific dashboard access
- Protected admin routes that only admins can access
- Automatic role assignment on registration (USER by default)

### 2. Team Management

#### Team Creation
- Create franchises with detailed metadata:
  - Team name (unique identifier)
  - Short name (abbreviation)
  - Home ground specification
  - Logo URL (optional)
  - Captain assignment
  - Coach information
  - Founding year
- Automatic ownership assignment to creator
- Available to both regular users and administrators

#### Team Information
- View comprehensive team details
- Track team ownership
- Monitor team statistics and performance
- Access historical match data

#### Team Roster Management
- Maintain squads with up to 15 players
- Auto-generated player squads using player generator
- Player role assignments:
  - BATSMAN
  - BOWLER
  - ALL_ROUNDER
  - WICKET_KEEPER

### 3. Player Management

#### Player Attributes
- **Basic Information**:
  - Name
  - Role (position)
  - Jersey number
  - Country
  - Age

- **Technical Attributes**:
  - Batting style (RIGHT_HAND, LEFT_HAND)
  - Bowling style (FAST, MEDIUM, SPIN_OFF, SPIN_LEG)
  - Batting skill (0-100 rating)
  - Bowling skill (0-100 rating)

#### Player Generation
- Automated player creation system
- Randomized attributes based on role
- Skill ratings generation (0-100 scale)
- Team assignment during creation

#### Player Performance Tracking
- Individual player statistics
- Performance metrics across matches
- Historical data preservation

### 4. Match Management

#### Match Scheduling
- Create and organize fixtures
- Schedule management with:
  - Match number
  - Venue selection
  - Date and time specification
  - Match type (T20, ODI, TEST)
  - Home and away team assignment

#### Match Status Tracking
- **Status Types**:
  - SCHEDULED: Upcoming matches
  - IN_PROGRESS: Currently simulating
  - COMPLETED: Finished matches
  - ABANDONED: Cancelled matches

#### Match Details
- Toss information (winner and decision)
- Match result documentation
- Winner determination
- Victory margin (by runs or wickets)
- Man of the Match selection

### 5. Match Simulation Engine

#### Ball-by-Ball Simulation
- Realistic cricket match simulation
- Physics-based probability calculations
- Skill-based outcome determination

#### Simulation Parameters
- **Batting outcomes**:
  - Dot balls (0 runs)
  - Singles (1 run)
  - Doubles (2 runs)
  - Boundaries (4 runs)
  - Sixes (6 runs)

- **Dismissal types**:
  - Bowled
  - Caught
  - LBW (Leg Before Wicket)
  - Stumped
  - Run Out

- **Extras**:
  - Wide balls
  - No balls
  - Byes
  - Leg byes

#### Skill-Based Mechanics
- Batting skill influences scoring probability
- Bowling skill affects wicket-taking chances
- Dynamic probability calculations based on player attributes
- Realistic match flow with strategic elements

#### Innings Management
- Two innings per T20 match (20 overs each)
- Real-time tracking of:
  - Total runs
  - Wickets fallen
  - Overs bowled
  - Extras conceded
- Target score calculation for second innings
- Chase scenario handling

### 6. Statistics & Analytics

#### Match Statistics
- Comprehensive ball-by-ball records
- Over-by-over progression
- Batting and bowling performances
- Innings summaries

#### Team Statistics
- Win/loss records
- Performance trends
- Head-to-head comparisons
- Historical match data

#### Performance Metrics
- Individual player statistics
- Team aggregate data
- Match outcomes and margins
- Man of the Match awards

### 7. User Interface Features

#### Responsive Design
- Mobile-friendly interface
- Desktop-optimized layouts
- Touch-friendly controls
- Adaptive components

#### Component Library (ShadCN UI)
- **Core Components**:
  - Buttons with variants
  - Cards for data display
  - Forms with validation
  - Dialogs and modals
  - Dropdowns and selects
  - Labels and inputs
  - Tabs for navigation
  - Toast notifications

#### Navigation
- Intuitive site navigation
- Role-based menu items
- Breadcrumb trails
- Quick access to key features

#### Forms
- **Team Creation Form**: Complete team setup with validation
- **Match Creation Form**: Schedule matches with team selection
- **Login/Register Forms**: Authentication interfaces
- **Player Management Forms**: Roster editing

### 8. Administrative Features

#### Admin Dashboard
- Protected admin-only access
- Comprehensive management tools
- System overview and statistics

#### League Management
- Create and configure leagues
- Manage team registrations
- Set league parameters
- Control season progression

#### Team Administration
- Override team settings
- Manage all teams in the system
- Bulk operations support

#### Match Administration
- Create matches between any teams
- Configure match lineups
- Adjust match parameters
- Test simulation accuracy

#### System Configuration
- Adjust core simulation parameters
- Validate score generation
- Fine-tune probability calculations
- Test and debug features

### 9. Database Schema

#### Core Entities
- **Users**: Authentication and role management
- **Teams**: Franchise information and ownership
- **Players**: Player data and attributes
- **Matches**: Match scheduling and results
- **Innings**: Innings-level data
- **Balls**: Ball-by-ball detailed records

#### Relationships
- Teams → Players (one-to-many)
- Teams → Matches (as home/away, many-to-many)
- Users → Teams (ownership, one-to-many)
- Matches → Innings (one-to-many)
- Innings → Balls (one-to-many)

#### Data Integrity
- Cascade delete for match-related data
- Indexed fields for query optimization
- Unique constraints on critical fields
- Timestamped records for audit trails

## Future Roadmap Features

### Planned Enhancements
1. **Multi-Season League System**
   - Promotion and relegation mechanics
   - League tables and standings
   - Season-based progression

2. **Training System**
   - Dynamic training sessions
   - Player skill improvement over time
   - Strategic development options

3. **Ground Customization**
   - Home ground advantages
   - Pitch condition settings:
     - Spin-friendly pitches
     - Pace-friendly pitches
     - Flat batting tracks
   - Venue-specific strategies

4. **Automated Scheduling**
   - Matches scheduled at specific times
   - Automatic simulation execution
   - Result notifications

5. **Enhanced Strategy**
   - Playing XI selection
   - Batting order customization
   - Bowling lineup management
   - Tactical decisions

## Technical Specifications

### Performance Requirements
- Fast page load times (<3 seconds)
- Responsive UI interactions
- Efficient database queries
- Optimized match simulations

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browser compatibility
- JavaScript enabled requirement

### Scalability Considerations
- SQLite for development and small deployments
- Migration path to PostgreSQL/MySQL for production
- Prisma ORM abstracts database differences
- Horizontal scaling potential with external databases

### Security Features
- Secure password hashing (bcrypt)
- Protected API routes
- Session-based authentication
- CSRF protection via NextAuth
- Environment variable management
- Role-based access control

### Data Management
- Automated database migrations via Prisma
- Seed data for testing and development
- Data validation at multiple layers
- Transaction support for critical operations

## Development & Deployment

### Development Server
- Local development at http://localhost:3000
- Hot module replacement
- Fast refresh for instant updates

### Build Process
- Next.js optimized production builds
- Static and dynamic page generation
- Asset optimization and minification
- TypeScript compilation

### Database Setup
- Prisma schema definitions
- Migration management system
- Database seeding capabilities
- Version control for schema changes

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Production build
- `npm run start`: Start production server
- `npm run lint`: Code quality checks
- `npm run db:seed`: Populate sample data

## User Workflows

### New User Journey
1. Register account with email and password
2. Login to access platform
3. Create team with basic information
4. Receive auto-generated player squad (15 players)
5. View team dashboard and statistics
6. Browse scheduled matches
7. Watch match simulations
8. Track team performance

### Admin Journey
1. Login with admin credentials
2. Access admin dashboard
3. Create and manage leagues
4. Schedule matches between teams
5. Configure match parameters
6. Run and test simulations
7. Monitor system-wide statistics
8. Manage users and teams

### Match Simulation Flow
1. Admin schedules match between two teams
2. System validates team selection
3. Players loaded from both teams
4. Simulation engine initiated
5. Ball-by-ball results generated
6. Innings data recorded
7. Match result calculated
8. Statistics updated
9. Results displayed to users

## Limitations & Constraints

### Current Limitations
- Single database (SQLite) - not suitable for high-concurrency production
- No real-time match streaming interface
- Limited mobile app (web-only currently)
- No multiplayer interactive features
- No payment/monetization system
- No social features (chat, forums, etc.)

### Known Technical Constraints
- SQLite concurrent write limitations
- Session-based authentication (no OAuth/SSO yet)
- Local file-based database only
- No CDN integration for assets

## Success Metrics

### Key Performance Indicators (KPIs)
- User registration and retention rates
- Number of teams created
- Matches simulated per day
- User engagement time
- Admin activity and management efficiency
- System uptime and reliability

### Quality Metrics
- Page load times
- Simulation accuracy and realism
- Bug/error rates
- User satisfaction scores

## Conclusion

SwitchedHit is a feature-rich T20 cricket simulation platform that successfully combines realistic match simulations with comprehensive team management capabilities. Built on modern web technologies with a focus on user experience and administrative control, it provides a solid foundation for cricket enthusiasts to engage with the sport in a virtual environment. The platform is currently in active development (v0.1.0) with a clear roadmap for future enhancements including multi-season leagues, training systems, and strategic gameplay elements.





Expected MVP Features

Abstract
SwitchedHit is a web and mobile-based platform designed to simulate cricket games among teams within a league across multiple seasons. Users can create and manage their own teams, receive auto-generated players, and engage in daily training to enhance player performance. The platform allows strategic adjustments to home grounds to leverage advantages such as spin, pace, or flat tracks. Teams compete within a structured league system, with promotion and relegation mechanics based on performance. 


Game Overview
SwitchedHit offers an immersive cricket simulation experience where users can build and manage their teams, strategize training regimens, and compete in dynamic leagues. The platform emphasizes strategic planning, team management, and competitive gameplay, providing both casual and dedicated cricket enthusiasts with an engaging environment to test their managerial skills.

Features
1. Team Management
Team Creation: Users can create their own cricket teams, selecting names, logos, and team colors.
Team Customization: Options to customize team jerseys, logos, and branding elements.
Roster Management: Manage player rosters, including adding, removing, and adjusting player roles.
2. Player Management
Auto-Generated Players: Receive randomly generated players with unique attributes and skills.
Player Attributes: Each player has attributes such as batting, bowling, fielding skills, stamina, and morale.
Player Roles: Categorize players as batsmen, bowlers, all-rounders, or wicketkeepers.
3. Training and Development
Training Modules: Daily training sessions to improve player attributes.
Special Training: Focused training to enhance specific skills (e.g., batting technique, bowling speed).
Player Progression: Track player development over seasons, unlocking new skills and higher performance levels.
4. Match Simulation
Scheduled Matches: Daily matches scheduled at fixed times.
Match Engine: Simulates cricket matches based on team strengths, player attributes, and home ground conditions.
Match Highlights: Generate summaries and key moments from simulated matches.
5. League System
League Structure: Multiple leagues with promotion and relegation systems.
Season Progression: Track team standings, points, and rankings over seasons.
Divisions: Upper leagues, middle leagues, and lower leagues to ensure competitive balance.
6. Home Ground Customization
Ground Selection: Choose or create home grounds with specific characteristics.
Ground Advantages: Customize grounds to favor spin, pace, or flat tracks, influencing match outcomes.
Ground Upgrades: Invest in improving ground facilities to gain additional advantages.
7. Daily Scheduling and Notifications
Match Scheduling: Automatic scheduling of matches and training sessions.
Notifications: Alerts for upcoming matches, training opportunities, auction events, and league updates.
