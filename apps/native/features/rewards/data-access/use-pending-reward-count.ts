import { useEffect, useState } from 'react'

import { client } from '@/features/core/util/core-orpc'

/**
 * Lightweight hook that returns the count of unclaimed rewards.
 * Used for badge indicators on tabs.
 */
export function usePendingRewardCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await client.reward.list()
        setCount(data.filter((r) => r.status === 'pending').length)
      } catch {
        // Silently fail — badge is non-critical
      }
    }
    fetch()

    // Re-check every 30 seconds
    const interval = setInterval(fetch, 30_000)
    return () => clearInterval(interval)
  }, [])

  return count
}
