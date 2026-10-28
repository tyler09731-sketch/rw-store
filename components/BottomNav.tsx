'use client'

import { Package, ClipboardList, User, Gift } from 'lucide-react'

type Tab = 'items' | 'orders' | 'profile'

export default function BottomNav({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe pt-2 px-4 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      
      <button onClick={() => setActiveTab('items')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'items' ? 'text-orange-500' : 'text-gray-400'}`}>
        <Package size={22} className={activeTab === 'items' ? 'fill-orange-100' : ''} />
        <span className="text-[10px] font-medium">Items</span>
      </button>

      <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'orders' ? 'text-orange-500' : 'text-gray-400'}`}>
        <ClipboardList size={22} className={activeTab === 'orders' ? 'fill-orange-100' : ''} />
        <span className="text-[10px] font-medium">Orders</span>
      </button>

      <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-orange-500' : 'text-gray-400'}`}>
        <User size={22} className={activeTab === 'profile' ? 'fill-orange-100' : ''} />
        <span className="text-[10px] font-medium">Profile</span>
      </button>

    </div>
  )
}