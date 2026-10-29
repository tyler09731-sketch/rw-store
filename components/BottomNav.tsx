'use client'

import { Package, ClipboardList, User, Wallet, Vault } from 'lucide-react'
import { motion } from 'motion/react'
import { haptic } from '@/lib/haptics'

type Tab = 'items' | 'orders' | 'wallet' | 'vault' | 'profile'

export default function BottomNav({ activeTab, setActiveTab, vaultUnlocked }: { activeTab: Tab, setActiveTab: (tab: Tab) => void, vaultUnlocked?: boolean }) {
  
  const handleTabClick = (tab: Tab) => {
    haptic.light()
    setActiveTab(tab)
  }

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => {
    const isActive = activeTab === id
    return (
      <button onClick={() => handleTabClick(id)} className={`flex flex-col items-center gap-1 p-2 w-14 relative ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
        {isActive && (
          <motion.div layoutId="activeTabIndicator" className="absolute -top-2 w-8 h-1 bg-orange-500 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
        )}
        <motion.div whileTap={{ scale: 0.85 }} className="relative">
          <Icon size={20} className={isActive ? 'fill-orange-100' : ''} />
          {id === 'vault' && vaultUnlocked && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
          )}
        </motion.div>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe pt-2 px-2 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <TabButton id="items" icon={Package} label="Items" />
      <TabButton id="orders" icon={ClipboardList} label="Orders" />
      <TabButton id="wallet" icon={Wallet} label="Wallet" />
      <TabButton id="vault" icon={Vault} label="Vault" />
      <TabButton id="profile" icon={User} label="Profile" />
    </div>
  )
}