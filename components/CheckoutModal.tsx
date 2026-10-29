'use client'

import { useState, useEffect } from 'react'
import { X, Copy, CheckCircle2, ShieldCheck, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { haptic } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import CryptoSelector from './CryptoSelector'

type Product = { id: number; title: string; price_usd: number }

export default function CheckoutModal({ product, onClose, userId }: { product: Product, onClose: () => void, userId: number }) {
  const [step, setStep] = useState<'select' | 'pay' | 'hash' | 'success'>('select')
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderRef, setOrderRef] = useState('')

  useEffect(() => {
    if (step !== 'pay') return
    const timer = setInterval(() => { setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)) }, 1000)
    return () => clearInterval(timer)
  }, [step])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.BackButton) return
    if (step !== 'select' && step !== 'success') {
      tg.BackButton.show()
      tg.BackButton.onClick(() => {
        haptic.light()
        if (step === 'pay') { setSelectedMethod(null); setStep('select') }
        if (step === 'hash') setStep('pay')
      })
    } else { tg.BackButton.hide() }
    return () => { tg.BackButton.offClick() }
  }, [step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleCopy = () => {
    if (!selectedMethod?.wallet_address) return
    navigator.clipboard.writeText(selectedMethod.wallet_address)
    haptic.success()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    haptic.light()
    const tg = (window as any).Telegram?.WebApp
    tg?.BackButton?.hide()
    onClose()
  }

  const handleSelectMethod = (m: any) => {
    if (!m || !m.wallet_address) {
      alert('This payment method is not configured. Contact support.')
      return
    }
    setSelectedMethod(m)
    setStep('pay')
  }

  const handleSubmit = async () => {
    if (!txHash.trim() || !selectedMethod?.wallet_address) return
    if (!userId) {
      alert('User session not ready. Please close and reopen the app.')
      return
    }
    setLoading(true)
    haptic.success()
    const ref = `RW-${Date.now().toString().slice(-6)}`
    setOrderRef(ref)
    const { error } = await supabase.from('orders').insert({
      order_ref: ref, user_id: userId, product_id: product.id, price_usd: product.price_usd,
      crypto_coin: `${selectedMethod.name} ${selectedMethod.network || ''}`.trim(),
      tx_hash: txHash, status: 'pending'
    })
    setLoading(false)
    if (error) { alert('Error: ' + error.message); return }
    setStep('success')
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {step !== 'select' && step !== 'success' && (
                <button onClick={() => { haptic.light(); if (step === 'pay') { setSelectedMethod(null); setStep('select'); } if (step === 'hash') setStep('pay'); }} className="p-2 -ml-2 text-orange-500 bg-orange-50 rounded-full"><ChevronLeft size={20} /></button>
              )}
              <h2 className="text-xl font-bold">{step === 'success' ? 'Order Submitted' : step === 'select' ? 'Select Payment' : step === 'pay' ? 'Complete Payment' : 'Confirm Payment'}</h2>
            </div>
            <button onClick={handleClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
          </div>

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={40} className="text-green-500" /></div>
              <h3 className="font-bold text-lg mb-2">Order Submitted!</h3>
              <p className="text-sm text-gray-500 mb-4">Your order <strong>#{orderRef}</strong> is pending verification.</p>
              <p className="text-xs text-gray-400 mb-6">We'll notify you in this chat as soon as it's delivered.</p>
              <button onClick={handleClose} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold">Done</button>
            </div>
          )}

          {step === 'select' && (
            <CryptoSelector 
              selectedId={selectedMethod?.id || null}
              onSelect={handleSelectMethod} 
            />
          )}

          {step === 'pay' && selectedMethod?.wallet_address && (
            <div className="space-y-4">
              <div className="bg-orange-50 text-orange-600 p-3 rounded-xl flex items-center justify-between border border-orange-100"><span className="text-sm font-medium">Rate locked for</span><span className="font-bold font-mono text-lg">{formatTime(timeLeft)}</span></div>
              <div className="text-center py-4"><p className="text-sm text-gray-500 mb-1">Send exactly</p><p className="text-2xl font-bold text-gray-900">${Math.floor(product.price_usd)} USD</p><p className="text-sm font-medium text-orange-500 mt-1">in {selectedMethod.name} {selectedMethod.network}</p></div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Wallet Address</p>
                <p className="font-mono text-sm break-all text-gray-800">{selectedMethod.wallet_address}</p>
                <button onClick={handleCopy} className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-lg font-semibold text-sm active:scale-95 transition-transform">{copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}{copied ? 'Copied!' : 'Copy Address'}</button>
              </div>
              <button onClick={() => { haptic.success(); setStep('hash'); }} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform">I have sent the payment</button>
            </div>
          )}

          {step === 'hash' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Paste your Transaction Hash (TXID) below.</p>
              <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste transaction hash..." className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              <button onClick={handleSubmit} disabled={loading || !txHash.trim()} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"><ShieldCheck size={18} />{loading ? 'Submitting...' : 'Verify & Get Account'}</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}