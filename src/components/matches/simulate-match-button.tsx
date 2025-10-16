'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type SimulateMatchButtonProps = {
  matchId: string
}

export function SimulateMatchButton({ matchId }: SimulateMatchButtonProps) {
  const router = useRouter()
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSimulate() {
    const confirmed = window.confirm(
      'Run the full simulation for this match? This will generate innings data and finalize the result.'
    )
    if (!confirmed) {
      return
    }

    setIsSimulating(true)
    setError(null)

    const response = await fetch(`/api/matches/${matchId}/simulate`, {
      method: 'POST'
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to simulate match.')
      setIsSimulating(false)
      return
    }

    setIsSimulating(false)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button onClick={handleSimulate} disabled={isSimulating} className="w-full md:w-auto">
        {isSimulating ? 'Simulating…' : 'Simulate match'}
      </Button>
    </div>
  )
}

