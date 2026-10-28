'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Users, ShoppingBag, Plus, Lock, Trash2, Layers, CheckCircle, Pencil, Clock, Settings } from 'lucide-react'
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
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3"><Lock size={24} /></div>
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:outline-none" />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold">{loading ? 'Verifying...' : 'Unlock Panel'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><ShieldAlert className="text-orange-500" size={28} /><h1 className="text-2xl font-bold text-gray-900">Admin</h1></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'inventory' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Inventory</button>
          <button onClick={() => { setActiveTab('orders'); fetchOrders() }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Orders ({orders.filter(o => o.status === 'pending').length})</button>
          <button onClick={() => { setActiveTab('settings'); fetchSettings() }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Settings</button>
        </div>

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <Users className="text-blue-500" /><div><p className="text-sm text-gray-500">Users</p><p className="text-2xl font-bold">{data.userCount}</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <ShoppingBag className="text-green-500" /><div><p className="text-sm text-gray-500">Orders</p><p className="text-2xl font-bold">{data.orderCount}</p></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-3 py-2 rounded-lg"><Layers size={16} /> Add Category</button>
              <button onClick={() => { resetForm(); setShowProdForm(!showProdForm); }} className="flex items-center gap-1.5 text-sm font-semibold bg-orange-500 text-white px-3 py-2 rounded-lg"><Plus size={16} /> Add Product</button>
            </div>

            {showCatForm && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                <h2 className="font-bold">New Category</h2>
                <input placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
                <select value={newCatView} onChange={e => {
                    const view = e.target.value; setNewCatView(view)
                    if (view === 'table' && newCatFields.length <= 1 && !newCatFields[0]) setNewCatFields(['BIN', 'Exp', 'Country', 'State', 'Bank', 'Level', 'Network', 'Balance', 'Address', 'Email', 'Seller'])
                    else if (view === 'card' && newCatFields.length > 5) setNewCatFields([''])
                  }} className="w-full bg-gray-50 p-3 rounded-lg text-sm">
                  <option value="card">Default View: Cards</option>
                  <option value="table">Default View: Table</option>
                </select>
                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={newCatHasImage} onChange={e => setNewCatHasImage(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium">Enable Image Upload</span>
                </label>
                <p className="text-xs font-semibold text-gray-500 uppercase mt-2">Fields</p>
                {newCatFields.map((f, i) => (
                  <input key={i} placeholder="Field Name" value={f} onChange={e => { const n = [...newCatFields]; n[i] = e.target.value; setNewCatFields(n) }} className="w-full bg-gray-50 p-3 rounded-lg text-sm mb-2" />
                ))}
                <button onClick={() => setNewCatFields([...newCatFields, ''])} className="text-orange-500 text-sm font-semibold">+ Add Field</button>
                <button onClick={handleAddCategory} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold mt-2">Save Category</button>
              </div>
            )}

            {showProdForm && (
              <div className={`bg-white p-5 rounded-2xl shadow-sm border-2 ${editId ? 'border-orange-500' : 'border-gray-100'} space-y-3`}>
                <div className="flex justify-between items-center">
                  <h2 className="font-bold">{editId ? 'Edit Product' : 'New Product'}</h2>
                  {editId && <button onClick={resetForm} className="text-xs text-red-500 font-semibold">Cancel Edit</button>}
                </div>
                <input placeholder="Title" value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
                <select value={prodCategory} onChange={e => {setProdCategory(e.target.value); if (!editId) setProdFields({}); setSelectedCountryCode('')}} disabled={!!editId} className="w-full bg-gray-50 p-3 rounded-lg text-sm disabled:opacity-50">
                  <option value="">Select Category</option>
                  {data.schemas.map((s: any) => <option key={s.category} value={s.category}>{s.category}</option>)}
                </select>
                <input placeholder="Price USD" type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
                
                {selectedSchema?.has_image && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Product Image</p>
                    {prodImage && <img src={prodImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover mb-2" />}
                    <Dropzone {...uploadProps}>{uploadProps.isSuccess ? <DropzoneContent /> : <DropzoneEmptyState />}</Dropzone>
                  </div>
                )}

                {selectedSchema && selectedSchema.fields.map((field: any) => {
                  if (field.name === 'Country') return <select key={field.name} value={selectedCountryCode} onChange={e => { setSelectedCountryCode(e.target.value); setProdFields({...prodFields, [field.name]: e.target.value}) }} className="w-full bg-gray-50 p-3 rounded-lg text-sm"><option value="">Select Country</option>{countries.map((c: any) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}</select>
                  if (field.name === 'State' && hasStates) return <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg text-sm"><option value="">Select State</option>{availableStates.map((s: any) => <option key={s.isoCode} value={s.isoCode}>{s.name} ({s.isoCode})</option>)}</select>
                  if (field.name === 'Level') return <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg text-sm"><option value="">Select Level</option>{CARD_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</select>
                  if (field.name === 'Network') return <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg text-sm"><option value="">Select Network</option>{CARD_NETWORKS.map(net => <option key={net} value={net}>{net}</option>)}</select>
                  return <input key={field.name} placeholder={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
                })}
                
                <button onClick={handleSaveProduct} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold mt-2">{editId ? 'Update Product' : 'Save Product'}</button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50"><h2 className="font-bold">Inventory ({data.products.length})</h2></div>
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {data.products.map((p: any) => (
                  <div key={p.id} className={`p-4 flex items-center justify-between ${p.is_sold ? 'bg-gray-100/50 opacity-60' : ''}`}>
                    <div><p className="font-semibold text-sm">{p.title} <span className="text-xs font-normal text-gray-400">({p.category})</span></p><p className="text-xs text-gray-500">${p.price_usd} {p.is_sold && <span className="text-red-500 font-bold ml-2">SOLD</span>}</p></div>
                    <div className="flex gap-1">
                      <button onClick={() => handleToggleSold(p.id, p.is_sold)} className={`p-2 rounded-lg ${p.is_sold ? 'text-orange-500 bg-orange-50' : 'text-gray-400 bg-gray-50'}`}><CheckCircle size={16} /></button>
                      <button onClick={() => handleEditClick(p)} className="text-blue-500 p-2 bg-blue-50 rounded-lg"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 p-2 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No orders yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={`bg-white rounded-2xl shadow-sm border p-5 space-y-3 ${order.status === 'pending' ? 'border-yellow-200 bg-yellow-50/10' : 'border-green-200'}`}>
                  <div className="flex justify-between items-start">
                    <div><h3 className="font-bold">{order.products?.title || 'Unknown'}</h3><p className="text-xs text-gray-500">Ref: {order.order_ref}</p><p className="text-xs text-gray-500">TXID: {order.tx_hash || 'N/A'}</p></div>
                    {order.status === 'pending' ? (
                      <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded"><Clock size={12} /> Pending</span>
                    ) : (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded"><CheckCircle size={12} /> Delivered</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600"><p>Price: <strong>${order.price_usd}</strong></p><p>Coin: {order.crypto_coin}</p></div>

                  {order.status === 'pending' ? (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Paste Delivery Details</p>
                      <textarea id={`delivery-${order.id}`} placeholder="LOGIN: ... PASS: ..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-mono" rows={3} />
                      <button onClick={() => { const el = document.getElementById(`delivery-${order.id}`) as HTMLTextAreaElement; handleConfirmOrder(order.id, el.value) }} className="mt-2 w-full bg-green-500 text-white py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-transform">Confirm & Deliver</button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-gray-100 bg-gray-50 p-3 rounded-lg"><p className="text-xs font-bold text-gray-500 uppercase mb-1">Delivered</p><pre className="text-xs font-mono whitespace-pre-wrap">{order.delivery_info}</pre></div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <h2 className="font-bold mb-1">Support & Community Links</h2>
              <p className="text-xs text-gray-500">These links are used across the Mini App (Checkout, Profile, Orders).</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support URL</label>
              <input type="url" value={supportUrl} onChange={e => setSupportUrl(e.target.value)} placeholder="https://t.me/your_support" className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proofs Channel URL</label>
              <input type="url" value={proofsUrl} onChange={e => setProofsUrl(e.target.value)} placeholder="https://t.me/your_proofs" className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Guides Channel URL</label>
              <input type="url" value={guidesUrl} onChange={e => setGuidesUrl(e.target.value)} placeholder="https://t.me/your_guides" className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold">Save Settings</button>
          </div>
        )}

      </div>
    </div>
  )
}