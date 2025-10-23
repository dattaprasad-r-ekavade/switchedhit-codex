'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SimulationConfigValues } from '@/lib/simulation-config-presets'
import type { SimulationTuning } from '@/lib/simulation'

export type SerializedConfig = SimulationTuning & {
  id: string
  name: string
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

type PresetDefinition = {
  id: string
  label: string
  values: SimulationConfigValues
}

type TabId = 'basic' | 'advanced' | 'pitch' | 'fielding' | 'test'

type ConfigFormState = SimulationConfigValues & {
  id?: string
}

type ManagerProps = {
  initialConfigs: SerializedConfig[]
  activeConfigId: string | null
  presets: PresetDefinition[]
  defaults: SimulationConfigValues
}

type NumericField = Exclude<keyof SimulationConfigValues, 'name' | 'notes' | 'isActive'>

type FieldDefinition = {
  key: NumericField
  label: string
  hint?: string
  step?: number
}

type FieldGroup = {
  tab: TabId
  title: string
  description: string
  fields: FieldDefinition[]
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    tab: 'basic',
    title: 'Base probabilities',
    description: 'Control wicket frequency, extras, and skill influence on every delivery.',
    fields: [
      { key: 'baseWicketProbability', label: 'Base wicket probability', hint: 'Starting chance before skill modifiers.', step: 0.01 },
      { key: 'extraProbability', label: 'Base extra probability', hint: 'Baseline chance for wides/no-balls.', step: 0.01 },
      { key: 'battingSkillInfluence', label: 'Batting skill influence', hint: 'Positive values reward stronger batting.', step: 0.01 },
      { key: 'bowlingSkillInfluence', label: 'Bowling skill influence', hint: 'Positive values reward stronger bowling.', step: 0.01 },
      { key: 'fieldingSkillInfluence', label: 'Fielding influence', hint: 'Better fielding raises dismissal odds.', step: 0.01 },
      { key: 'keeperSkillInfluence', label: 'Keeper influence', hint: 'Keeper quality boost for stumpings/run-outs.', step: 0.01 },
      { key: 'sixThreshold', label: 'Six threshold', hint: 'Lower values increase six frequency.', step: 0.01 },
      { key: 'fourThreshold', label: 'Four threshold', hint: 'Boundary cutoff for fours.', step: 0.01 },
      { key: 'twoThreshold', label: 'Two threshold', hint: 'Cutoff for doubles and threes.', step: 0.01 },
      { key: 'singleThreshold', label: 'Single threshold', hint: 'Minimum roll for a single run.', step: 0.01 },
    ],
  },
  {
    tab: 'advanced',
    title: 'Match dynamics',
    description: 'Fine tune matchups, aggression, momentum, and pressure factors.',
    fields: [
      { key: 'paceVsSpinAdvantage', label: 'Pace vs spin advantage', hint: 'Differential modifier for matchup mismatches.', step: 0.01 },
      { key: 'leftHandedPaceBonus', label: 'Left hand pace bonus', hint: 'Extra boost for left-handers vs pace.', step: 0.01 },
      { key: 'swingFactor', label: 'Swing factor', hint: 'Influence of humidity on swing bowling.', step: 0.01 },
      { key: 'spinFactor', label: 'Spin factor', hint: 'Influence of dew on spin bowling.', step: 0.01 },
      { key: 'powerplayMultiplier', label: 'Powerplay multiplier', hint: 'Scoring boost during first six overs.', step: 0.01 },
      { key: 'middleOversMultiplier', label: 'Middle overs multiplier', hint: 'Scoring modifier for overs 7-15.', step: 0.01 },
      { key: 'deathOversMultiplier', label: 'Death overs multiplier', hint: 'Aggression boost for the final overs.', step: 0.01 },
      { key: 'chasingPressureBase', label: 'Base chasing pressure', hint: 'Pressure applied when chasing totals.', step: 0.01 },
      { key: 'requiredRunRatePressure', label: 'RRR pressure factor', hint: 'Scaling for required run rate gaps.', step: 0.01 },
      { key: 'partnershipStability', label: 'Partnership stability', hint: 'How quickly momentum settles after events.', step: 0.01 },
      { key: 'momentumSwing', label: 'Momentum swing', hint: 'Magnitude of momentum changes per ball.', step: 0.01 },
      { key: 'aggressionBase', label: 'Base aggression', hint: 'Default attacking intent.', step: 0.01 },
      { key: 'aggressionPowerplay', label: 'Powerplay aggression boost', hint: 'Additional aggression early.', step: 0.01 },
      { key: 'aggressionDeath', label: 'Death overs aggression', hint: 'Late-innings aggression boost.', step: 0.01 },
    ],
  },
  {
    tab: 'pitch',
    title: 'Pitch & conditions',
    description: 'Model bounce, turn, and environment impact on bowlers and batters.',
    fields: [
      { key: 'pitchBounce', label: 'Pitch bounce', hint: 'Higher values favour seamers.', step: 0.01 },
      { key: 'pitchTurn', label: 'Pitch turn', hint: 'Higher values favour spinners.', step: 0.01 },
      { key: 'boundarySize', label: 'Boundary size', hint: 'Larger values reduce boundary frequency.', step: 0.01 },
      { key: 'outfieldSpeed', label: 'Outfield speed', hint: 'Faster outfields boost boundaries.', step: 0.01 },
      { key: 'humidityFactor', label: 'Humidity factor', hint: 'Assists swing when higher.', step: 0.01 },
      { key: 'dewFactor', label: 'Dew factor', hint: 'Impacts spin grip and seam control.', step: 0.01 },
      { key: 'seamEffectiveness', label: 'Seam effectiveness', hint: 'Baseline quality of seam bowling.', step: 0.01 },
      { key: 'spinEffectiveness', label: 'Spin effectiveness', hint: 'Baseline quality of spin bowling.', step: 0.01 },
      { key: 'yorkerSuccessRate', label: 'Yorker success rate', hint: 'Finishing skill for pace bowlers.', step: 0.01 },
      { key: 'bouncerSuccessRate', label: 'Bouncer success rate', hint: 'Short ball threat for pace.', step: 0.01 },
    ],
  },
  {
    tab: 'fielding',
    title: 'Fielding & extras',
    description: 'Adjust fielding prowess, extras frequency, and edge outcomes.',
    fields: [
      { key: 'runOutSuccess', label: 'Run-out success', hint: 'Likelihood of successful run-outs.', step: 0.01 },
      { key: 'dropCatchPenalty', label: 'Drop catch penalty', hint: 'Reduces wicket chances for poor fielding.', step: 0.01 },
      { key: 'groundFielding', label: 'Ground fielding', hint: 'Affects singles-to-doubles conversions.', step: 0.01 },
      { key: 'noBallFrequency', label: 'No-ball frequency', hint: 'Contribution to extras probability.', step: 0.01 },
      { key: 'wideFrequency', label: 'Wide frequency', hint: 'Contribution to extras probability.', step: 0.01 },
      { key: 'byeLegByeFrequency', label: 'Bye/leg-bye frequency', hint: 'Chance for byes and leg byes.', step: 0.01 },
      { key: 'edgeToSlipProbability', label: 'Edge-to-slip probability', hint: 'Edges carrying to slip/keeper.', step: 0.01 },
      { key: 'topEdgeProbability', label: 'Top edge probability', hint: 'Chances of skying mishits.', step: 0.01 },
    ],
  },
]

