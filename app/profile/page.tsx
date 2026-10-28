'use client'

import { useState } from 'react'
import { User, Send, BookOpen, ShieldQuestion, ArrowLeft, Wallet, Plus } from 'lucide-react'
import TopUpModal from '@/components/TopUpModal'

export default function ProfilePage({ user, onBack }: { user: any, onBack: () => void }) {
  const [showTopUp, setShowTopUp] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl tracking-tight">Profile</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        
        {/* User Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 overflow-hidden">
             {user?.photo_url ? (
                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <User size={28} />
             )}
          </div>
          <div>
            <h2 className="font-bold text-lg">{user ? user.first_name : 'Loading...'}</h2>
            <p className="text-sm text-gray-500">{user?.username ? `@${user.username}` : 'Telegram User'}</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gray-900 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold text-white">${user?.balance?.toFixed(2) || '0.00'}</p>
          </div>
          <button 
            onClick={() => setShowTopUp(true)}
            className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2"
          >
            <Plus size={16} /> Top Up
          </button>
        </div>

        {/* Support Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          <a href="https://t.me/your_support_username" target="_blank" className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <ShieldQuestion size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Contact Support</p>
              <p className="text-xs text-gray-500">Need help? Message the seller</p>
            </div>
          </a>

          <a href="https://t.me/your_proof_channel" target="_blank" className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Proofs & Vouches</p>
              <p className="text-xs text-gray-500">See successful orders</p>
            </div>
          </a>

          <a href="https://t.me/your_guide_channel" target="_blank" className="flex items-center gap-3 p-4 active:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Free Methods & Guides</p>
              <p className="text-xs text-gray-500">Learn how to cash out</p>
            </div>
          </a>

        </div>
      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </div>
  )
}