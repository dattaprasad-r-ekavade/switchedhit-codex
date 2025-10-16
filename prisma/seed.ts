import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPasswordHash = await hash('admin123', 10)
  const userPasswordHash = await hash('user123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@switchedhit.com' },
    update: {},
    create: {
      email: 'admin@switchedhit.com',
      name: 'League Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  })

  const standardUser = await prisma.user.upsert({
    where: { email: 'user@switchedhit.com' },
    update: {},
    create: {
      email: 'user@switchedhit.com',
      name: 'Team Manager',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
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
      ownerId: standardUser.id,
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
      ownerId: standardUser.id,
    }
  })

  // Create players for Mumbai Indians
  await prisma.player.createMany({
    data: [
      { name: 'Rohit Sharma', role: 'BATSMAN', battingStyle: 'RIGHT_HAND', jerseyNumber: 45, country: 'India', age: 36, teamId: mumbaiIndians.id },
      { name: 'Ishan Kishan', role: 'WICKET_KEEPER', battingStyle: 'LEFT_HAND', jerseyNumber: 32, country: 'India', age: 25, teamId: mumbaiIndians.id },
      { name: 'Suryakumar Yadav', role: 'BATSMAN', battingStyle: 'RIGHT_HAND', jerseyNumber: 63, country: 'India', age: 33, teamId: mumbaiIndians.id },
      { name: 'Jasprit Bumrah', role: 'BOWLER', bowlingStyle: 'FAST', jerseyNumber: 93, country: 'India', age: 30, teamId: mumbaiIndians.id },
      { name: 'Hardik Pandya', role: 'ALL_ROUNDER', battingStyle: 'RIGHT_HAND', bowlingStyle: 'MEDIUM', jerseyNumber: 33, country: 'India', age: 30, teamId: mumbaiIndians.id },
    ]
  })

  // Create players for Chennai Super Kings
  await prisma.player.createMany({
    data: [
      { name: 'MS Dhoni', role: 'WICKET_KEEPER', battingStyle: 'RIGHT_HAND', jerseyNumber: 7, country: 'India', age: 42, teamId: chennaiSuperKings.id },
      { name: 'Ravindra Jadeja', role: 'ALL_ROUNDER', battingStyle: 'LEFT_HAND', bowlingStyle: 'SPIN_OFF', jerseyNumber: 8, country: 'India', age: 35, teamId: chennaiSuperKings.id },
      { name: 'Ruturaj Gaikwad', role: 'BATSMAN', battingStyle: 'RIGHT_HAND', jerseyNumber: 31, country: 'India', age: 27, teamId: chennaiSuperKings.id },
      { name: 'Deepak Chahar', role: 'BOWLER', bowlingStyle: 'MEDIUM', jerseyNumber: 90, country: 'India', age: 31, teamId: chennaiSuperKings.id },
      { name: 'Devon Conway', role: 'BATSMAN', battingStyle: 'LEFT_HAND', jerseyNumber: 88, country: 'New Zealand', age: 32, teamId: chennaiSuperKings.id },
    ]
  })

  // Create players for Royal Challengers Bangalore
  await prisma.player.createMany({
    data: [
      { name: 'Faf du Plessis', role: 'BATSMAN', battingStyle: 'RIGHT_HAND', jerseyNumber: 18, country: 'South Africa', age: 39, teamId: royalChallengers.id },
      { name: 'Virat Kohli', role: 'BATSMAN', battingStyle: 'RIGHT_HAND', jerseyNumber: 18, country: 'India', age: 35, teamId: royalChallengers.id },
      { name: 'Glenn Maxwell', role: 'ALL_ROUNDER', battingStyle: 'RIGHT_HAND', bowlingStyle: 'SPIN_OFF', jerseyNumber: 32, country: 'Australia', age: 35, teamId: royalChallengers.id },
      { name: 'Mohammed Siraj', role: 'BOWLER', bowlingStyle: 'FAST', jerseyNumber: 13, country: 'India', age: 30, teamId: royalChallengers.id },
      { name: 'Dinesh Karthik', role: 'WICKET_KEEPER', battingStyle: 'RIGHT_HAND', jerseyNumber: 5, country: 'India', age: 38, teamId: royalChallengers.id },
    ]
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
