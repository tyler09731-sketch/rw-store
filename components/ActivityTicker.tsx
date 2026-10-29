'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

type Activity = {
  text: string
  time: string
}

export default function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(d => setActivities(d.activities || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activities.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activities.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activities])

  if (activities.length === 0) return null

  return (
    <div className="bg-gray-900 text-white px-4 py-2 flex items-center gap-2 overflow-hidden">
      <div className="flex items-center gap-1 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <Zap size={12} className="text-orange-400" />
      </div>
      <div className="flex-1 min-w-0 relative h-5 overflow-hidden">
        {activities.map((a, i) => (
          <div
            key={i}
            className={`absolute inset-0 text-xs flex items-center gap-2 transition-all duration-500 ${
              i === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}
          >
            <span className="truncate">{a.text}</span>
            <span className="text-[10px] text-gray-400 shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}