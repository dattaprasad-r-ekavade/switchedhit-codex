'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { deriveShortName } from '@/lib/team-utils'
import { Button } from '@/components/ui/button'

export default function OnboardingForm() {
  const router = useRouter()
  const { update } = useSession()
  const [teamName, setTeamName] = useState('')
  const [shortName, setShortName] = useState('')
  const [homeGround, setHomeGround] = useState('')
  const [isShortNameDirty, setIsShortNameDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTeamNameChange(value: string) {
    setTeamName(value)

    if (!isShortNameDirty) {
      setShortName(deriveShortName(value))
    }
  }

  function handleShortNameChange(value: string) {
    setShortName(value.toUpperCase())
    setIsShortNameDirty(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!teamName.trim()) {
      setError('Please provide a team name.')
      return
    }

    if (!shortName.trim() || shortName.trim().length < 2) {
      setError('Short name must be at least 2 characters.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const response = await fetch('/api/onboarding/create-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamName: teamName.trim(),
        shortName: shortName.trim(),
        homeGround: homeGround.trim() || null,
      }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to create team.')
      return
    }

    const data = await response.json()

    // Update session to reflect the completed onboarding status
    await update()

    if (data.teamId) {
      router.replace(`/teams/${data.teamId}`)
      router.refresh()
    } else {
      router.replace('/teams')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="teamName" className="text-sm font-medium">
          Team name *
        </label>
        <input
          id="teamName"
          name="teamName"
          value={teamName}
          onChange={(event) => handleTeamNameChange(event.target.value)}
          autoFocus
          className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Mumbai Mavericks"
        />
        <p className="text-xs text-muted-foreground">
          Choose something unique—this will be shown across the platform.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="shortName" className="text-sm font-medium">
          Short name *
        </label>
        <input
          id="shortName"
          name="shortName"
          value={shortName}
          onChange={(event) => handleShortNameChange(event.target.value)}
          className="w-full rounded-md border px-3 py-2 uppercase tracking-wide focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="MM"
        />
        <p className="text-xs text-muted-foreground">
          Used for scorecards and tables. We auto-generate this from your team name.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="homeGround" className="text-sm font-medium">
          Home ground
        </label>
        <input
          id="homeGround"
          name="homeGround"
          value={homeGround}
          onChange={(event) => setHomeGround(event.target.value)}
          className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Wankhede Stadium"
        />
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
        {isSubmitting ? 'Creating your squad...' : 'Create my team'}
      </Button>
    </form>
  )
}
