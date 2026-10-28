'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TopUpModal from '@/components/TopUpModal'

export default function WalletPage({ user, onBack }: { user: any, onBack: () => void }) {
  const [showTopUp, setShowTopUp] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('orders')
        .select('*, products(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (data) setHistory(data)
      setLoading(false)
    }
    fetchHistory()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl tracking-tight">My Wallet</h1>
      </div>

      <div className="px-4 pt-4 space-y-6">
        
        {/* Balance Card */}
        <div className="bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium mb-1">Available Balance</p>
            <p className="text-4xl font-bold text-white mb-6">
              ${user?.balance?.toFixed(2) || '0.00'}
            </p>
            <button 
              onClick={() => setShowTopUp(true)}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Top Up Balance
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="font-bold text-lg mb-3">Recent Activity</h2>
          
          {loading ? (
            <div className="flex justify-center py-10"><Clock className="animate-spin text-orange-500" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500 text-sm">No transactions yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {history.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                      <ArrowUpRight size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.products?.title || 'Purchase'}</p>
                      <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">-${item.price_usd || '0.00'}</p>
                    <p className="text-xs text-green-500 font-medium">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </div>
  )
}