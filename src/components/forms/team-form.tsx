'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type TeamFormProps = {
  isAdmin?: boolean
}

export default function TeamForm({ isAdmin = false }: TeamFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const payload: Record<string, unknown> = {
      name: (formData.get('name') as string | null)?.trim(),
      shortName: (formData.get('shortName') as string | null)?.trim(),
      homeGround: (formData.get('homeGround') as string | null)?.trim() || null,
      captain: (formData.get('captain') as string | null)?.trim() || null,
      coach: (formData.get('coach') as string | null)?.trim() || null,
      founded: (formData.get('founded') as string | null)?.trim() || null,
      logoUrl: (formData.get('logoUrl') as string | null)?.trim() || null,
    }

    if (isAdmin) {
      payload.ownerEmail = (formData.get('ownerEmail') as string | null)?.trim() || undefined
      if (!payload.ownerEmail) {
        setError('Owner email is required when creating a team as an administrator.')
        return
      }
    }

    if (!payload.name || !payload.shortName) {
      setError('Team name and short name are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to create team.')
      setIsSubmitting(false)
      return
    }

    const data = await response.json()
    setIsSubmitting(false)

    if (data.teamId) {
      router.push(`/teams/${data.teamId}`)
      router.refresh()
    } else {
      router.push('/teams')
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
          <label htmlFor="name" className="text-sm font-medium">
            Team Name *
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Mumbai Indians"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="shortName" className="text-sm font-medium">
            Short Name *
          </label>
          <input
            id="shortName"
            name="shortName"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="MI"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="homeGround" className="text-sm font-medium">
            Home Ground
          </label>
          <input
            id="homeGround"
            name="homeGround"
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Wankhede Stadium"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="founded" className="text-sm font-medium">
            Founded Year
          </label>
          <input
            id="founded"
            name="founded"
            type="number"
            min="1850"
            max={new Date().getFullYear()}
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="2008"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="captain" className="text-sm font-medium">
            Captain
          </label>
          <input
            id="captain"
            name="captain"
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Rohit Sharma"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="coach" className="text-sm font-medium">
            Coach
          </label>
          <input
            id="coach"
            name="coach"
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Mahela Jayawardene"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="logoUrl" className="text-sm font-medium">
          Logo URL
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="https://example.com/logo.png"
        />
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <label htmlFor="ownerEmail" className="text-sm font-medium">
            Owner email *
          </label>
          <input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="manager@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Teams must belong to a non-admin user. Provide the manager&apos;s email to assign ownership.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A balanced squad of 15 players with randomized skill ratings is generated automatically for every new team.
      </p>

      <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
        {isSubmitting ? 'Creating team...' : 'Create team'}
      </Button>
    </form>
  )
}
