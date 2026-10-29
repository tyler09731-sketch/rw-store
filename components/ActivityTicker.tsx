'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

type Activity = {
  text: string
  time: string
}

export default function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([])
  const shownCount = useRef(0)

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(d => setActivities((d.activities || []).slice(0, 5)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activities.length === 0) return

    const showNext = () => {
      if (shownCount.current >= activities.length) return
      
      const activity = activities[shownCount.current]
      toast(activity.text, {
        description: activity.time,
        icon: <Zap size={16} className="text-orange-500" />,
        duration: 10000,
        position: 'top-right',
        id: 'activity-ticker',
      })
      shownCount.current += 1
    }

    // Show first activity after 2 seconds
    const firstTimeout = setTimeout(showNext, 2000)

    // Then advance every 12 seconds until all 5 are shown
    const interval = setInterval(showNext, 12000)

    return () => {
      clearTimeout(firstTimeout)
      clearInterval(interval)
    }
  }, [activities])

  return null
}