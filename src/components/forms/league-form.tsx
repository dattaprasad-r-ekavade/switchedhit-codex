'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TeamOption = {
  id: string
  name: string
  shortName?: string | null
  homeGround?: string | null
}

type LeagueFormProps = {
  teams: TeamOption[]
  defaultSeason: string
}

const MAX_TIERS = 10

export default function LeagueForm({ teams, defaultSeason }: LeagueFormProps) {
  const router = useRouter()
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedTeams = useMemo(
    () =>
      [...teams].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [teams],
  )

  function toggleTeamSelection(teamId: string) {
    setSelectedTeams((current) =>
      current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const name = (formData.get('name') as string | null)?.trim()
    const tierRaw = (formData.get('tier') as string | null)?.trim()
    const season = (formData.get('season') as string | null)?.trim()
    const maxTeamsRaw = (formData.get('maxTeams') as string | null)?.trim()
    const startDateRaw = (formData.get('startDate') as string | null)?.trim()

    if (!name) {
      setError('League name is required.')
      return
    }

    if (selectedTeams.length < 2) {
      setError('Select at least two teams to create a league.')
      return
    }

    const tier = tierRaw ? Number(tierRaw) : undefined
    if (!tier || Number.isNaN(tier) || tier < 1 || tier > MAX_TIERS) {
      setError(`Tier must be a number between 1 and ${MAX_TIERS}.`)
      return
    }

    const maxTeams = maxTeamsRaw ? Number(maxTeamsRaw) : undefined
    if (maxTeams && (Number.isNaN(maxTeams) || maxTeams < selectedTeams.length)) {
      setError('Maximum teams cannot be less than the number of selected teams.')
      return
    }

    const payload: Record<string, unknown> = {
      name,
      tier,
      season: season || undefined,
      maxTeams: maxTeams || undefined,
      teamIds: selectedTeams,
    }

    if (startDateRaw) {
      const parsed = new Date(startDateRaw)
      if (Number.isNaN(parsed.getTime())) {
        setError('Provided start date is invalid.')
        return
      }
      payload.startDate = parsed.toISOString()
    }

    setIsSubmitting(true)
    setError(null)

    const response = await fetch('/api/leagues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to create league.')
      setIsSubmitting(false)
      return
    }

    const data = await response.json()
    setIsSubmitting(false)

    if (data.leagueId) {
      router.push(`/leagues/${data.leagueId}`)
    } else {
      router.push('/admin/leagues')
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            League name *
          </label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Premier Division"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="season" className="text-sm font-medium">
            Season *
          </label>
          <Input
            id="season"
            name="season"
            required
            defaultValue={defaultSeason}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="tier" className="text-sm font-medium">
            Tier (1 = top tier) *
          </label>
          <Input
            id="tier"
            name="tier"
            type="number"
            min={1}
            max={MAX_TIERS}
            required
            defaultValue={1}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="maxTeams" className="text-sm font-medium">
            Maximum teams
          </label>
          <Input
            id="maxTeams"
            name="maxTeams"
            type="number"
            min={selectedTeams.length || 2}
            placeholder="Defaults to 16 if left blank"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="startDate" className="text-sm font-medium">
          Season start date
        </label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
        />
        <p className="text-xs text-muted-foreground">
          Fixtures are generated in a double round-robin format with two days between matches.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Participating teams ({selectedTeams.length})
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTeams([])}
            disabled={selectedTeams.length === 0}
          >
            Clear selection
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedTeams.map((team) => {
            const isSelected = selectedTeams.includes(team.id)
            return (
              <label
                key={team.id}
                className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="font-medium">{team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.shortName ? `${team.shortName} • ` : ''}
                    {team.homeGround || 'Home ground TBD'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="size-4"
                  checked={isSelected}
                  onChange={() => toggleTeamSelection(team.id)}
                />
              </label>
            )
          })}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? 'Creating league...' : 'Create league'}
      </Button>
    </form>
  )
}
