'use client'

import { useState, useEffect } from 'react'
import { X, Copy, CheckCircle2, ShieldCheck, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { haptic } from '@/lib/haptics'

type Product = {
  id: number
  title: string
  price_usd: number
}

export default function CheckoutModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const [step, setStep] = useState<'select' | 'pay' | 'hash'>('select')
  const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'USDT_TRC20' | 'USDT_BEP20'>('USDT_TRC20')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)

  useEffect(() => {
    if (step !== 'pay') return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  // Native Telegram back button handling
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.BackButton) return

    if (step !== 'select') {
      tg.BackButton.show()
      tg.BackButton.onClick(() => {
        haptic.light()
        if (step === 'pay') setStep('select')
        if (step === 'hash') setStep('pay')
      })
    } else {
      tg.BackButton.hide()
    }

    return () => {
      tg.BackButton.offClick()
    }
  }, [step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const walletAddresses = {
    BTC: process.env.NEXT_PUBLIC_WALLET_BTC || 'bc1q...',
    USDT_TRC20: process.env.NEXT_PUBLIC_WALLET_USDT_TRC20 || 'T...',
    USDT_BEP20: process.env.NEXT_PUBLIC_WALLET_USDT_BEP20 || '0x...',
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddresses[selectedCoin])
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

  const handleBack = () => {
    haptic.light()
    if (step === 'pay') setStep('select')
    if (step === 'hash') setStep('pay')
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {step !== 'select' && (
                <button onClick={handleBack} className="p-2 -ml-2 text-orange-500 bg-orange-50 rounded-full">
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-xl font-bold">
                {step === 'select' ? 'Select Payment' : step === 'pay' ? 'Complete Payment' : 'Confirm Payment'}
              </h2>
            </div>
            <button onClick={handleClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>

          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Choose your preferred network.</p>
              
              <button onClick={() => { haptic.light(); setSelectedCoin('USDT_TRC20'); setStep('pay'); }} className="w-full flex items-center justify-between p-4 border-2 border-orange-500 bg-orange-50 rounded-xl relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#26A17B] rounded-full flex items-center justify-center text-white font-bold">₮</div>
                  <div className="text-left">
                    <p className="font-bold">USDT (TRC20)</p>
                    <p className="text-xs text-gray-500">Fastest • Lowest Fee</p>
                  </div>
                </div>
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</span>
              </button>

              <button onClick={() => { haptic.light(); setSelectedCoin('BTC'); setStep('pay'); }} className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl active:bg-gray-50">
                <div className="w-10 h-10 bg-[#F7931A] rounded-full flex items-center justify-center text-white font-bold">₿</div>
                <div className="text-left">
                  <p className="font-bold">Bitcoin (BTC)</p>
                  <p className="text-xs text-gray-500">Network Fee: ~$2.50</p>
                </div>
              </button>

              <button onClick={() => { haptic.light(); setSelectedCoin('USDT_BEP20'); setStep('pay'); }} className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl active:bg-gray-50">
                <div className="w-10 h-10 bg-[#F3BA2F] rounded-full flex items-center justify-center text-white font-bold">₮</div>
                <div className="text-left">
                  <p className="font-bold">USDT (BEP20)</p>
                  <p className="text-xs text-gray-500">BSC Network</p>
                </div>
              </button>
            </div>
          )}

          {step === 'pay' && (
            <div className="space-y-4">
              <div className="bg-orange-50 text-orange-600 p-3 rounded-xl flex items-center justify-between border border-orange-100">
                <span className="text-sm font-medium">Rate locked for</span>
                <span className="font-bold font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>

              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-1">Send exactly</p>
                <p className="text-2xl font-bold text-gray-900">{product.price_usd.toFixed(2)} USD</p>
                <p className="text-sm font-medium text-orange-500 mt-1">in {selectedCoin.replace('_', ' ')}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Wallet Address</p>
                <p className="font-mono text-sm break-all text-gray-800">{walletAddresses[selectedCoin]}</p>
                <button onClick={handleCopy} className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-lg font-semibold text-sm active:scale-95 transition-transform">
                  {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
              </div>

              <button onClick={() => { haptic.success(); setStep('hash'); }} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform">
                I have sent the payment
              </button>
            </div>
          )}

          {step === 'hash' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Paste your Transaction Hash (TXID) below.</p>
              <input 
                type="text" 
                placeholder="Paste transaction hash..." 
                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button onClick={() => haptic.success()} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <ShieldCheck size={18} />
                Verify & Get Account
              </button>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}