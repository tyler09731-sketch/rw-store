'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Users, ShoppingBag, Plus, Lock, Trash2, Layers, CheckCircle, Pencil, Clock, Settings, BarChart3, UserX, UserCheck } from 'lucide-react'
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
  const [usersList, setUsersList] = useState<any[]>([])
  const [topups, setTopups] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'users' | 'topups' | 'settings'>('inventory')
  
  const [balanceInputs, setBalanceInputs] = useState<Record<number, string>>({})
  const [savedUserId, setSavedUserId] = useState<number | null>(null)

  const [showCatForm, setShowCatForm] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  
  const [newCatName, setNewCatName] = useState('')
  const [newCatView, setNewCatView] = useState('card')
  const [newCatFields, setNewCatFields] = useState<string[]>([''])
  const [newCatHasImage, setNewCatHasImage] = useState(false)

  const [editId, setEditId] = useState<number | null>(null)
  const [prodTitle, setProdTitle] = useState('')
  const [prodCategory, setProdCategory] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodImage, setProdImage] = useState('')
  const [prodFields, setProdFields] = useState<Record<string, string>>({})
  const [prodDeliveryInfo, setProdDeliveryInfo] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('')

  const [supportUrl, setSupportUrl] = useState('')
  const [proofsUrl, setProofsUrl] = useState('')
  const [guidesUrl, setGuidesUrl] = useState('')

  const countries = Country.getAllCountries()
  const availableStates = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []
  const hasStates = availableStates.length > 0

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

  // AUTO-LOGIN: try saved password on mount
  useEffect(() => {
    const saved = localStorage.getItem('rw_admin_pw')
    if (saved) {
      setPassword(saved)
      fetch(`/api/admin/products?password=${saved}`).then(r => {
        if (r.ok) {
          r.json().then(d => {
            setData(d)
            setIsAuthenticated(true)
            fetch(`/api/admin/orders?password=${saved}`).then(or => or.json()).then(od => setOrders(od.orders || []))
            fetch(`/api/admin/users?password=${saved}`).then(ur => ur.json()).then(ud => setUsersList(ud.users || []))
            fetch(`/api/topups?password=${saved}`).then(tr => tr.json()).then(td => setTopups(td.topups || []))
            fetch('/api/admin/settings').then(sr => sr.json()).then(sd => {
              setSettings(sd); setSupportUrl(sd.support_url || ''); setProofsUrl(sd.proofs_url || ''); setGuidesUrl(sd.guides_url || '')
            })
          })
        } else {
          localStorage.removeItem('rw_admin_pw')
        }
      })
    }
  }, [])

  const fetchData = async (pw?: string) => {
    const p = pw || password
    const res = await fetch(`/api/admin/products?password=${p}`)
    if (res.ok) { setData(await res.json()); setIsAuthenticated(true); return true } else { setError('Invalid password'); return false }
  }

  const fetchOrders = async () => {
    const res = await fetch(`/api/admin/orders?password=${password}`)
    if (res.ok) { const d = await res.json(); setOrders(d.orders || []) }
  }

  const fetchUsers = async () => {
    const res = await fetch(`/api/admin/users?password=${password}`)
    if (res.ok) { const d = await res.json(); setUsersList(d.users || []) }
  }

  const fetchTopups = async () => {
    const res = await fetch(`/api/topups?password=${password}`)
    if (res.ok) { const d = await res.json(); setTopups(d.topups || []) }
  }

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const s = await res.json()
      setSettings(s); setSupportUrl(s.support_url || ''); setProofsUrl(s.proofs_url || ''); setGuidesUrl(s.guides_url || '')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await fetchData()
    if (ok) {
      localStorage.setItem('rw_admin_pw', password)
      await fetchOrders(); await fetchUsers(); await fetchTopups(); await fetchSettings()
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('rw_admin_pw')
    setIsAuthenticated(false)
    setPassword('')
  }

  const handleToggleBan = async (telegram_id: number, is_blocked: boolean) => {
    if (confirm(`${is_blocked ? 'Unban' : 'Ban'} this user?`)) {
      await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, telegram_id, is_blocked: !is_blocked }) })
      fetchUsers()
    }
  }

  const handleUpdateBalance = async (telegram_id: number) => {
    const newBal = parseFloat(balanceInputs[telegram_id] || '0')
    if (isNaN(newBal)) { alert('Invalid number'); return }
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, telegram_id, balance: newBal }) })
    fetchUsers()
    setSavedUserId(telegram_id)
    setTimeout(() => setSavedUserId(null), 2000)
  }

  const handleSaveSettings = async () => {
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, support_url: supportUrl, proofs_url: proofsUrl, guides_url: guidesUrl }) })
    if (res.ok) { alert('Settings saved successfully'); fetchSettings() }
  }

  const resetForm = () => {
    setEditId(null); setProdTitle(''); setProdPrice(''); setProdImage(''); setProdFields({}); setProdDeliveryInfo(''); setSelectedCountryCode(''); setShowProdForm(false); uploadProps.setFiles([])
  }

  const handleEditClick = (product: any) => {
    setEditId(product.id); setProdTitle(product.title); setProdCategory(product.category); setProdPrice(product.price_usd.toString()); setProdImage(product.image_url || ''); setProdFields(product.metadata || {}); setProdDeliveryInfo(product.delivery_info || ''); setSelectedCountryCode(product.metadata?.Country || ''); setShowProdForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveProduct = async () => {
    const finalMetadata = { ...prodFields }
    if (selectedCountryCode) finalMetadata['Country'] = selectedCountryCode
    const payload = { password, title: prodTitle, category: prodCategory, price_usd: prodPrice, image_url: prodImage, metadata: finalMetadata, delivery_info: prodDeliveryInfo }
    if (editId) {
      await fetch('/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editId }) })
    } else {
      await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, action: 'add_product' }) })
    }
    resetForm(); fetchData()
  }

  const handleToggleSold = async (id: number, currentStatus: boolean) => {
    await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, id, is_sold: !currentStatus }) })
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
    await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, action: 'add_category', category: newCatName, fields, default_view: newCatView, has_image: newCatHasImage }) })
    setShowCatForm(false); setNewCatName(''); setNewCatFields(['']); setNewCatHasImage(false); fetchData()
  }

  const handleConfirmOrder = async (orderId: number, deliveryInfo: string) => {
    if (!deliveryInfo.trim()) { alert('Please enter delivery info'); return }
    const res = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, id: orderId, delivery_info: deliveryInfo }) })
    if (res.ok) { alert('Order confirmed and user notified!'); fetchOrders() }
  }

  const handleTopupAction = async (id: number, action: 'approve' | 'reject') => {
    await fetch('/api/topups', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, id, action }) })
    fetchTopups(); fetchData()
  }

  const selectedSchema = data?.schemas.find((s: any) => s.category === prodCategory)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-orange-900/40 text-orange-400 rounded-2xl flex items-center justify-center mb-3"><Lock size={26} /></div>
            <h1 className="text-xl font-bold text-white">Admin Access</h1>
            <p className="text-sm text-gray-400 mt-1">Enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-700 border border-gray-600 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">{loading ? 'Verifying...' : 'Unlock Panel'}</button>
            <p className="text-xs text-gray-500 text-center">You'll stay logged in on this device.</p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-orange-500" size={24} />
            <h1 className="text-xl font-bold text-white">Admin</h1>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 font-semibold px-3 py-1.5 rounded-lg border border-gray-700">Lock</button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-gray-800 p-3 md:p-5 rounded-xl border border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4">
            <div className="p-2 bg-blue-900/30 rounded-lg shrink-0"><Users className="text-blue-400" size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-gray-400 truncate">Users</p>
              <p className="text-lg md:text-2xl font-bold text-white truncate">{data.userCount}</p>
            </div>
          </div>
          <div className="bg-gray-800 p-3 md:p-5 rounded-xl border border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4">
            <div className="p-2 bg-green-900/30 rounded-lg shrink-0"><ShoppingBag className="text-green-400" size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-gray-400 truncate">Orders</p>
              <p className="text-lg md:text-2xl font-bold text-white truncate">{data.orderCount}</p>
            </div>
          </div>
          <div className="bg-gray-800 p-3 md:p-5 rounded-xl border border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4">
            <div className="p-2 bg-orange-900/30 rounded-lg shrink-0"><BarChart3 className="text-orange-400" size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-gray-400 truncate">Products</p>
              <p className="text-lg md:text-2xl font-bold text-white truncate">{data.products.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('inventory')} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'inventory' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Inventory</button>
          <button onClick={() => { setActiveTab('orders'); fetchOrders() }} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Orders ({orders.filter(o => o.status === 'pending').length})</button>
          <button onClick={() => { setActiveTab('topups'); fetchTopups() }} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'topups' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Top-Ups ({topups.filter(t => t.status === 'pending').length})</button>
          <button onClick={() => { setActiveTab('users'); fetchUsers() }} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Users</button>
          <button onClick={() => { setActiveTab('settings'); fetchSettings() }} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Settings</button>
        </div>

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setShowCatForm(!showCatForm)} className="flex-1 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"><Layers size={14} /> Category</button>
              <button onClick={() => { resetForm(); setShowProdForm(!showProdForm); }} className="flex-1 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold bg-orange-500 text-white px-3 py-2.5 rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"><Plus size={14} /> Product</button>
            </div>

            {showCatForm && (
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-3">
                <h2 className="font-bold text-white">New Category</h2>
                <input placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <select value={newCatView} onChange={e => {
                    const view = e.target.value; setNewCatView(view)
                    if (view === 'table' && newCatFields.length <= 1 && !newCatFields[0]) setNewCatFields(['BIN', 'Exp', 'Country', 'State', 'Bank', 'Level', 'Network', 'Balance', 'Address', 'Email', 'Seller'])
                    else if (view === 'card' && newCatFields.length > 5) setNewCatFields([''])
                  }} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="card">Default View: Cards</option>
                  <option value="table">Default View: Table</option>
                </select>
                <label className="flex items-center gap-2 p-2.5 bg-gray-700 rounded-lg cursor-pointer border border-gray-600">
                  <input type="checkbox" checked={newCatHasImage} onChange={e => setNewCatHasImage(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                  <span className="text-xs font-medium text-gray-200">Enable Image Upload</span>
                </label>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fields</p>
                {newCatFields.map((f, i) => (
                  <input key={i} placeholder="Field Name" value={f} onChange={e => { const n = [...newCatFields]; n[i] = e.target.value; setNewCatFields(n) }} className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                ))}
                <button onClick={() => setNewCatFields([...newCatFields, ''])} className="text-orange-400 text-sm font-semibold hover:text-orange-300">+ Add Field</button>
                <button onClick={handleAddCategory} className="w-full bg-white text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">Save Category</button>
              </div>
            )}

            {showProdForm && (
              <div className={`bg-gray-800 p-4 rounded-2xl border-2 ${editId ? 'border-orange-500' : 'border-gray-700'} space-y-3`}>
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-white">{editId ? 'Edit Product' : 'New Product'}</h2>
                  {editId && <button onClick={resetForm} className="text-xs text-red-400 font-semibold">Cancel</button>}
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
                    {prodImage && <img src={prodImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover mb-2 border border-gray-600" />}
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

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Delivery Info</p>
                  <textarea value={prodDeliveryInfo} onChange={e => setProdDeliveryInfo(e.target.value)} placeholder="LOGIN: ... PASS: ... AN: ... RN: ..." className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} />
                </div>
                
                <button onClick={handleSaveProduct} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">{editId ? 'Update Product' : 'Save Product'}</button>
              </div>
            )}

            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-3 border-b border-gray-700 bg-gray-800/50"><h2 className="font-bold text-white text-sm">Inventory ({data.products.length})</h2></div>
              <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
                {data.products.map((p: any) => (
                  <div key={p.id} className={`p-3 flex items-center justify-between gap-2 ${p.is_sold ? 'bg-gray-900/50 opacity-60' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-white truncate">{p.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.category} • ${p.price_usd}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleToggleSold(p.id, p.is_sold)} className={`p-1.5 rounded transition-colors ${p.is_sold ? 'text-orange-400 bg-orange-900/30' : 'text-gray-400 bg-gray-700'}`}><CheckCircle size={14} /></button>
                      <button onClick={() => handleEditClick(p)} className="text-blue-400 p-1.5 bg-blue-900/30 rounded"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 p-1.5 bg-red-900/30 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-gray-800 rounded-2xl border border-gray-700 text-sm">No orders yet.</div>
            ) : (
              orders.map((order) => {
                const productInfo = order.products?.delivery_info || ''
                const metadata = order.products?.metadata || {}
                const metaEntries = Object.entries(metadata).filter(([k, v]) => v && v !== '-' && v !== 'N/A')
                
                return (
                  <div key={order.id} className={`bg-gray-800 rounded-2xl border p-4 space-y-3 ${order.status === 'pending' ? 'border-yellow-700/50 bg-yellow-900/10' : 'border-green-700/50 bg-green-900/10'}`}>
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-sm truncate">{order.products?.title || 'Unknown'}</h3>
                        <p className="text-[10px] text-gray-400">Ref: {order.order_ref}</p>
                        <p className="text-[10px] text-gray-400 truncate">User: <span className="text-orange-400">@{order.users?.username || 'unknown'}</span></p>
                      </div>
                      {order.status === 'pending' ? (
                        <span className="flex items-center gap-1 bg-yellow-900/50 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded border border-yellow-700 shrink-0"><Clock size={10} /> Pending</span>
                      ) : (
                        <span className="flex items-center gap-1 bg-green-900/50 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-700 shrink-0"><CheckCircle size={10} /> Delivered</span>
                      )}
                    </div>

                    {metaEntries.length > 0 && (
                      <div className="bg-gray-900/50 rounded-lg p-2.5 border border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Product Info</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {metaEntries.map(([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between text-[11px]">
                              <span className="text-gray-500">{key}:</span>
                              <span className="text-white font-medium truncate ml-1">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                      <span>Price: <strong className="text-white">${order.price_usd || order.products?.price_usd || '0'}</strong></span>
                      <span>Coin: <strong className="text-white">{order.crypto_coin}</strong></span>
                      <span>Cat: <strong className="text-blue-400">{order.products?.category || 'N/A'}</strong></span>
                    </div>

                    {order.status === 'pending' ? (
                      <div className="pt-2 border-t border-gray-700 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Delivery Info {productInfo && <span className="text-green-400">(Auto-filled)</span>}</p>
                        <textarea 
                          id={`delivery-${order.id}`} 
                          defaultValue={productInfo} 
                          placeholder="LOGIN: ... PASS: ... AN: ... RN: ..." 
                          className="w-full bg-gray-700 border border-gray-600 text-white p-2.5 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" 
                          rows={4} 
                        />
                        <button 
                          onClick={() => { 
                            const el = document.getElementById(`delivery-${order.id}`) as HTMLTextAreaElement
                            handleConfirmOrder(order.id, el.value) 
                          }} 
                          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
                        >
                          Confirm & Deliver
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-gray-700 bg-gray-900/50 p-2.5 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Delivered</p>
                        <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap">{order.delivery_info}</pre>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'topups' && (
          <div className="space-y-3">
            {topups.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-gray-800 rounded-2xl border border-gray-700 text-sm">No top-up requests.</div>
            ) : (
              topups.map((t: any) => (
                <div key={t.id} className={`bg-gray-800 rounded-2xl border p-4 space-y-3 ${t.status === 'pending' ? 'border-yellow-700/50' : t.status === 'confirmed' ? 'border-green-700/50' : 'border-red-700/50'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white text-sm">${t.amount} in {t.crypto_coin}</h3>
                      <p className="text-[10px] text-gray-400 truncate">User: @{t.users?.username || 'unknown'}</p>
                      <p className="text-[10px] text-gray-400 truncate">TXID: {t.tx_hash}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${t.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' : t.status === 'confirmed' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{t.status.toUpperCase()}</span>
                  </div>
                  
                  {t.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-700">
                      <button onClick={() => handleTopupAction(t.id, 'approve')} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors">Approve</button>
                      <button onClick={() => handleTopupAction(t.id, 'reject')} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors">Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
              <h2 className="font-bold text-white text-sm">Users ({usersList.length})</h2>
              <button onClick={fetchUsers} className="text-[10px] text-orange-400 font-semibold">Refresh</button>
            </div>
            <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
              {usersList.map((u: any) => (
                <div key={u.telegram_id} className={`p-3 flex flex-col gap-2 ${u.is_blocked ? 'bg-red-900/10 opacity-70' : ''}`}>
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold shrink-0 text-sm">
                      {u.first_name ? u.first_name[0].toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-white truncate">{u.first_name || 'Unknown'} {u.username && <span className="text-gray-400">@{u.username}</span>}</p>
                      <p className="text-[10px] text-gray-400 truncate">ID: {u.telegram_id} • <span className="text-orange-400">{u.source || 'organic'}</span></p>
                    </div>
                    <button onClick={() => handleToggleBan(u.telegram_id, u.is_blocked)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 ${u.is_blocked ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
                      {u.is_blocked ? <><UserCheck size={12} /> Unban</> : <><UserX size={12} /> Ban</>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-700 w-full">
                    <span className="text-xs font-medium text-gray-400 pl-1">$</span>
                    <input 
                      type="number" 
                      placeholder={(u.balance || 0).toFixed(2)}
                      value={balanceInputs[u.telegram_id] !== undefined ? balanceInputs[u.telegram_id] : u.balance || 0}
                      onChange={(e) => setBalanceInputs({...balanceInputs, [u.telegram_id]: e.target.value})}
                      className="flex-1 min-w-0 bg-transparent text-white text-sm font-bold focus:outline-none"
                    />
                    <button 
                      onClick={() => handleUpdateBalance(u.telegram_id)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition-colors ${savedUserId === u.telegram_id ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                    >
                      {savedUserId === u.telegram_id ? '✓' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-4">
            <div>
              <h2 className="font-bold text-white text-base mb-1">Support Links</h2>
              <p className="text-xs text-gray-400">Used across the Mini App.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Support URL</label>
              <input type="url" value={supportUrl} onChange={e => setSupportUrl(e.target.value)} placeholder="https://t.me/your_support" className="w-full bg-gray-700 border border-gray-600 text-white p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Proofs URL</label>
              <input type="url" value={proofsUrl} onChange={e => setProofsUrl(e.target.value)} placeholder="https://t.me/your_proofs" className="w-full bg-gray-700 border border-gray-600 text-white p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Guides URL</label>
              <input type="url" value={guidesUrl} onChange={e => setGuidesUrl(e.target.value)} placeholder="https://t.me/your_guides" className="w-full bg-gray-700 border border-gray-600 text-white p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors">Save Settings</button>
          </div>
        )}

      </div>
    </div>
  )
}