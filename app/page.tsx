'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, RotateCw, Package, ChevronRight, CheckCircle2 } from 'lucide-react'
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
  const [schemas, setSchemas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [user, setUser] = useState<{ id: number, first_name: string, username: string, photo_url?: string, balance?: number } | null>(null)
  const [orderCount, setOrderCount] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    const { data: prods } = await supabase.from('products').select('*').eq('is_sold', false).order('created_at', { ascending: false })
    const { data: schms } = await supabase.from('category_schemas').select('*')
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed')
    
    if (prods) setProducts(prods)
    if (schms) setSchemas(schms)
    if (count) setOrderCount(count)
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
          if (res.status === 403) {
            alert('Your access has been revoked. Contact support.')
            tg.close()
            return
          }
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

  const categories = ['All', ...new Set(products.map(p => p.category))]
  const activeSchema = schemas.find(s => s.category === activeCategory)
  const isTableView = activeSchema?.default_view === 'table'

  const filteredProducts = products.filter(p => {
    const searchString = `${p.title} ${JSON.stringify(p.metadata)}`.toLowerCase()
    const matchesSearch = searchString.includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  if (activeTab === 'orders') return <><OrdersPage onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>
  if (activeTab === 'wallet') return <><WalletPage user={user} onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>
  if (activeTab === 'profile') return <><ProfilePage user={user} onBack={() => setActiveTab('items')} setActiveTab={setActiveTab} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-2">
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
          <input type="text" placeholder="Search everything..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white pl-10 pr-4 py-3.5 rounded-xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => { haptic.light(); setActiveCategory(cat); }} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white text-gray-600 border border-gray-100'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RotateCw className="animate-spin text-orange-500" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No products found.</div>
      ) : isTableView ? (
        <div className="px-4 pt-2 overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                {activeSchema.fields.slice(0, 4).map((f: any) => <th key={f.name} className="p-3 font-semibold">{f.name}</th>)}
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold text-right">Action</th>
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
                  {activeSchema.fields.slice(0, 4).map((f: any) => (
                    <td key={f.name} className="p-3 text-sm">
                      {f.name === 'Country' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">{getFlagEmoji(p.metadata.Country || 'US')}</span>
                          <span className="font-medium">{p.metadata.Country === 'GB' ? 'UK' : p.metadata.Country}</span>
                          {p.metadata.State && <span className="text-xs text-gray-400">({p.metadata.State})</span>}
                        </div>
                      ) : (
                        <span className="truncate max-w-[100px] block">{p.metadata[f.name] || '-'}</span>
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-sm font-bold">${p.price_usd}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { haptic.medium(); setSelectedProduct(p); }} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm active:scale-95 transition-transform">Buy</button>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 pt-2 space-y-3">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div 
                key={product.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-10 h-10 rounded-lg object-cover bg-gray-50" />
                    ) : (
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500"><Package size={20} /></div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{product.title}</h3>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300" size={20} />
                </div>

                <div className="mt-2 mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                  <p className="text-green-600 font-bold text-lg leading-tight">
                    {product.metadata.Balance ? `Balance: ${product.metadata.Balance}` : 'Digital Item'}
                  </p>
                  {product.metadata.Description && <p className="text-xs text-gray-500 mt-1">{product.metadata.Description}</p>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Price</p>
                    <p className="text-xl font-bold text-gray-900">${product.price_usd.toFixed(2)}</p>
                  </div>
                  <button onClick={() => { haptic.medium(); setSelectedProduct(product); }} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2">
                    <Package size={16} /> Buy
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