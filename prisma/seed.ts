import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'
import { generateTeamPlayers } from '../src/lib/player-generator'
import { BALANCED_SIMULATION_CONFIG } from '../src/lib/simulation-config-presets'

const prisma = new PrismaClient()

async function main() {
  const adminPasswordHash = await hash('admin123', 10)
  const userPasswordHash = await hash('user123', 10)
  const testPasswordHash = await hash('test@test.com', 10)

  await prisma.ball.deleteMany()
  await prisma.innings.deleteMany()
  await prisma.match.deleteMany()
  await prisma.simulationConfig.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@switchedhit.com' },
    update: {},
    create: {
      email: 'admin@switchedhit.com',
      name: 'League Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      hasCompletedOnboarding: true,
    },
  })

  const teamManagerOne = await prisma.user.upsert({
    where: { email: 'manager.one@switchedhit.com' },
    update: {},
    create: {
      email: 'manager.one@switchedhit.com',
      name: 'Chennai Manager',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      hasCompletedOnboarding: true,
    },
  })

  const teamManagerTwo = await prisma.user.upsert({
    where: { email: 'manager.two@switchedhit.com' },
    update: {},
    create: {
      email: 'manager.two@switchedhit.com',
      name: 'Bangalore Manager',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      hasCompletedOnboarding: true,
    },
  })

  const testUser = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      name: 'Test User',
      passwordHash: testPasswordHash,
      role: UserRole.USER,
      hasCompletedOnboarding: true,
    },
  })

  // Create teams
  const mumbaiIndians = await prisma.team.create({
    data: {
      name: 'Mumbai Indians',
      shortName: 'MI',
      homeGround: 'Wankhede Stadium',
      captain: 'Rohit Sharma',
      coach: 'Mahela Jayawardene',
      founded: 2008,
      ownerId: adminUser.id,
    }
  })

  const chennaiSuperKings = await prisma.team.create({
    data: {
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      homeGround: 'MA Chidambaram Stadium',
      captain: 'MS Dhoni',
      coach: 'Stephen Fleming',
      founded: 2008,
      ownerId: teamManagerOne.id,
    }
  })

  const royalChallengers = await prisma.team.create({
    data: {
      name: 'Royal Challengers Bangalore',
      shortName: 'RCB',
      homeGround: 'M. Chinnaswamy Stadium',
      captain: 'Faf du Plessis',
      coach: 'Sanjay Bangar',
      founded: 2008,
      ownerId: teamManagerTwo.id,
    }
  })

  const testTeam = await prisma.team.create({
    data: {
      name: 'Test Warriors',
      shortName: 'TW',
      homeGround: 'Test Stadium',
      captain: 'Test Captain',
      coach: 'Test Coach',
      founded: 2024,
      ownerId: testUser.id,
    }
  })

  const createSquad = (teamId: string) =>
    generateTeamPlayers().map((player) => ({
      ...player,
      teamId,
    }))

  await prisma.player.createMany({
    data: createSquad(mumbaiIndians.id),
  })

  await prisma.player.createMany({
    data: createSquad(chennaiSuperKings.id),
  })

  await prisma.player.createMany({
    data: createSquad(royalChallengers.id),
  })

  await prisma.player.createMany({
    data: createSquad(testTeam.id),
  })

  // Create sample matches
  await prisma.match.createMany({
    data: [
      {
        matchNumber: 1,
        venue: 'Wankhede Stadium',
        date: new Date('2024-03-15'),
        matchType: 'T20',
        status: 'SCHEDULED',
        homeTeamId: mumbaiIndians.id,
        awayTeamId: chennaiSuperKings.id,
      },
      {
        matchNumber: 2,
        venue: 'M. Chinnaswamy Stadium',
        date: new Date('2024-03-18'),
        matchType: 'T20',
        status: 'SCHEDULED',
        homeTeamId: royalChallengers.id,
        awayTeamId: mumbaiIndians.id,
      },
      {
        matchNumber: 3,
        venue: 'MA Chidambaram Stadium',
        date: new Date('2024-03-22'),
        matchType: 'T20',
        status: 'SCHEDULED',
        homeTeamId: chennaiSuperKings.id,
        awayTeamId: royalChallengers.id,
      }
    ]
  })

  // Create default simulation configuration
  await prisma.simulationConfig.create({
    data: {
      ...BALANCED_SIMULATION_CONFIG,
      notes: BALANCED_SIMULATION_CONFIG.notes ?? 'Balanced default tuning used for initial production rollout.',
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
