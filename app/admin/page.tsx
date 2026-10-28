'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Users, ShoppingBag, Plus, Lock, Trash2, Layers, CheckCircle } from 'lucide-react'
import { Country, State } from 'country-state-city'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // UI States
  const [showCatForm, setShowCatForm] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('')
  const [newCatView, setNewCatView] = useState('card')
  const [newCatFields, setNewCatFields] = useState<string[]>([''])

  // Product Form State
  const [prodTitle, setProdTitle] = useState('')
  const [prodCategory, setProdCategory] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodImage, setProdImage] = useState('')
  const [prodFields, setProdFields] = useState<Record<string, string>>({})
  const [selectedCountryCode, setSelectedCountryCode] = useState('')

  // Geo Data (Using country-state-city)
  const countries = Country.getAllCountries()
  const availableStates = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []
  const hasStates = availableStates.length > 0

  // Dropzone Hook
  const uploadProps = useSupabaseUpload({
    bucketName: 'product-images',
    path: 'bank-logos',
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5, // 5MB
    upsert: true,
  })

  // Auto-set image URL when upload succeeds
  useEffect(() => {
    if (uploadProps.isSuccess && uploadProps.successes.length > 0 && uploadProps.successes[0]) {
      const supabase = createClient()
      const fileName = uploadProps.successes[0]
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`bank-logos/${fileName}`)
      
      if (urlData?.publicUrl) {
        setProdImage(urlData.publicUrl)
      }
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetchData()
    setLoading(false)
  }

  const handleAddCategory = async () => {
    const fields = newCatFields.filter(f => f.trim() !== '').map(f => ({ name: f, type: 'text' }))
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password, action: 'add_category', category: newCatName, fields, default_view: newCatView
      })
    })
    setShowCatForm(false)
    setNewCatName('')
    setNewCatFields([''])
    fetchData()
  }

  const handleAddProduct = async () => {
    const finalMetadata = { ...prodFields }
    
    if (selectedCountryCode) {
      finalMetadata['Country'] = selectedCountryCode
    }

    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password, 
        action: 'add_product', 
        title: prodTitle, 
        category: prodCategory, 
        price_usd: prodPrice, 
        image_url: prodImage, 
        metadata: finalMetadata
      })
    })
    
    // Reset form
    setShowProdForm(false)
    setProdTitle('')
    setProdPrice('')
    setProdImage('')
    setProdFields({})
    setSelectedCountryCode('')
    uploadProps.setFiles([]) // Clear the dropzone
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this product?')) {
      await fetch(`/api/admin/products?password=${password}&id=${id}`, { method: 'DELETE' })
      fetchData()
    }
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
          <div className="flex gap-2">
            <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-3 py-2 rounded-lg"><Layers size={16} /> Add Category</button>
            <button onClick={() => setShowProdForm(!showProdForm)} className="flex items-center gap-1.5 text-sm font-semibold bg-orange-500 text-white px-3 py-2 rounded-lg"><Plus size={16} /> Add Product</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <Users className="text-blue-500" /><div><p className="text-sm text-gray-500">Users</p><p className="text-2xl font-bold">{data.userCount}</p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <ShoppingBag className="text-green-500" /><div><p className="text-sm text-gray-500">Orders</p><p className="text-2xl font-bold">{data.orderCount}</p></div>
          </div>
        </div>

        {/* Add Category Form */}
        {showCatForm && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <h2 className="font-bold">New Category</h2>
            <input placeholder="Category Name (e.g. CC Info)" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
            <select value={newCatView} onChange={e => setNewCatView(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm">
              <option value="card">Default View: Cards</option>
              <option value="table">Default View: Table</option>
            </select>
            <p className="text-xs font-semibold text-gray-500 uppercase mt-2">Fields</p>
            {newCatFields.map((f, i) => (
              <input key={i} placeholder="Field Name (e.g. BIN)" value={f} onChange={e => { const n = [...newCatFields]; n[i] = e.target.value; setNewCatFields(n) }} className="w-full bg-gray-50 p-3 rounded-lg text-sm mb-2" />
            ))}
            <button onClick={() => setNewCatFields([...newCatFields, ''])} className="text-orange-500 text-sm font-semibold">+ Add Field</button>
            <button onClick={handleAddCategory} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold mt-2">Save Category</button>
          </div>
        )}

        {/* Add Product Form */}
        {showProdForm && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <h2 className="font-bold">New Product</h2>
            <input placeholder="Title (e.g. Chase Log)" value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
            <select value={prodCategory} onChange={e => {setProdCategory(e.target.value); setProdFields({}); setSelectedCountryCode('')}} className="w-full bg-gray-50 p-3 rounded-lg text-sm">
              <option value="">Select Category</option>
              {data.schemas.map((s: any) => <option key={s.category} value={s.category}>{s.category}</option>)}
            </select>
            <input placeholder="Price USD" type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
            
            {/* Image Upload for Banks */}
            {prodCategory === 'Banks' && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bank Logo</p>
                <Dropzone {...uploadProps}>
                  {uploadProps.isSuccess ? <DropzoneContent /> : <DropzoneEmptyState />}
                </Dropzone>
                {uploadProps.isSuccess && (
                   <p className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle size={12}/> Image ready</p>
                )}
              </div>
            )}

            {/* Dynamic Fields */}
            {selectedSchema && selectedSchema.fields.map((field: any) => {
              if (field.name === 'Country') {
                return (
                  <select key={field.name} value={selectedCountryCode} onChange={e => {
                    setSelectedCountryCode(e.target.value)
                    setProdFields({...prodFields, [field.name]: e.target.value})
                  }} className="w-full bg-gray-50 p-3 rounded-lg text-sm">
                    <option value="">Select Country</option>
                    {countries.map((c: any) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                  </select>
                )
              }
              if (field.name === 'State' && hasStates) {
                return (
                  <select key={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg text-sm">
                    <option value="">Select State</option>
                    {availableStates.map((s: any) => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                  </select>
                )
              }
              return (
                <input key={field.name} placeholder={field.name} value={prodFields[field.name] || ''} onChange={e => setProdFields({...prodFields, [field.name]: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg text-sm" />
              )
            })}
            
            <button onClick={handleAddProduct} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold mt-2">Save Product</button>
          </div>
        )}

        {/* Inventory List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50"><h2 className="font-bold">Inventory ({data.products.length})</h2></div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {data.products.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div><p className="font-semibold text-sm">{p.title} <span className="text-xs font-normal text-gray-400">({p.category})</span></p><p className="text-xs text-gray-500">${p.price_usd}</p></div>
                <button onClick={() => handleDelete(p.id)} className="text-red-400 p-2 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}