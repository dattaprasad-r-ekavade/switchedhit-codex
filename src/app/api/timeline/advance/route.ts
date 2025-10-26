import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { advanceTimeline, getGameTime } from '@/lib/timeline'

type AdvanceBody = {
  days?: number
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const gameTime = await getGameTime()

  return NextResponse.json({ gameTime })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const payload = (await request.json().catch(() => ({}))) as AdvanceBody
  const days = Number.isFinite(payload.days) ? Math.max(1, Math.floor(payload.days as number)) : 1

  const gameTime = await advanceTimeline(days)

  return NextResponse.json({ gameTime })
}

