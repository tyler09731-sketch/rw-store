'use client'

import { useState } from 'react'
import { ShieldAlert, Users, ShoppingBag, Plus, Lock } from 'lucide-react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/stats?password=${password}`)
    if (res.ok) {
      const data = await res.json()
      setStats(data)
      setIsAuthenticated(true)
    } else {
      setError('Invalid password')
    }
    setLoading(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
              <Lock size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your password to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Unlock Panel'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-orange-500" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.userCount}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.orderCount}</p>
            </div>
          </div>
        </div>

        {/* Product Management (We'll wire the "Add" button next) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Inventory ({stats.products.length})</h2>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
              <Plus size={16} /> Add Product
            </button>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {stats.products.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.category} • ${p.price_usd}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${p.is_sold ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                  {p.is_sold ? 'SOLD' : 'LIVE'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}