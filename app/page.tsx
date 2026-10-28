'use client'

import { useEffect, useState, useDeferredValue } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, RotateCw, Package, ChevronRight, CheckCircle2, X, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { getFlagEmoji } from '@/lib/getFlag'
import { haptic } from '@/lib/haptics'
import CheckoutModal from '@/components/CheckoutModal'
import BottomNav from '@/components/BottomNav'
import OrdersPage from './orders/page'
import WalletPage from './wallet/page'
import ProfilePage from './profile/page'

type Product = {
  id: number
  title: string
  category: string
  price_usd: number
  image_url: string | null
  metadata: any
  is_sold: boolean
}

type Tab = 'items' | 'orders' | 'wallet' | 'profile'

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [user, setUser] = useState<{ id: number, first_name: string, username: string, photo_url?: string, balance?: number } | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: prods } = await supabase.from('products').select('*').eq('is_sold', false).order('created_at', { ascending: false })
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed')
      if (prods) setProducts(prods)
      if (count) setOrderCount(count)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const initTelegram = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp
        if (tg && tg.initData) {
          tg.ready(); tg.expand();
          const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg.initData }) })
          const data = await res.json()
          if (res.status === 403) { alert('Revoked.'); tg.close(); return }
          if (data.success) setUser(data.user)
        } else {
          setUser({ id: 0, first_name: 'Browser', username: 'test_user', balance: 0 })
        }
      } catch (e) {
        setUser({ id: 0, first_name: 'Browser', username: 'test_user', balance: 0 })
      }
    }
    initTelegram()
  }, [])

  useEffect(() => {
    setActiveFilters({})
    setSearch('')
  }, [activeCategory])

  const categories = ['All', 'Banks', 'CC Info']
  const isTableView = activeCategory === 'CC Info'

  // EXACT columns to show in the table (State is excluded)
  const ccColumns = ['BIN', 'Exp', 'Country', 'Bank', 'Level', 'Network', 'Address', 'Email']
  
  // Fields to use as filters
  const ccFilters = ['Country', 'Bank', 'Level', 'Network']

  // Helper to format expiry: "05/2027" -> "05/27"
  const formatExp = (exp: string) => {
    if (!exp) return '-'
    return exp.replace(/20(\d{2})/, '$1')
  }

  const getFilterOptions = (fieldName: string) => {
    const categoryProducts = products.filter(p => p.category === activeCategory)
    const values = Array.from(new Set(categoryProducts.map(p => p.metadata[fieldName]).filter(Boolean)))
    return values.sort()
  }

  const filteredProducts = products.filter(p => {
    const searchString = `${p.title} ${JSON.stringify(p.metadata)}`.toLowerCase()
    const matchesSearch = searchString.includes(deferredSearch.toLowerCase())
    
    if (activeCategory === 'All') {
      if (p.category !== 'Banks') return false
    } else if (activeCategory !== p.category) {
      return false
    }

    if (!isTableView) return matchesSearch

    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true
      return p.metadata[key] === value
    })
    return matchesSearch && matchesFilters
  })

  const hasActiveFilters = Object.values(activeFilters).some(v => v)

  const clearFilters = () => {
    haptic.light()
    setActiveFilters({})
  }

  const setFilter = (fieldName: string, value: string) => {
    haptic.light()
    setActiveFilters(prev => {
      const next = { ...prev }
      if (value === '') { delete next[fieldName] } else { next[fieldName] = value }
      return next
    })
  }

  if (activeTab === 'orders') return <><OrdersPage onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>
  if (activeTab === 'wallet') return <><WalletPage user={user} onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>
  if (activeTab === 'profile') return <><ProfilePage user={user} onBack={() => setActiveTab('items')} setActiveTab={setActiveTab} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900 w-full max-w-full overflow-x-hidden relative">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-2 w-full max-w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">RW</div>
            <h1 className="font-bold text-xl tracking-tight">Store 2.0</h1>
          </div>
          <div className="flex items-center gap-2">
            {orderCount > 0 && (
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-full shadow-sm border border-gray-100 text-xs font-medium">
                <CheckCircle2 size={12} className="text-green-500" />
                {orderCount} delivered
              </div>
            )}
            <button onClick={() => { haptic.light(); fetchData(); }} className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <RotateCw size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search bank, description, balance..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white pl-10 pr-4 py-3.5 rounded-xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full max-w-full">
          {categories.map((cat) => (
            <button key={cat} onClick={() => { haptic.light(); setActiveCategory(cat); }} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${activeCategory === cat ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white text-gray-600 border border-gray-100'}`}>
              {cat}
            </button>
          ))}
        </div>

        {isTableView && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center mt-1 w-full max-w-full">
            <div className="flex items-center gap-1 text-gray-500 mr-1 shrink-0">
              <SlidersHorizontal size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
            </div>
            
            {ccFilters.map((fieldName: string) => (
              <div key={fieldName} className="relative shrink-0">
                <select
                  value={activeFilters[fieldName] || ''}
                  onChange={(e) => setFilter(fieldName, e.target.value)}
                  className={`appearance-none px-3 py-1.5 pr-7 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    activeFilters[fieldName]
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  <option value="">{fieldName}</option>
                  {getFilterOptions(fieldName).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronRight size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none ${activeFilters[fieldName] ? 'text-white' : 'text-gray-400'}`} />
              </div>
            ))}
            
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-100 whitespace-nowrap shrink-0">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RotateCw className="animate-spin text-orange-500" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No products found.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-orange-500 text-sm font-semibold mt-2">Clear filters</button>
          )}
        </div>
      ) : isTableView ? (
        <div className="px-4 pt-2 w-full max-w-full relative">
          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-1 ml-1">
            <span>← Swipe to see details →</span>
          </div>
          
          <div className="overflow-x-auto w-full pb-20">
            <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {ccColumns.map((col) => (
                    <th key={col} className="p-3 font-semibold whitespace-nowrap">{col}</th>
                  ))}
                  <th className="p-3 font-semibold whitespace-nowrap">Price</th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <motion.tbody className="divide-y divide-gray-50">
                {filteredProducts.map((p, index) => (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/50"
                  >
                    {ccColumns.map((col) => (
                      <td key={col} className="p-3 text-sm whitespace-nowrap">
                        {col === 'Country' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{getFlagEmoji(p.metadata['Country'] || 'US')}</span>
                            <span className="font-medium">{p.metadata['Country'] === 'GB' ? 'UK' : p.metadata['Country']}</span>
                          </div>
                        ) : col === 'Exp' ? (
                          <span className="block">{formatExp(p.metadata[col])}</span>
                        ) : col === 'Address' || col === 'Email' ? (
                          // Render Yes/No as badges
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            p.metadata[col] === 'Yes' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {p.metadata[col] || '-'}
                          </span>
                        ) : (
                          <span className="block max-w-[120px] truncate" title={String(p.metadata[col] || '')}>{p.metadata[col] || '-'}</span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-sm font-bold whitespace-nowrap">${p.price_usd}</td>
                    <td className="p-3 text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <button onClick={() => { haptic.medium(); setSelectedProduct(p); }} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm active:scale-95 transition-transform">Buy</button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-2 space-y-3 w-full max-w-full">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div 
                key={product.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white rounded-3xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col w-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded-xl object-cover bg-gray-50 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 shadow-sm"><Package size={22} /></div>
                    )}
                    <div>
                      <h3 className="font-bold text-base text-gray-900 leading-tight">{product.title}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300" size={20} />
                </div>

                <div className="my-3">
                  <p className="text-green-600 font-extrabold text-2xl tracking-tight">
                    {product.metadata.Balance ? product.metadata.Balance : 'Digital Item'}
                  </p>
                  {product.metadata.Description && <p className="text-xs font-medium text-gray-500 mt-1">{product.metadata.Description}</p>}
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(product.metadata)
                      .filter(([key]) => ['Level', 'Network', 'Bank'].includes(key))
                      .map(([key, value]: [string, any]) => (
                        <span key={key} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">
                          {value}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price</p>
                    <p className="text-2xl font-extrabold text-gray-900">${product.price_usd.toFixed(2)}</p>
                  </div>
                  <button onClick={() => { haptic.medium(); setSelectedProduct(product); }} className="bg-orange-500 text-white px-7 py-3 rounded-xl font-bold text-sm shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] active:scale-95 transition-transform flex items-center gap-2">
                    <Package size={16} /> Buy Now
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedProduct && <CheckoutModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )
}