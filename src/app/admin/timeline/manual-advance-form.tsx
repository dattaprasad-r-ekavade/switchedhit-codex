'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ManualAdvanceFormProps = {
  currentDay: number
}

export default function ManualAdvanceForm({ currentDay }: ManualAdvanceFormProps) {
  const router = useRouter()
  const [days, setDays] = useState<number>(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function advance(daysToAdvance: number) {
    setError(null)

    const response = await fetch('/api/timeline/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: daysToAdvance }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to advance timeline.')
      return
    }

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="advance-days" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Days to advance
          </label>
          <input
            id="advance-days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          type="button"
          onClick={() => advance(days)}
          disabled={isPending}
        >
          {isPending ? 'Advancing...' : `Advance ${days} day${days > 1 ? 's' : ''}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => advance(7)}
          disabled={isPending}
        >
          {isPending ? 'Advancing...' : 'Advance 1 week'}
        </Button>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Current game day: <span className="font-semibold text-foreground">{currentDay}</span>
      </p>
    </div>
  )
}

