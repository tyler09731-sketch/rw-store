'use client'

import { ClipboardList, ArrowLeft } from 'lucide-react'

export default function OrdersPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl tracking-tight">My Orders</h1>
      </div>

      <div className="px-4 pt-6 flex flex-col items-center justify-center text-center mt-20">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300 mb-4">
          <ClipboardList size={40} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">No orders yet</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-[250px]">Your purchases and their access details will appear here.</p>
      </div>
    </div>
  )
}