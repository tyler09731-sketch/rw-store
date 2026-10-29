'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Users, ShoppingBag, Plus, Lock, Trash2, Layers, CheckCircle, Pencil, Clock, Settings, BarChart3 } from 'lucide-react'
import { Country, State } from 'country-state-city'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { createClient } from '@/lib/supabase/client'

const CARD_LEVELS = ['Standard', 'Silver', 'Gold', 'Platinum', 'Titanium', 'Signature', 'Infinite', 'World Elite', 'Business']
const CARD_NETWORKS = ['Visa', 'Mastercard', 'Amex', 'Discover', 'JCB', 'UnionPay']

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'settings'>('inventory')

  // UI States
  const [showCatForm, setShowCatForm] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('')
  const [newCatView, setNewCatView] = useState('card')
  const [newCatFields, setNewCatFields] = useState<string[]>([''])
  const [newCatHasImage, setNewCatHasImage] = useState(false)

  // Product Form State
  const [editId, setEditId] = useState<number | null>(null)
  const [prodTitle, setProdTitle] = useState('')
  const [prodCategory, setProdCategory] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodImage, setProdImage] = useState('')
  const [prodFields, setProdFields] = useState<Record<string, string>>({})
  const [selectedCountryCode, setSelectedCountryCode] = useState('')

  // Settings Form State
  const [supportUrl, setSupportUrl] = useState('')
  const [proofsUrl, setProofsUrl] = useState('')
  const [guidesUrl, setGuidesUrl] = useState('')

  // Geo Data
  const countries = Country.getAllCountries()
  const availableStates = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []
  const hasStates = availableStates.length > 0

  // Dropzone
  const uploadProps = useSupabaseUpload({
    bucketName: 'product-images',
    path: 'bank-logos',
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5,
    upsert: true,
  })

  useEffect(() => {
    if (uploadProps.isSuccess && uploadProps.successes.length > 0 && uploadProps.successes[0]) {
      const supabase = createClient()
      const fileName = uploadProps.successes[0]
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(`bank-logos/${fileName}`)
      if (urlData?.publicUrl) setProdImage(urlData.publicUrl)
    }
  }, [uploadProps.isSuccess, uploadProps.successes])

  const fetchData = async () => {
    const res = await fetch(`/api/admin/products?password=${password}`)
    if (res.ok) {
      setData(await res.json())
      setIsAuthenticated(true)
    } else {
      setError('Invalid password')
    }
  }

  const fetchOrders = async () => {
    const res = await fetch(`/api/admin/orders?password=${password}`)
    if (res.ok) {
      const orderData = await res.json()
      setOrders(orderData.orders || [])
    }
  }

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const s = await res.json()
      setSettings(s)
      setSupportUrl(s.support_url || '')
      setProofsUrl(s.proofs_url || '')
      setGuidesUrl(s.guides_url || '')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetchData()
    await fetchOrders()
    await fetchSettings()
    setLoading(false)
  }

  const handleSaveSettings = async () => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, support_url: supportUrl, proofs_url: proofsUrl, guides_url: guidesUrl })
    })
    if (res.ok) {
      alert('Settings saved successfully')
      fetchSettings()
    }
  }

  const resetForm = () => {
    setEditId(null)
    setProdTitle('')
    setProdPrice('')
    setProdImage('')
    setProdFields({})
    setSelectedCountryCode('')
    setShowProdForm(false)
    uploadProps.setFiles([])
  }

  const handleEditClick = (product: any) => {
    setEditId(product.id)
    setProdTitle(product.title)
    setProdCategory(product.category)
    setProdPrice(product.price_usd.toString())
    setProdImage(product.image_url || '')
    setProdFields(product.metadata || {})
    setSelectedCountryCode(product.metadata?.Country || '')
    setShowProdForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveProduct = async () => {
    const finalMetadata = { ...prodFields }
    if (selectedCountryCode) finalMetadata['Country'] = selectedCountryCode

    const payload = {
      password, title: prodTitle, category: prodCategory, price_usd: prodPrice, image_url: prodImage, metadata: finalMetadata
    }

    if (editId) {
      await fetch('/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editId }) })
    } else {
      await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, action: 'add_product' }) })
    }
    resetForm()
    fetchData()
  }

  const handleToggleSold = async (id: number, currentStatus: boolean) => {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id, is_sold: !currentStatus })
    })
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this product?')) {
      await fetch(`/api/admin/products?password=${password}&id=${id}`, { method: 'DELETE' })
      fetchData()
    }
  }

  const handleAddCategory = async () => {
    const fields = newCatFields.filter(f => f.trim() !== '').map(f => ({ name: f, type: 'text' }))
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'add_category', category: newCatName, fields, default_view: newCatView, has_image: newCatHasImage })
    })
    setShowCatForm(false)
    setNewCatName('')
    setNewCatFields([''])
    setNewCatHasImage(false)
    fetchData()
  }

  const handleConfirmOrder = async (orderId: number, deliveryInfo: string) => {
    if (!deliveryInfo.trim()) { alert('Please enter delivery info'); return }
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id: orderId, delivery_info: deliveryInfo })
    })
    if (res.ok) { alert('Order confirmed!'); fetchOrders() }
  }

  const selectedSchema = data?.schemas.find((s: any) => s.category === prodCategory)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-red-900/50 text-red-400 rounded-full flex items-center justify-center mb-3"><Lock size={24} /></div>
            <h1 className="text-xl font-bold text-white">Admin Access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-700 border border-gray-600 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-colors">{loading ? 'Verifying...' : 'Unlock Panel'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-orange-500" size={28} />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'inventory' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Inventory</button>
            <button onClick={() => { setActiveTab('orders'); fetchOrders() }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Orders ({orders.filter(o => o.status === 'pending').length})</button>
            <button onClick={() => { setActiveTab('settings'); fetchSettings() }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Settings</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex items-center gap-4">
            <div className="p-3 bg-blue-900/30 rounded-xl"><Users className="text-blue-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Total Users</p><p className="text-2xl font-bold text-white">{data.userCount}</p></div>
          </div>
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex items-center gap-4">
            <div className="p-3 bg-green-900/30 rounded-xl"><ShoppingBag className="text-green-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Total Orders</p><p className="text-2xl font-bold text-white">{data.orderCount}</p></div>
          </div>
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex items-center gap-4">
            <div className="p-3 bg-orange-900/30 rounded-xl"><BarChart3 className="text-orange-400" size={24} /></div>
            <div><p className="text-sm text-gray-400">Products</p><p className="text-2xl font-bold text-white">{data.products.length}</p></div>
          </div>
        </div>

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-2 text-sm font-semibold bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"><Layers size={16} /> Add Category</button>
              <button onClick={() => { resetForm(); setShowProdForm(!showProdForm); }} className="flex items-center gap-2 text-sm font-semibold bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"><Plus size={16} /> Add Product</button>
            </div>

            {/* Forms (Dark Mode) */}
            {showCatForm && (
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
                <h2 className="font-bold text-white text-lg">New Category</h2>
                <input placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <select value={newCatView} onChange={e => {
                    const view = e.target.value; setNewCatView(view)
                    if (view === 'table' && newCatFields.length <= 1 && !newCatFields[0]) setNewCatFields(['BIN', 'Exp', 'Country', 'State', 'Bank', 'Level', 'Network', 'Balance', 'Address', 'Email', 'Seller'])
                    else if (view === 'card' && newCatFields.length > 5) setNewCatFields([''])
                  }} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="card">Default View: Cards</option>
                  <option value="table">Default View: Table</option>
                </select>
                <label className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg cursor-pointer border border-gray-600">
                  <input type="checkbox" checked={newCatHasImage} onChange={e => setNewCatHasImage(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium text-gray-200">Enable Image Upload</span>
                </label>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fields</p>
                {newCatFields.map((f, i) => (
                  <input key={i} placeholder="Field Name" value={f} onChange={e => { const n = [...newCatFields]; n[i] = e.target.value; setNewCatFields(n) }} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                ))}
                <button onClick={() => setNewCatFields([...newCatFields, ''])} className="text-orange-400 text-sm font-semibold hover:text-orange-300">+ Add Field</button>
                <button onClick={handleAddCategory} className="w-full bg-white text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors mt-2">Save Category</button>
              </div>
            )}

            {showProdForm && (
              <div className={`bg-gray-800 p-6 rounded-2xl border-2 ${editId ? 'border-orange-500' : 'border-gray-700'} space-y-4`}>
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-white text-lg">{editId ? 'Edit Product' : 'New Product'}</h2>
                  {editId && <button onClick={resetForm} className="text-xs text-red-400 font-semibold hover:text-red-300">Cancel Edit</button>}
                </div>
                
                <input placeholder="Title" value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                
                <select value={prodCategory} onChange={e => {setProdCategory(e.target.value); if (!editId) setProdFields({}); setSelectedCountryCode('')}} disabled={!!editId} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select Category</option>
                  {data.schemas.map((s: any) => <option key={s.category} value={s.category}>{s.category}</option>)}
                </select>
                
                <input placeholder="Price USD" type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                
                {selectedSchema?.has_image && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Product Image</p>
                    {prodImage && <img src={prodImage} alt="Preview" className="w-20 h-20 rounded-lg object-cover mb-3 border border-gray-600" />}
                    <Dropzone {...uploadProps}>{uploadProps.isSuccess ? <DropzoneContent /> : <DropzoneEmptyState />}</Dropzone>
                  </div>
                )}

                {selectedSchema && selectedSchema.fields.map((field: any) => {
                  if (field.name === 'Country') return <select key={field.name} value={selectedCountryCode} onChange={e => { setSelectedCountryCode(e.target.value); setProdFields({...prodFields, [field.name]: e.target.value}) }} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select Country</option>{countries.map((c: any) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}</select>
                  if (field.name === 'State' && hasStates) return <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select State</option>{availableStates.map((s: any) => <option key={s.isoCode} value={s.isoCode}>{s.name} ({s.isoCode})</option>)}</select>
                  if (field.name === 'Level') return <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select Level</option>{CARD_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</select>
                  if (field.name === 'Network') return <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select Network</option>{CARD_NETWORKS.map(net => <option key={net} value={net}>{net}</option>)}</select>
                  return <input key={field.name} placeholder={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                })}
                
                <button onClick={handleSaveProduct} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors mt-2 shadow-lg shadow-orange-500/20">{editId ? 'Update Product' : 'Save Product'}</button>
              </div>
            )}

            {/* Inventory List */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 bg-gray-800/50"><h2 className="font-bold text-white">Inventory ({data.products.length})</h2></div>
              <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
                {data.products.map((p: any) => (
                  <div key={p.id} className={`p-4 flex items-center justify-between ${p.is_sold ? 'bg-gray-900/50 opacity-60' : ''}`}>
                    <div><p className="font-semibold text-sm text-white">{p.title} <span className="text-xs font-normal text-gray-400">({p.category})</span></p><p className="text-xs text-gray-400">${p.price_usd} {p.is_sold && <span className="text-red-400 font-bold ml-2">SOLD</span>}</p></div>
                    <div className="flex gap-1">
                      <button onClick={() => handleToggleSold(p.id, p.is_sold)} className={`p-2 rounded-lg transition-colors ${p.is_sold ? 'text-orange-400 bg-orange-900/30' : 'text-gray-400 bg-gray-700'}`}><CheckCircle size={16} /></button>
                      <button onClick={() => handleEditClick(p)} className="text-blue-400 p-2 bg-blue-900/30 rounded-lg hover:bg-blue-900/50 transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 p-2 bg-red-900/30 rounded-lg hover:bg-red-900/50 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-gray-800 rounded-2xl border border-gray-700">No orders yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={`bg-gray-800 rounded-2xl border p-5 space-y-3 ${order.status === 'pending' ? 'border-yellow-700/50 bg-yellow-900/10' : 'border-green-700/50 bg-green-900/10'}`}>
                  <div className="flex justify-between items-start">
                    <div><h3 className="font-bold text-white">{order.products?.title || 'Unknown'}</h3><p className="text-xs text-gray-400">Ref: {order.order_ref}</p><p className="text-xs text-gray-400">TXID: {order.tx_hash || 'N/A'}</p></div>
                    {order.status === 'pending' ? (
                      <span className="flex items-center gap-1 bg-yellow-900/50 text-yellow-400 text-xs font-bold px-2 py-1 rounded border border-yellow-700"><Clock size={12} /> Pending</span>
                    ) : (
                      <span className="flex items-center gap-1 bg-green-900/50 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-700"><CheckCircle size={12} /> Delivered</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300"><p>Price: <strong>${order.price_usd}</strong></p><p>Coin: {order.crypto_coin}</p></div>

                  {order.status === 'pending' ? (
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Paste Delivery Details</p>
                      <textarea id={`delivery-${order.id}`} placeholder="LOGIN: ... PASS: ..." className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} />
                      <button onClick={() => { const el = document.getElementById(`delivery-${order.id}`) as HTMLTextAreaElement; handleConfirmOrder(order.id, el.value) }} className="mt-2 w-full bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors">Confirm & Deliver</button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-gray-700 bg-gray-900/50 p-3 rounded-lg"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Delivered</p><pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{order.delivery_info}</pre></div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-5 max-w-2xl">
            <div>
              <h2 className="font-bold text-white text-lg mb-1">Support & Community Links</h2>
              <p className="text-sm text-gray-400">These links are used across the Mini App (Checkout, Profile, Orders).</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Support URL</label>
              <input type="url" value={supportUrl} onChange={e => setSupportUrl(e.target.value)} placeholder="https://t.me/your_support" className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Proofs Channel URL</label>
              <input type="url" value={proofsUrl} onChange={e => setProofsUrl(e.target.value)} placeholder="https://t.me/your_proofs" className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Guides Channel URL</label>
              <input type="url" value={guidesUrl} onChange={e => setGuidesUrl(e.target.value)} placeholder="https://t.me/your_guides" className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">Save Settings</button>
          </div>
        )}

      </div>
    </div>
  )
}