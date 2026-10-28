'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, RotateCw, Star, Package } from 'lucide-react'
import CountryFlag from 'react-country-flag'
import CheckoutModal from '@/components/CheckoutModal'
import BottomNav from '@/components/BottomNav'
import OrdersPage from './orders/page'
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

type Tab = 'items' | 'orders' | 'profile'

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [schemas, setSchemas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [user, setUser] = useState<{ id: number, first_name: string, username: string, photo_url?: string, balance?: number } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    // Fetch products
    const { data: prods } = await supabase.from('products').select('*').eq('is_sold', false).order('created_at', { ascending: false })
    // Fetch schemas to know how to render (cards vs tables)
    const { data: schms } = await supabase.from('category_schemas').select('*')
    
    if (prods) setProducts(prods)
    if (schms) setSchemas(schms)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    // Telegram Auth
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
        console.log('Not in Telegram:', e)
      }
    }
    initTelegram()
  }, [])

  const categories = ['All', ...new Set(products.map(p => p.category))]
  
  // Determine current view mode based on schema
  const activeSchema = schemas.find(s => s.category === activeCategory)
  const isTableView = activeSchema?.default_view === 'table'

  const filteredProducts = products.filter(p => {
    const searchString = `${p.title} ${JSON.stringify(p.metadata)}`.toLowerCase()
    const matchesSearch = searchString.includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  if (activeTab === 'orders') return <><OrdersPage onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>
  // Pass the user object to ProfilePage
  if (activeTab === 'profile') return <><ProfilePage user={user} onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>

  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">RW</div>
            <h1 className="font-bold text-xl tracking-tight">Store 2.0</h1>
          </div>
          <button onClick={fetchData} className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-transform">
            <RotateCw size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search everything..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white pl-10 pr-4 py-3.5 rounded-xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white text-gray-600 border border-gray-100'}`}>
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
        /* TABLE VIEW (For CCs) */
        <div className="px-4 pt-2 overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                {activeSchema.fields.slice(0, 4).map((f: any) => <th key={f.name} className="p-3 font-semibold">{f.name}</th>)}
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  {activeSchema.fields.slice(0, 4).map((f: any) => (
                    <td key={f.name} className="p-3 text-sm">
                      {f.name === 'Country' ? (
                        <div className="flex items-center gap-2">
                          <CountryFlag countryCode={p.metadata.Country || 'US'} svg style={{ width: '16px', height: '12px' }} />
                          <span>{p.metadata.Country === 'GB' ? 'UK' : p.metadata.Country}</span>
                          {p.metadata.State && <span className="text-xs text-gray-400">({p.metadata.State})</span>}
                        </div>
                      ) : (
                        <span className="truncate max-w-[100px] block">{p.metadata[f.name] || '-'}</span>
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-sm font-bold">${p.price_usd}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setSelectedProduct(p)} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm active:scale-95 transition-transform">Buy</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARD VIEW (For Banks) */
        <div className="px-4 pt-2 space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
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
                <button className="text-gray-300 hover:text-orange-500"><Star size={20} /></button>
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
                <button onClick={() => setSelectedProduct(product)} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2">
                  <Package size={16} /> Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && <CheckoutModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )
}