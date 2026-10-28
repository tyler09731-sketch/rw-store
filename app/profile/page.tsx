'use client'

import { useState, useEffect } from 'react'
import { User, Send, BookOpen, ShieldQuestion, ArrowLeft, Package, Wallet, LogOut } from 'lucide-react'
import { haptic } from '@/lib/haptics'

type Tab = 'items' | 'orders' | 'wallet' | 'profile'

export default function ProfilePage({ 
  user, 
  onBack, 
  setActiveTab 
}: { 
  user: any, 
  onBack: () => void, 
  setActiveTab: (tab: Tab) => void 
}) {
  const [supportUrl, setSupportUrl] = useState('https://t.me/')
  const [proofsUrl, setProofsUrl] = useState('https://t.me/')
  const [guidesUrl, setGuidesUrl] = useState('https://t.me/')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(s => {
        if (s.support_url) setSupportUrl(s.support_url)
        if (s.proofs_url) setProofsUrl(s.proofs_url)
        if (s.guides_url) setGuidesUrl(s.guides_url)
      })
      .catch(() => {})
  }, [])

  const handleQuickLink = (tab: Tab) => {
    haptic.light()
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl tracking-tight">Profile</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        
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

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleQuickLink('orders')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <Package size={24} className="text-orange-500" />
              <span className="text-sm font-semibold">My Orders</span>
            </button>
            <button onClick={() => handleQuickLink('wallet')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <Wallet size={24} className="text-orange-500" />
              <span className="text-sm font-semibold">My Wallet</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <a href={supportUrl} target="_blank" className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <ShieldQuestion size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Contact Support</p>
              <p className="text-xs text-gray-500">Need help? Message the seller</p>
            </div>
          </a>

          <a href={proofsUrl} target="_blank" className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Proofs & Vouches</p>
              <p className="text-xs text-gray-500">See successful orders</p>
            </div>
          </a>

          <a href={guidesUrl} target="_blank" className="flex items-center gap-3 p-4 active:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Free Methods & Guides</p>
              <p className="text-xs text-gray-500">Learn how to cash out</p>
            </div>
          </a>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 mb-2">RW Store v2.0</p>
          <button 
            onClick={() => { haptic.light(); alert('Session cleared. Close the app to log out.'); }}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-red-500 mx-auto"
          >
            <LogOut size={16} /> Clear Session
          </button>
        </div>

      </div>
    </div>
  )
}