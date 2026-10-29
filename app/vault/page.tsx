'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Vault, CheckCircle2, Users, Crown, Tag, Megaphone, DollarSign, Award, Hourglass, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { haptic } from '@/lib/haptics'
import CryptoSelector from '@/components/CryptoSelector'

export default function VaultPage({ user, onBack }: { user: any, onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'select' | 'pay' | 'hash' | 'pending'>('select')
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [txHash, setTxHash] = useState('')
  const [copied, setCopied] = useState(false)
  const [paying, setPaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)

  const fetchVault = () => {
    if (!user?.id) { setLoading(false); return }
    fetch(`/api/vault?user_id=${user.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchVault() }, [user])

  useEffect(() => {
    if (paymentStep !== 'pay') return
    const timer = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [paymentStep])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  const handleCopy = () => {
    if (!selectedMethod?.wallet_address) return
    navigator.clipboard.writeText(selectedMethod.wallet_address)
    haptic.success()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSelectMethod = (m: any) => {
    if (!m || !m.wallet_address) {
      alert('This payment method is not configured. Contact support.')
      return
    }
    setSelectedMethod(m)
    setPaymentStep('pay')
  }

  const handlePayAccess = async () => {
    if (!txHash.trim() || !selectedMethod) return
    setPaying(true)
    haptic.success()

    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        tx_hash: txHash,
        crypto_coin: `${selectedMethod.name} ${selectedMethod.network || ''}`.trim()
      })
    })

    const result = await res.json()
    setPaying(false)

    if (!res.ok) {
      alert(result.error || 'Error submitting payment')
      return
    }

    setPaymentStep('pending')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading Vault...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-md px-4 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ArrowLeft size={20} /></button>
        <Vault size={20} className="text-orange-500" />
        <h1 className="font-bold text-xl tracking-tight">The Vault</h1>
      </div>

      {!data?.unlocked ? (
        <div className="px-4 pt-6 space-y-5">
          {data?.hasPendingPayment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Hourglass size={16} className="text-yellow-600" />
                <p className="font-bold text-sm text-yellow-800">Pending Approval</p>
              </div>
              <p className="text-xs text-yellow-700">Your payment is being verified. You'll be notified in the bot once approved.</p>
            </div>
          )}

          <div className="text-center">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl relative">
              <Crown size={40} className="text-orange-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Become a Seller</h2>
            <p className="text-sm text-gray-500 max-w-[280px] mx-auto">List your products in our store. Reach thousands of buyers. Keep 90% of every sale.</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Users size={14} className="text-orange-500" />
            <span><strong className="text-gray-900">24 sellers</strong> already inside</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center mb-2"><Megaphone size={18} className="text-orange-500" /></div>
              <p className="font-bold text-sm text-gray-900">Reach Buyers</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Your products, our audience</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center mb-2"><DollarSign size={18} className="text-green-500" /></div>
              <p className="font-bold text-sm text-gray-900">Keep 90%</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Only 10% commission</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center mb-2"><Award size={18} className="text-purple-500" /></div>
              <p className="font-bold text-sm text-gray-900">Verified Badge</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Build buyer trust</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-2"><Tag size={18} className="text-blue-500" /></div>
              <p className="font-bold text-sm text-gray-900">Set Your Prices</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Full control over margins</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded-full">ONE-TIME FEE</span>
              <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-1 rounded-full">LIFETIME</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Seller Access</h3>
            <p className="text-white/80 text-xs mb-4">Pay once, sell forever. No recurring fees.</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-extrabold text-white">$99</span>
              <span className="text-sm text-white/60 mb-1.5">one-time</span>
            </div>
            {data?.hasPendingPayment ? (
              <div className="w-full bg-white/20 text-white py-3.5 rounded-xl font-bold text-center">Awaiting Admin Approval</div>
            ) : (
              <button onClick={() => { haptic.medium(); setShowPayment(true) }} className="w-full bg-white text-orange-600 py-3.5 rounded-xl font-bold active:scale-95 transition-transform shadow-lg">
                Unlock Seller Access
              </button>
            )}
            <p className="text-center text-[10px] text-white/70 mt-3">Instant crypto checkout • Admin verifies within 24h</p>
          </div>

          <div className="text-center text-xs text-gray-400 pb-4">
            <p>Questions? <a href="https://t.me/your_support_username" target="_blank" className="text-orange-500 font-semibold">Contact Support</a></p>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center"><Crown size={20} className="text-white" /></div>
                  <div>
                    <p className="text-white font-bold text-sm">SELLER ACCESS</p>
                    <p className="text-[10px] text-gray-400">Lifetime Verified</p>
                  </div>
                </div>
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 size={10} /> ACTIVE
                </span>
              </div>
              <p className="text-gray-300 text-sm mt-3">Welcome, {data.firstName || 'seller'}. Your seller dashboard is ready.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-orange-500" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Seller Dashboard</h3>
            <p className="text-sm text-gray-500 mb-4">The full vendor dashboard is launching soon. In the meantime, contact us to list your first product.</p>
            <a href="https://t.me/your_support_username" target="_blank" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform">
              Contact Admin to List
            </a>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 uppercase mb-1">Your perks</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✓ Lifetime seller access</li>
              <li>✓ 90% of every sale (10% commission)</li>
              <li>✓ Verified seller badge on your listings</li>
              <li>✓ Withdraw to crypto anytime</li>
            </ul>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayment(false)} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{paymentStep === 'select' ? 'Pay $99' : paymentStep === 'pay' ? 'Complete Payment' : paymentStep === 'hash' ? 'Confirm' : 'Submitted!'}</h2>
                <button onClick={() => setShowPayment(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">✕</button>
              </div>

              {paymentStep === 'select' && <CryptoSelector selectedId={selectedMethod?.id || null} onSelect={handleSelectMethod} />}

              {paymentStep === 'pay' && selectedMethod?.wallet_address && (
                <div className="space-y-4">
                  <div className="bg-orange-50 text-orange-600 p-3 rounded-xl flex justify-between border border-orange-100">
                    <span className="text-sm font-medium">Rate locked</span>
                    <span className="font-bold font-mono">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Send exactly</p>
                    <p className="text-3xl font-bold">$99.00</p>
                    <p className="text-sm text-orange-500">in {selectedMethod.name} {selectedMethod.network}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Address</p>
                    <p className="font-mono text-sm break-all">{selectedMethod.wallet_address}</p>
                    <button onClick={handleCopy} className="mt-3 w-full flex items-center justify-center gap-2 bg-white border py-2.5 rounded-lg font-semibold text-sm">{copied ? 'Copied!' : 'Copy Address'}</button>
                  </div>
                  <button onClick={() => setPaymentStep('hash')} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold">I've Sent Payment</button>
                </div>
              )}

              {paymentStep === 'pay' && !selectedMethod?.wallet_address && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500">This payment method is missing a wallet address. Please go back and select another.</p>
                  <button onClick={() => setPaymentStep('select')} className="mt-4 text-orange-500 font-bold text-sm">Go Back</button>
                </div>
              )}

              {paymentStep === 'hash' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Paste your TXID. Your payment will be verified by our admin before seller access is unlocked.</p>
                  <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste transaction hash..." className="w-full bg-gray-50 border p-4 rounded-xl text-sm" />
                  <button onClick={handlePayAccess} disabled={paying || !txHash.trim()} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold disabled:opacity-50">{paying ? 'Submitting...' : 'Submit for Approval'}</button>
                </div>
              )}

              {paymentStep === 'pending' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"><Hourglass size={40} className="text-yellow-500" /></div>
                  <h3 className="font-bold text-lg mb-2">Payment Submitted</h3>
                  <p className="text-sm text-gray-500 mb-4">Your TXID is now with our admin for verification. You'll be notified in the bot once approved.</p>
                  <button onClick={() => { setShowPayment(false); fetchVault() }} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold">Done</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}