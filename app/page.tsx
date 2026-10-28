'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, RotateCw, Star, Package } from 'lucide-react'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import CheckoutModal from '@/components/CheckoutModal'
import BottomNav from '@/components/BottomNav'
import OrdersPage from './orders/page'
import ProfilePage from './profile/page'

// Types
type Product = {
  id: number
  title: string
  category: string
  price_usd: number
  balance_info: string
  is_sold: boolean
}

type Tab = 'items' | 'orders' | 'profile'

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>(['All'])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [user, setUser] = useState<{ id: number, first_name: string, username: string, photo_url?: string } | null>(null)

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_sold', false)
      .order('created_at', { ascending: false })

    if (data) {
      setProducts(data)
      const uniqueCats = ['All', ...new Set(data.map(p => p.category))]
      setCategories(uniqueCats)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Telegram Auth & Registration
  useEffect(() => {
    const initTelegram = async () => {
      try {
        const { initDataRaw } = retrieveLaunchParams()
        
        if (initDataRaw) {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initDataRaw })
          })
          
          const data = await res.json()
          
          if (res.status === 403) {
            alert('Your access has been revoked. Contact support.')
            window.location.href = 'https://t.me/your_support_username'
            return
          }

          if (data.success) {
            setUser(data.user)
          }
        }
      } catch (e) {
        console.log('Not in Telegram or error:', e)
      }
    }
    
    initTelegram()
  }, [])

  // Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.balance_info.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Handle Tab Switching
  if (activeTab === 'orders') return <><OrdersPage onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>
  if (activeTab === 'profile') return <><ProfilePage user={user} onBack={() => setActiveTab('items')} /><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></>

  // Default: Items Tab
  return (
    <main className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
              RW
            </div>
            <h1 className="font-bold text-xl tracking-tight">Store 2.0</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 text-sm font-medium">
              <span className="text-orange-500">📈</span>
              {filteredProducts.length}
            </div>
            <button onClick={fetchProducts} className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <RotateCw size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search bank, description, balance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-3.5 rounded-xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 pt-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <RotateCw className="animate-spin text-orange-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No products found.</div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{product.title}</h3>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                </div>
                <button className="text-gray-300 hover:text-orange-500">
                  <Star size={20} />
                </button>
              </div>

              <div className="mt-2 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                <p className="text-green-600 font-bold text-lg leading-tight">{product.balance_info}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Price</p>
                  <p className="text-xl font-bold text-gray-900">${product.price_usd.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <Package size={16} />
                  Buy
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedProduct && (
        <CheckoutModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )
}