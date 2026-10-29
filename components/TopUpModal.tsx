'use client'

import { useState, useEffect } from 'react'
import { X, Copy, CheckCircle2, ShieldCheck, ChevronLeft } from 'lucide-react'

export default function TopUpModal({ onClose, userId }: { onClose: () => void, userId: number }) {
  const [step, setStep] = useState<'amount' | 'select' | 'pay' | 'hash'>('amount')
  const [amount, setAmount] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<'USDT_TRC20' | 'BTC' | 'USDT_BEP20'>('USDT_TRC20')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)
  const [txHash, setTxHash] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const walletAddresses = {
    BTC: process.env.NEXT_PUBLIC_WALLET_BTC || 'bc1q...',
    USDT_TRC20: process.env.NEXT_PUBLIC_WALLET_USDT_TRC20 || 'T...',
    USDT_BEP20: process.env.NEXT_PUBLIC_WALLET_USDT_BEP20 || '0x...',
  }

  useEffect(() => {
    if (step !== 'pay') return
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddresses[selectedCoin])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!txHash.trim() || !amount) return
    setLoading(true)
    await fetch('/api/topups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount, crypto_coin: selectedCoin, tx_hash: txHash })
    })
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 animate-slide-up">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {step !== 'amount' && !submitted && (
              <button onClick={() => {
                if (step === 'select') setStep('amount')
                if (step === 'pay') setStep('select')
                if (step === 'hash') setStep('pay')
              }} className="p-2 -ml-2 text-orange-500 bg-orange-50 rounded-full">
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold">
              {submitted ? 'Request Sent' : step === 'amount' ? 'Top Up' : step === 'select' ? 'Select Coin' : 'Complete'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">Top Up Submitted!</h3>
            <p className="text-sm text-gray-500 mb-6">Your request is pending admin approval. It will be added to your balance shortly.</p>
            <button onClick={onClose} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold">Close</button>
          </div>
        ) : (
          <>
            {step === 'amount' && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-2">Enter amount to add</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-400">$</span>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="text-5xl font-bold text-gray-900 w-40 text-center focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 50, 100].map(val => (
                    <button key={val} onClick={() => setAmount(val.toString())} className="bg-gray-50 border border-gray-200 py-2 rounded-lg text-sm font-semibold">${val}</button>
                  ))}
                </div>
                <button onClick={() => setStep('select')} disabled={!amount || parseFloat(amount) <= 0} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 mt-4">Continue</button>
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-3">
                <button onClick={() => { setSelectedCoin('USDT_TRC20'); setStep('pay') }} className="w-full flex items-center gap-3 p-4 border-2 border-orange-500 bg-orange-50 rounded-xl">
                  <div className="w-10 h-10 bg-[#26A17B] rounded-full flex items-center justify-center text-white font-bold">₮</div>
                  <div className="text-left"><p className="font-bold">USDT (TRC20)</p><p className="text-xs text-gray-500">Recommended</p></div>
                </button>
                <button onClick={() => { setSelectedCoin('BTC'); setStep('pay') }} className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-[#F7931A] rounded-full flex items-center justify-center text-white font-bold">₿</div>
                  <div className="text-left"><p className="font-bold">Bitcoin</p></div>
                </button>
                <button onClick={() => { setSelectedCoin('USDT_BEP20'); setStep('pay') }} className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-[#F3BA2F] rounded-full flex items-center justify-center text-white font-bold">₮</div>
                  <div className="text-left"><p className="font-bold">USDT (BEP20)</p></div>
                </button>
              </div>
            )}

            {step === 'pay' && (
              <div className="space-y-4">
                <div className="bg-orange-50 text-orange-600 p-3 rounded-xl flex justify-between border border-orange-100">
                  <span className="text-sm font-medium">Rate locked</span>
                  <span className="font-bold font-mono">{formatTime(timeLeft)}</span>
                </div>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Send exactly</p>
                  <p className="text-2xl font-bold">${parseFloat(amount).toFixed(2)}</p>
                  <p className="text-sm text-orange-500">in {selectedCoin.replace('_', ' ')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Address</p>
                  <p className="font-mono text-sm break-all">{walletAddresses[selectedCoin]}</p>
                  <button onClick={handleCopy} className="mt-3 w-full flex items-center justify-center gap-2 bg-white border py-2.5 rounded-lg font-semibold text-sm">
                    {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button onClick={() => setStep('hash')} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold">I've Sent Payment</button>
              </div>
            )}

            {step === 'hash' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Paste your TXID below. We'll verify and credit your balance.</p>
                <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste hash..." className="w-full bg-gray-50 border p-4 rounded-xl text-sm" />
                <button onClick={handleSubmit} disabled={loading || !txHash.trim()} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  <ShieldCheck size={18} /> {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}