'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

type Activity = {
  text: string
  time: string
}

export default function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(d => setActivities(d.activities || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activities.length === 0) return

    let currentIndex = 0

    const showNext = () => {
      const activity = activities[currentIndex]
      toast(activity.text, {
        description: activity.time,
        icon: <Zap size={16} className="text-orange-500" />,
        duration: 10000,
        position: 'top-right',
        id: 'activity-ticker', // Same ID → replaces instead of stacking
      })
      currentIndex = (currentIndex + 1) % activities.length
    }

    // Show immediately
    showNext()

    // Then rotate every 6 seconds
    const interval = setInterval(showNext, 12000)

    return () => clearInterval(interval)
  }, [activities])

  // Render nothing in the DOM — the toast lives at the root
  return null
}