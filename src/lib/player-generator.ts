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

const BATTING_STYLES = ['RIGHT_HAND', 'LEFT_HAND'] as const
const BOWLING_STYLES = ['FAST', 'MEDIUM', 'SPIN_OFF', 'SPIN_LEG'] as const

type RoleDistribution = {
  role: PlayerRole
  count: number
  requiresBowlingStyle?: boolean
}

const DEFAULT_ROLE_DISTRIBUTION: RoleDistribution[] = [
  { role: 'BATSMAN', count: 5 },
  { role: 'BOWLER', count: 5, requiresBowlingStyle: true },
  { role: 'ALL_ROUNDER', count: 3, requiresBowlingStyle: true },
  { role: 'WICKET_KEEPER', count: 2 },
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

function resolveBowlingStyle(role: PlayerRole, config: RoleDistribution) {
  if (role === 'WICKET_KEEPER') {
    return null
  }

  if (config.requiresBowlingStyle || role === 'BOWLER' || role === 'ALL_ROUNDER') {
    return randomItem(BOWLING_STYLES)
  }

  return null
}

function generateSkillProfile(
  role: PlayerRole,
  bowlingStyle: (typeof BOWLING_STYLES)[number] | null
) {
  const battingVsPace =
    role === 'BATSMAN' || role === 'WICKET_KEEPER'
      ? randomInt(64, 94)
      : role === 'ALL_ROUNDER'
        ? randomInt(58, 88)
        : randomInt(22, 48)

  const battingVsSpin =
    role === 'BATSMAN' || role === 'WICKET_KEEPER'
      ? randomInt(60, 92)
      : role === 'ALL_ROUNDER'
        ? randomInt(55, 86)
        : randomInt(20, 45)

  let bowlingPace = randomInt(4, 18)
  let bowlingSpin = randomInt(4, 18)

  if (role === 'BOWLER' || role === 'ALL_ROUNDER') {
    if (bowlingStyle === 'FAST' || bowlingStyle === 'MEDIUM') {
      bowlingPace = randomInt(70, 96)
      bowlingSpin = role === 'ALL_ROUNDER' ? randomInt(38, 66) : randomInt(10, 32)
    } else {
      bowlingSpin = randomInt(68, 94)
      bowlingPace = role === 'ALL_ROUNDER' ? randomInt(42, 70) : randomInt(10, 32)
    }
  }

  const fieldingSkill =
    role === 'BOWLER'
      ? randomInt(48, 82)
      : role === 'ALL_ROUNDER'
        ? randomInt(55, 88)
        : randomInt(52, 92)

  const wicketKeeping = role === 'WICKET_KEEPER' ? randomInt(75, 96) : 0

  const battingSkill = Math.round((battingVsPace + battingVsSpin) / 2)
  const bowlingSkill = Math.round((bowlingPace + bowlingSpin) / 2)

  return {
    battingVsPace,
    battingVsSpin,
    bowlingPace,
    bowlingSpin,
    fieldingSkill,
    wicketKeeping,
    battingSkill,
    bowlingSkill,
  }
}

function generatePlayerRecord(
  role: RoleDistribution['role'],
  config: RoleDistribution,
  usedNumbers: Set<number>
): Prisma.PlayerCreateManyInput {
  const battingStyle = randomItem(BATTING_STYLES)
  const bowlingStyle = resolveBowlingStyle(role, config)
  const skills = generateSkillProfile(role, bowlingStyle)

  return {
    name: generatePlayerName(),
    role,
    battingStyle,
    bowlingStyle,
    battingSkill: skills.battingSkill,
    bowlingSkill: skills.bowlingSkill,
    battingVsPace: skills.battingVsPace,
    battingVsSpin: skills.battingVsSpin,
    bowlingPace: skills.bowlingPace,
    bowlingSpin: skills.bowlingSpin,
    fieldingSkill: skills.fieldingSkill,
    wicketKeeping: skills.wicketKeeping,
    jerseyNumber: uniqueJerseyNumber(usedNumbers),
    country: 'India',
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

