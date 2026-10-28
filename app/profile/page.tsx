'use client'

import { User, Send, BookOpen, ShieldQuestion, ArrowLeft } from 'lucide-react'

export default function ProfilePage({ onBack }: { onBack: () => void }) {
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
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
            <User size={28} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Telegram User</h2>
            <p className="text-sm text-gray-500">@username</p>
          </div>
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
    </div>
  )
}