'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ClipboardList, ArrowLeft, Copy, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { haptic } from '@/lib/haptics'
import { motion, AnimatePresence } from 'motion/react'

type Order = {
  id: number
  order_ref: string
  product_id: number
  price_usd: number
  crypto_coin: string
  tx_hash: string
  status: 'pending' | 'confirmed' | 'failed'
  delivery_info: string | null
  created_at: string
  products: { title: string; category: string } // joined from products
}

export default function OrdersPage({ onBack, user }: { onBack: () => void, user: any }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedOrder, setRevealedOrder] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      
      const { data } = await supabase
        .from('orders')
        .select('*, products(title, category)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        
      if (data) setOrders(data)
      setLoading(false)
    }
    fetchOrders()
  }, [user])

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    haptic.success()
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl tracking-tight">My Orders</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        
        {loading ? (
          <div className="flex justify-center py-20"><Clock className="animate-spin text-orange-500" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300 mb-4">
              <ClipboardList size={40} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">No orders yet</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-[250px]">Your purchases and their access details will appear here.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Order Header */}
              <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{order.products?.title || 'Product Deleted'}</h3>
                  <p className="text-xs text-gray-500">Ref: {order.order_ref}</p>
                </div>
                
                {/* Status Badge */}
                {order.status === 'confirmed' && (
                  <span className="flex items-center gap-1 bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-md">
                    <CheckCircle2 size={12} /> Delivered
                  </span>
                )}
                {order.status === 'pending' && (
                  <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2.5 py-1 rounded-md">
                    <Clock size={12} /> Verifying
                  </span>
                )}
                {order.status === 'failed' && (
                  <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-md">
                    <XCircle size={12} /> Failed
                  </span>
                )}
              </div>

              {/* Order Details */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid With:</span>
                  <span className="font-medium">{order.crypto_coin || 'Crypto'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-bold text-gray-900">${Math.floor(order.price_usd)}</span>
                </div>
                
                {/* TXID Copy Button */}
                {order.tx_hash && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">TXID:</span>
                    <button 
                      onClick={() => handleCopy(order.tx_hash, order.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded"
                    >
                      {copiedId === order.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copiedId === order.id ? 'Copied!' : 'Copy Hash'}
                    </button>
                  </div>
                )}

                {/* Delivery Info (Reveal on Click) */}
                {order.status === 'confirmed' && order.delivery_info && (
                  <div className="mt-2 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => setRevealedOrder(revealedOrder === order.id ? null : order.id)}
                      className="w-full flex items-center justify-between text-sm font-bold text-gray-900 bg-gray-50 p-2.5 rounded-lg"
                    >
                      <span>Account Details</span>
                      {revealedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    <AnimatePresence>
                      {revealedOrder === order.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 bg-gray-900 p-3 rounded-lg">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                              {order.delivery_info}
                            </pre>
                            <button 
                              onClick={() => handleCopy(order.delivery_info!, order.id + 100)}
                              className="mt-2 w-full flex items-center justify-center gap-1 bg-white/10 text-white py-1.5 rounded text-xs font-medium active:bg-white/20"
                            >
                              {copiedId === (order.id + 100) ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                              {copiedId === (order.id + 100) ? 'Copied!' : 'Copy Full Details'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Support Button for Pending/Failed */}
                {(order.status === 'pending' || order.status === 'failed') && (
                  <a 
                    href="https://t.me/your_support_username" 
                    target="_blank" 
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                  >
                    <Send size={16} /> Contact Support
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}