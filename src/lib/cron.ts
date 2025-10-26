import cron from 'node-cron'
import { advanceTimeline } from '@/lib/timeline'

type GlobalWithCron = typeof globalThis & {
  __switchedHitTimelineCron?: cron.ScheduledTask
}

const globalWithCron = globalThis as GlobalWithCron

if (!globalWithCron.__switchedHitTimelineCron) {
  globalWithCron.__switchedHitTimelineCron = cron.schedule('0 0 * * *', async () => {
    try {
      await advanceTimeline()
    } catch (error) {
      console.error('Failed to auto-advance timeline', error)
    }
  })
}

export const timelineCron = globalWithCron.__switchedHitTimelineCron
