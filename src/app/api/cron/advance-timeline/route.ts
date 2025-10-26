import { NextResponse } from 'next/server'
import { advanceTimeline } from '@/lib/timeline'

// Allow longer execution time for processing aging logic
export const maxDuration = 60

/**
 * Webhook endpoint for automated timeline advancement
 * 
 * This endpoint should be called by an external cron service (e.g., cron-job.org, GitHub Actions)
 * to advance the game timeline and trigger player aging.
 * 
 * Authentication: Requires a Bearer token matching CRON_SECRET environment variable
 * 
 * @example
 * curl -X POST https://your-app.vercel.app/api/cron/advance-timeline \
 *   -H "Authorization: Bearer your-secret-key"
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== expectedAuth) {
      console.warn('Unauthorized cron attempt:', {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body for optional days parameter
    const body = await request.json().catch(() => ({}))
    const days = typeof body.days === 'number' && body.days > 0 ? body.days : 1

    // Advance timeline
    const gameTime = await advanceTimeline(days)

    return NextResponse.json({
      success: true,
      gameTime: {
        currentDate: gameTime.currentDate,
        currentSeason: gameTime.currentSeason,
        dayNumber: gameTime.dayNumber,
        weekNumber: gameTime.weekNumber,
      },
      advanced: days,
      message: `Timeline advanced by ${days} day(s)`,
    })
  } catch (error) {
    console.error('Failed to advance timeline via cron:', error)
    return NextResponse.json(
      {
        error: 'Failed to advance timeline',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Optional: Allow GET for health check
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/cron/advance-timeline',
    message: 'Cron webhook is configured correctly',
  })
}
