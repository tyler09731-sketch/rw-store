'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, ShieldCheck, ChevronLeft } from 'lucide-react'
import { haptic } from '@/lib/haptics'

type CryptoMethod = {
  id: number
  name: string
  symbol: string
  network: string | null
  wallet_address: string
  is_recommended: boolean
  icon_emoji: string
}

export default function CryptoSelector({ 
  onSelect, 
  selectedId 
}: { 
  onSelect: (method: CryptoMethod) => void
  selectedId: number | null 
}) {
  const [methods, setMethods] = useState<CryptoMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crypto')
      .then(r => r.json())
      .then(d => {
        // Only show active methods
        setMethods((d.methods || []).filter((m: any) => m.is_active !== false))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-6 text-gray-400 text-sm">Loading payment methods...</div>

  if (methods.length === 0) return <div className="text-center py-6 text-gray-400 text-sm">No payment methods available. Contact support.</div>

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">Choose your preferred network.</p>
      {methods.map((m) => (
        <button
          key={m.id}
          onClick={() => { haptic.light(); onSelect(m) }}
          className={`w-full flex items-center justify-between p-4 border rounded-xl relative overflow-hidden transition-colors ${
            selectedId === m.id 
              ? 'border-2 border-orange-500 bg-orange-50' 
              : 'border border-gray-200 active:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold">{m.icon_emoji}</div>
            <div className="text-left">
              <p className="font-bold">{m.name} {m.network && `(${m.network})`}</p>
              <p className="text-xs text-gray-500">{m.is_recommended ? 'Fastest • Lowest Fee' : 'Secure Payment'}</p>
            </div>
          </div>
          {m.is_recommended && (
            <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</span>
          )}
        </button>
      ))}
    </div>
  )
}