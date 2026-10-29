'use client'

import { X, Package, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { haptic } from '@/lib/haptics'

type Product = {
  id: number
  title: string
  category: string
  price_usd: number
  image_url: string | null
  metadata: any
  is_sold: boolean
}

export default function ProductDetailSheet({ 
  product, 
  onClose, 
  onBuy 
}: { 
  product: Product | null
  onClose: () => void
  onBuy: (product: Product) => void 
}) {
  if (!product) return null

  const metadata = product.metadata || {}
  const metaEntries = Object.entries(metadata).filter(([k, v]) => v && v !== '-' && v !== 'N/A')

  const handleBuyClick = () => {
    haptic.medium()
    onBuy(product)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-16 max-h-[85vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
              ) : (
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 shadow-sm"><Package size={24} /></div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{product.title}</h2>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md">{product.category}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Details</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {metaEntries.map(([key, value]: [string, any]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">{key}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Price</p>
              <p className="text-3xl font-extrabold text-gray-900">${Math.floor(product.price_usd)}</p>
            </div>
            <button 
              onClick={handleBuyClick}
              className="bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] active:scale-95 transition-transform flex items-center gap-2"
            >
              <ShoppingCart size={18} /> Buy Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}