export default function SimulationConfigManager({
  initialConfigs,
  activeConfigId,
  presets,
  defaults,
}: ManagerProps) {
  const router = useRouter()
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(activeConfigId)
  const [formValues, setFormValues] = useState<ConfigFormState>(() => {
    if (initialConfigs.length > 0 && activeConfigId) {
      const active = initialConfigs.find((config) => config.id === activeConfigId)
      if (active) {
        return {
          id: active.id,
          name: active.name,
          isActive: active.isActive,
          notes: active.notes,
          ...active,
        }
      }
    }

    return {
      ...defaults,
      id: undefined,
    }
  })

  const [currentTab, setCurrentTab] = useState<TabId>('basic')
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  })
  const [previewResult, setPreviewResult] = useState<any | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const configsById = useMemo(() => {
    const map = new Map<string, SerializedConfig>()
    initialConfigs.forEach((config) => map.set(config.id, config))
    return map
  }, [initialConfigs])

  function handleSelectConfig(id: string | null) {
    if (!id) {
      setSelectedConfigId(null)
      setFormValues({
        ...defaults,
        id: undefined,
        name: defaults.name,
        isActive: false,
        notes: defaults.notes ?? '',
      })
      return
    }

    const config = configsById.get(id)
    if (!config) {
      return
    }

    setSelectedConfigId(id)
    setFormValues({
      id: config.id,
      name: config.name,
      isActive: config.isActive,
      notes: config.notes,
      ...config,
    })
  }

  function handlePresetChange(presetId: string) {
    const preset = presets.find((item) => item.id === presetId)
    if (!preset) {
      return
    }

    setFormValues((current) => ({
      ...preset.values,
      id: current.id,
      name: preset.values.name,
      isActive: current.isActive,
      notes: preset.values.notes ?? current.notes,
    }))
    setStatus({ type: 'idle' })
  }

  function handleNumberChange(key: NumericField, value: string) {
    const numeric = Number.parseFloat(value)
    setFormValues((current) => ({
      ...current,
      [key]: Number.isFinite(numeric) ? numeric : 0,
    }))
  }

  function handleStringChange(key: 'name' | 'notes', value: string) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleToggleActive(value: boolean) {
    setFormValues((current) => ({
      ...current,
      isActive: value,
    }))
  }

  async function saveConfig(withActivation: boolean) {
    setStatus({ type: 'idle' })

    const payload: ConfigFormState = {
      ...formValues,
      isActive: withActivation ? true : formValues.isActive,
    }

    const response = await fetch('/api/simulation/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: payload }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setStatus({ type: 'error', message: data.error || 'Failed to save configuration.' })
      return
    }

    const data = await response.json()
    setStatus({
      type: 'success',
      message: withActivation ? 'Configuration saved & activated.' : 'Configuration saved.',
    })

    const savedConfig = data.config as SerializedConfig
    setSelectedConfigId(savedConfig.id)
    setFormValues({
      id: savedConfig.id,
      name: savedConfig.name,
      isActive: savedConfig.isActive,
      notes: savedConfig.notes,
      ...savedConfig,
    })

    startTransition(() => {
      router.refresh()
    })
  }

  async function activateConfig(id?: string) {
    if (!id) {
      return
    }

    const response = await fetch('/api/simulation/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate', id }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setStatus({ type: 'error', message: data.error || 'Failed to activate configuration.' })
      return
    }

    const data = await response.json()
    const updated = data.config as SerializedConfig
    setStatus({ type: 'success', message: 'Configuration activated.' })
    setFormValues((current) => ({
      ...current,
      isActive: true,
    }))
    setSelectedConfigId(updated.id)

    startTransition(() => {
      router.refresh()
    })
  }

  async function runPreview() {
    setStatus({ type: 'idle' })
    setIsPreviewing(true)
    setPreviewResult(null)

    const response = await fetch('/api/simulation/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', config: formValues }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setStatus({ type: 'error', message: data.error || 'Failed to run preview simulation.' })
      setIsPreviewing(false)
      return
    }

    const data = await response.json()
    setPreviewResult(data)
    setStatus({ type: 'success', message: 'Preview simulation complete.' })
    setIsPreviewing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Existing configurations</CardTitle>
          <CardDescription>Load, edit, or activate previously saved presets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label htmlFor="config-select" className="text-sm font-medium text-muted-foreground">
                Select configuration
              </label>
              <select
                id="config-select"
                value={selectedConfigId ?? ''}
                onChange={(event) => handleSelectConfig(event.target.value || null)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">New configuration</option>
                {initialConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name} {config.isActive ? '• Active' : ''}
                  </option>
                ))}
              </select>
              {selectedConfigId && (
                <p className="text-xs text-muted-foreground">
                  Last updated {new Date(configsById.get(selectedConfigId)?.updatedAt ?? '').toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="preset-select" className="text-sm font-medium text-muted-foreground">
                Apply preset
              </label>
              <select
                id="preset-select"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    handlePresetChange(event.target.value)
                    event.target.selectedIndex = 0
                  }
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select preset</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration editor</CardTitle>
          <CardDescription>Adjust values per category and test before saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="config-name" className="text-sm font-medium text-muted-foreground">
                Configuration name
              </label>
              <input
                id="config-name"
                value={formValues.name ?? ''}
                onChange={(event) => handleStringChange('name', event.target.value)}
                placeholder="Balanced Default"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Active configuration</label>
              <div className="flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2">
                <input
                  id="config-active"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(formValues.isActive)}
                  onChange={(event) => handleToggleActive(event.target.checked)}
                />
                <label htmlFor="config-active" className="text-sm text-muted-foreground">
                  Mark this configuration as active after saving
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="config-notes" className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <textarea
              id="config-notes"
              rows={3}
              value={formValues.notes ?? ''}
              onChange={(event) => handleStringChange('notes', event.target.value)}
              placeholder="Describe the intent of this tuning profile."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['basic', 'advanced', 'pitch', 'fielding', 'test'] as TabId[]).map((tab) => (
              <Button
                key={tab}
                type="button"
                variant={currentTab === tab ? 'default' : 'outline'}
                onClick={() => setCurrentTab(tab)}
              >
                {tab === 'basic' && 'Basic'}
                {tab === 'advanced' && 'Advanced'}
                {tab === 'pitch' && 'Pitch'}
                {tab === 'fielding' && 'Fielding'}
                {tab === 'test' && 'Test'}
              </Button>
            ))}
          </div>

          {currentTab !== 'test' ? (
            FIELD_GROUPS.filter((group) => group.tab === currentTab).map((group) => (
              <div key={group.tab} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label htmlFor={field.key} className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <input
                        id={field.key}
                        type="number"
                        step={field.step ?? 0.01}
                        value={Number(formValues[field.key]).toFixed(2)}
                        onChange={(event) => handleNumberChange(field.key, event.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Preview simulation</h3>
                <p className="text-sm text-muted-foreground">
                  Run a sample 20-over match between balanced squads using the current configuration.
                </p>
              </div>
              <Button type="button" onClick={runPreview} disabled={isPreviewing}>
                {isPreviewing ? 'Simulating...' : 'Run sample simulation'}
              </Button>
              {previewResult && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-border p-4">
                    <h4 className="text-sm font-semibold text-foreground">First innings</h4>
                    <p className="text-sm text-muted-foreground">
                      {previewResult.firstInnings.totalRuns} / {previewResult.firstInnings.totalWickets}{' '}
                      ({previewResult.firstInnings.totalOvers.toFixed(1)} overs)
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <h4 className="text-sm font-semibold text-foreground">Second innings</h4>
                    <p className="text-sm text-muted-foreground">
                      {previewResult.secondInnings.totalRuns} / {previewResult.secondInnings.totalWickets}{' '}
                      ({previewResult.secondInnings.totalOvers.toFixed(1)} overs)
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-4 md:col-span-2">
                    <h4 className="text-sm font-semibold text-foreground">Outcome</h4>
                    <p className="text-sm text-muted-foreground">
                      {previewResult.outcome.winner === 'TIE'
                        ? 'Match tied'
                        : `${previewResult.outcome.winner === 'TEAM1' ? 'Team 1' : 'Team 2'} won by ${
                            previewResult.outcome.margin
                          } ${previewResult.outcome.marginType.toLowerCase()}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {status.type !== 'idle' && status.message && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-700'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => saveConfig(false)} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => saveConfig(true)} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save & activate'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectConfig(null)}
              disabled={isPending}
            >
              Reset to defaults
            </Button>
            {formValues.id && !formValues.isActive && (
              <Button type="button" variant="outline" onClick={() => activateConfig(formValues.id)}>
                Make active
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

