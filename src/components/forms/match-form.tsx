'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type TeamOption = {
  id: string
  name: string
  shortName?: string | null
}

type MatchFormProps = {
  teams: TeamOption[]
}

const MATCH_TYPES = ['T20', 'ODI', 'TEST'] as const

export default function MatchForm({ teams }: MatchFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedTeams = useMemo(
    () =>
      [...teams].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      ),
    [teams]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const homeTeamId = (formData.get('homeTeamId') as string | null)?.trim()
    const awayTeamId = (formData.get('awayTeamId') as string | null)?.trim()
    const venue = (formData.get('venue') as string | null)?.trim()
    const dateInput = (formData.get('date') as string | null)?.trim()
    const matchType = (formData.get('matchType') as string | null)?.trim()
    const matchNumberRaw = (formData.get('matchNumber') as string | null)?.trim()

    if (!homeTeamId || !awayTeamId) {
      setError('Select both home and away teams.')
      return
    }

    if (homeTeamId === awayTeamId) {
      setError('Home and away team must be different.')
      return
    }

    if (!venue) {
      setError('Venue is required.')
      return
    }

    if (!dateInput) {
      setError('Match date and time are required.')
      return
    }

    if (!matchType) {
      setError('Match type is required.')
      return
    }

    const scheduledAt = new Date(dateInput)
    if (Number.isNaN(scheduledAt.getTime())) {
      setError('Provide a valid date and time.')
      return
    }

    const matchNumber =
      matchNumberRaw && !Number.isNaN(Number(matchNumberRaw))
        ? Number(matchNumberRaw)
        : undefined

    setIsSubmitting(true)
    setError(null)

    const response = await fetch('/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        homeTeamId,
        awayTeamId,
        venue,
        date: scheduledAt.toISOString(),
        matchType,
        matchNumber
      })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to schedule match.')
      setIsSubmitting(false)
      return
    }

    const data = await response.json()
    setIsSubmitting(false)

    if (data.matchId) {
      router.push(`/matches/${data.matchId}`)
      router.refresh()
    } else {
      router.push('/matches')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="homeTeamId" className="text-sm font-medium">
            Home Team *
          </label>
          <select
            id="homeTeamId"
            name="homeTeamId"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            defaultValue=""
          >
            <option value="" disabled>
              Select home team
            </option>
            {sortedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="awayTeamId" className="text-sm font-medium">
            Away Team *
          </label>
          <select
            id="awayTeamId"
            name="awayTeamId"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            defaultValue=""
          >
            <option value="" disabled>
              Select away team
            </option>
            {sortedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">
            Match Date &amp; Time *
          </label>
          <input
            id="date"
            name="date"
            type="datetime-local"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Time is saved in UTC. Ensure squads exist for both teams.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="matchType" className="text-sm font-medium">
            Match Type *
          </label>
          <select
            id="matchType"
            name="matchType"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            defaultValue="T20"
          >
            {MATCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="venue" className="text-sm font-medium">
            Venue *
          </label>
          <input
            id="venue"
            name="venue"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Eden Gardens"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="matchNumber" className="text-sm font-medium">
            Match Number
          </label>
          <input
            id="matchNumber"
            name="matchNumber"
            type="number"
            min="1"
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Auto assigns next number if left blank"
          />
        </div>
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
        {isSubmitting ? 'Scheduling...' : 'Schedule match'}
      </Button>
    </form>
  )
}

