// T20 Match Simulation Engine

export interface PlayerStats {
  name: string
  role: string
  battingSkill: number // 0-100
  bowlingSkill: number // 0-100
}

export interface BallResult {
  runs: number
  isWicket: boolean
  isExtra: boolean
  extraType?: string
  wicketType?: string
  batsmanName: string
  bowlerName: string
}

export interface InningsResult {
  totalRuns: number
  totalWickets: number
  totalOvers: number
  balls: BallResult[]
}

export class CricketSimulator {
  private random() {
    return Math.random()
  }

  private getRandomInt(min: number, max: number) {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  private simulateBall(batsman: PlayerStats, bowler: PlayerStats): BallResult {
    const battingAdvantage = batsman.battingSkill / 100
    const bowlingAdvantage = bowler.bowlingSkill / 100
    
    // Calculate probabilities
    const wicketProbability = 0.05 + (bowlingAdvantage * 0.1) - (battingAdvantage * 0.08)
    const extraProbability = 0.08
    
    const roll = this.random()
    
    // Check for extra
    if (roll < extraProbability) {
      const extraType = this.random() < 0.6 ? 'WIDE' : 'NO_BALL'
      return {
        runs: 1,
        isWicket: false,
        isExtra: true,
        extraType,
        batsmanName: batsman.name,
        bowlerName: bowler.name
      }
    }
    
    // Check for wicket
    if (roll < wicketProbability + extraProbability) {
      const wicketTypes = ['BOWLED', 'CAUGHT', 'LBW', 'STUMPED', 'RUN_OUT']
      return {
        runs: 0,
        isWicket: true,
        isExtra: false,
        wicketType: wicketTypes[this.getRandomInt(0, wicketTypes.length - 1)],
        batsmanName: batsman.name,
        bowlerName: bowler.name
      }
    }
    
    // Normal ball - calculate runs
    const runsRoll = this.random() + (battingAdvantage * 0.3)
    let runs = 0
    
    if (runsRoll > 0.95) runs = 6      // Six
    else if (runsRoll > 0.85) runs = 4  // Four
    else if (runsRoll > 0.70) runs = 2  // Two
    else if (runsRoll > 0.50) runs = 1  // Single
    else runs = 0                        // Dot ball
    
    return {
      runs,
      isWicket: false,
      isExtra: false,
      batsmanName: batsman.name,
      bowlerName: bowler.name
    }
  }

  public simulateInnings(
    battingPlayers: PlayerStats[],
    bowlingPlayers: PlayerStats[],
    maxOvers: number = 20
  ): InningsResult {
    let totalRuns = 0
    let totalWickets = 0
    let totalBalls = 0
    const balls: BallResult[] = []
    
    let currentBatsmanIndex = 0
    let currentBowlerIndex = 0
    
    const maxBalls = maxOvers * 6
    
    while (totalBalls < maxBalls && totalWickets < 10) {
      const batsman = battingPlayers[currentBatsmanIndex]
      const bowler = bowlingPlayers[currentBowlerIndex % bowlingPlayers.length]
      
      const ball = this.simulateBall(batsman, bowler)
      balls.push(ball)
      
      if (!ball.isExtra) {
        totalBalls++
      }
      
      totalRuns += ball.runs
      
      if (ball.isWicket) {
        totalWickets++
        currentBatsmanIndex++
        if (currentBatsmanIndex >= battingPlayers.length) {
          break
        }
      }
      
      // Change bowler every over
      if (totalBalls % 6 === 0) {
        currentBowlerIndex++
      }
    }
    
    return {
      totalRuns,
      totalWickets,
      totalOvers: totalBalls / 6,
      balls
    }
  }

  public determineWinner(
    firstInnings: InningsResult,
    secondInnings: InningsResult
  ): {
    winner: 'TEAM1' | 'TEAM2' | 'TIE'
    margin: number
    marginType: 'RUNS' | 'WICKETS'
  } {
    if (firstInnings.totalRuns > secondInnings.totalRuns) {
      return {
        winner: 'TEAM1',
        margin: firstInnings.totalRuns - secondInnings.totalRuns,
        marginType: 'RUNS'
      }
    } else if (secondInnings.totalRuns > firstInnings.totalRuns) {
      return {
        winner: 'TEAM2',
        margin: 10 - secondInnings.totalWickets,
        marginType: 'WICKETS'
      }
    } else {
      return {
        winner: 'TIE',
        margin: 0,
        marginType: 'RUNS'
      }
    }
  }
}
