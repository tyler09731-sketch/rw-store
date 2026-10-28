'use client'

import { useState, useEffect } from 'react'
import { X, Copy, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react'

export default function TopUpModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'amount' | 'pay' | 'hash'>('amount')
  const [amount, setAmount] = useState('')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)

  const walletAddress = process.env.NEXT_PUBLIC_WALLET_USDT_TRC20 || 'T...'

  useEffect(() => {
    if (step !== 'pay') return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 animate-slide-up">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Top Up Balance</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        {step === 'amount' && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">Enter amount to add</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold text-gray-400">$</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-5xl font-bold text-gray-900 w-40 text-center focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[20, 50, 100].map(val => (
                <button key={val} onClick={() => setAmount(val.toString())} className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-sm font-semibold">
                  ${val}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep('pay')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              <Wallet size={18} /> Continue to Payment
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
              <p className="text-2xl font-bold text-gray-900">${parseFloat(amount).toFixed(2)} USD</p>
              <p className="text-sm font-medium text-orange-500 mt-1">in USDT (TRC20)</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Wallet Address</p>
              <p className="font-mono text-sm break-all text-gray-800">{walletAddress}</p>
              <button onClick={handleCopy} className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-lg font-semibold text-sm active:scale-95 transition-transform">
                {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>

            <button onClick={() => setStep('hash')} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform">
              I have sent the payment
            </button>
          </div>
        )}

        {step === 'hash' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Paste your Transaction Hash (TXID) below so we can verify and credit your balance.</p>
            <input 
              type="text" 
              placeholder="Paste transaction hash..." 
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <button className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Verify Top Up
            </button>
          </div>
        )}

      </div>
    </div>
  )
}