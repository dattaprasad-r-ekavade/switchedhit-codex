import { Prisma } from '@prisma/client'

type PlayerRole = 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER'

const FIRST_NAMES = [
  'Arjun',
  'Dev',
  'Ishan',
  'Rohan',
  'Karan',
  'Yash',
  'Sameer',
  'Rahul',
  'Vikram',
  'Nikhil',
  'Aarav',
  'Manav',
  'Kabir',
  'Harsh',
  'Varun',
  'Siddharth',
  'Aditya',
  'Pranav',
  'Kunal',
  'Shrey',
  'Vivek',
  'Parth',
  'Tanish',
  'Irfan',
  'Farhan',
  'Jaspreet',
  'Navdeep',
  'Abhinav',
  'Samar',
  'Rehan',
]

const LAST_NAMES = [
  'Sharma',
  'Verma',
  'Patel',
  'Singh',
  'Khan',
  'Gupta',
  'Reddy',
  'Iyer',
  'Menon',
  'Kulkarni',
  'Chawla',
  'Nair',
  'Doshi',
  'Gill',
  'Yadav',
  'Pandey',
  'Mishra',
  'Bose',
  'Roy',
  'Naidu',
  'Ganguly',
  'Saxena',
  'Sethi',
  'Tripathi',
  'Deshpande',
  'Rawat',
  'Thakur',
  'Bisht',
  'Talwar',
  'Sodhi',
]

const COUNTRIES = [
  'India',
  'Sri Lanka',
  'Bangladesh',
  'Pakistan',
  'Australia',
  'New Zealand',
  'South Africa',
  'England',
  'West Indies',
  'Afghanistan',
]

const BATTING_STYLES = ['RIGHT_HAND', 'LEFT_HAND'] as const
const BOWLING_STYLES = ['FAST', 'MEDIUM', 'SPIN_OFF', 'SPIN_LEG'] as const

type RoleDistribution = {
  role: PlayerRole
  count: number
  battingRange: [number, number]
  bowlingRange: [number, number]
  requiresBowlingStyle?: boolean
}

const DEFAULT_ROLE_DISTRIBUTION: RoleDistribution[] = [
  { role: 'BATSMAN', count: 5, battingRange: [62, 92], bowlingRange: [5, 30] },
  { role: 'BOWLER', count: 5, battingRange: [10, 42], bowlingRange: [65, 95], requiresBowlingStyle: true },
  { role: 'ALL_ROUNDER', count: 3, battingRange: [55, 85], bowlingRange: [55, 85], requiresBowlingStyle: true },
  { role: 'WICKET_KEEPER', count: 2, battingRange: [50, 80], bowlingRange: [5, 25] },
]

const DEFAULT_SQUAD_SIZE = DEFAULT_ROLE_DISTRIBUTION.reduce((total, role) => total + role.count, 0)

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]
}

function generatePlayerName() {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`
}

function resolveRoleDistribution(targetSize: number): RoleDistribution[] {
  if (targetSize === DEFAULT_SQUAD_SIZE) {
    return DEFAULT_ROLE_DISTRIBUTION
  }

  const distribution = DEFAULT_ROLE_DISTRIBUTION.map((item) => ({ ...item }))
  let currentSize = distribution.reduce((total, role) => total + role.count, 0)

  while (currentSize < targetSize) {
    const index = currentSize % distribution.length
    distribution[index].count++
    currentSize++
  }

  return distribution
}

function uniqueJerseyNumber(used: Set<number>) {
  let jersey = randomInt(1, 99)

  while (used.has(jersey)) {
    jersey = randomInt(1, 99)
  }

  used.add(jersey)
  return jersey
}

function generatePlayerRecord(role: RoleDistribution['role'], config: RoleDistribution, usedNumbers: Set<number>): Prisma.PlayerCreateManyInput {
  const battingSkill = randomInt(config.battingRange[0], config.battingRange[1])
  const bowlingSkill = randomInt(config.bowlingRange[0], config.bowlingRange[1])
  const battingStyle = randomItem(BATTING_STYLES)
  const bowlingStyle =
    config.requiresBowlingStyle && role !== 'WICKET_KEEPER'
      ? randomItem(BOWLING_STYLES)
      : role === 'BOWLER'
        ? randomItem(BOWLING_STYLES)
        : role === 'ALL_ROUNDER'
          ? randomItem(BOWLING_STYLES)
          : null

  return {
    name: generatePlayerName(),
    role,
    battingStyle,
    bowlingStyle,
    battingSkill,
    bowlingSkill,
    jerseyNumber: uniqueJerseyNumber(usedNumbers),
    country: randomItem(COUNTRIES),
    age: randomInt(19, 36),
  }
}

export function generateTeamPlayers(
  squadSize: number = DEFAULT_SQUAD_SIZE
): Prisma.PlayerCreateManyInput[] {
  const usedNumbers = new Set<number>()
  const roleDistribution = resolveRoleDistribution(squadSize)

  const players: Prisma.PlayerCreateManyInput[] = []

  roleDistribution.forEach((roleConfig) => {
    for (let index = 0; index < roleConfig.count; index += 1) {
      players.push(generatePlayerRecord(roleConfig.role, roleConfig, usedNumbers))
    }
  })

  return players
}
