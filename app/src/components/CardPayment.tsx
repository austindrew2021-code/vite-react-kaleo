// @ts-nocheck
import { useState } from 'react';
import { CreditCard, Lock, ArrowRight, X } from 'lucide-react';
import { usePresaleStore } from '../store/presaleStore';
import { getCurrentPrice, calculateTokens } from '../config/presaleConfig';
import { toast } from 'sonner';

interface CardPaymentProps {
  usdAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletAddress: string;
}

export function CardPayment({ usdAmount, isOpen, onClose, onSuccess, walletAddress }: CardPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  
  const addPurchase = usePresaleStore((state) => state.addPurchase);
  const currentStage = usePresaleStore((state) => state.currentStage);
  
  const tokenPrice = getCurrentPrice(currentStage - 1);
  const tokens = calculateTokens(usdAmount, tokenPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !expiry || !cvc || !name) {
      toast.error('Please fill in all card details');
      return;
    }

    setIsProcessing(true);

    // Simulate card processing
    setTimeout(() => {
      // Record the purchase
      addPurchase({
        id: Math.random().toString(36).substring(2, 15),
        walletAddress: walletAddress.toLowerCase(),
        amountUSD: usdAmount,
        tokens,
        stage: currentStage,
        price: tokenPrice,
        paymentMethod: 'CARD',
        timestamp: Date.now(),
        status: 'completed',
      });

      setIsProcessing(false);
      toast.success(`Successfully purchased ${tokens.toLocaleString()} KLEO tokens!`);
      
      // Reset form
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setName('');
      
      onSuccess();
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A7B0B7] hover:text-[#F4F6FA] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#2BFFF1]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F4F6FA]">Card Payment</h3>
            <p className="text-sm text-[#A7B0B7]">Secure payment processing</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-[#A7B0B7] text-sm">Amount</span>
            <span className="text-[#F4F6FA] font-medium">${usdAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-[#A7B0B7] text-sm">Token Price</span>
            <span className="text-[#F4F6FA] font-medium">${tokenPrice.toFixed(5)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-[#A7B0B7] text-sm">You Receive</span>
              <span className="text-[#2BFFF1] font-bold">{tokens.toLocaleString()} KLEO</span>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {/* Card Number */}
            <div>
              <label className="block text-[#A7B0B7] text-sm mb-2">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="input-glass w-full px-4 py-3 pl-11"
                />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A7B0B7]" />
              </div>
            </div>

            {/* Expiry & CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A7B0B7] text-sm mb-2">Expiry</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="input-glass w-full px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-[#A7B0B7] text-sm mb-2">CVC</label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  className="input-glass w-full px-4 py-3"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[#A7B0B7] text-sm mb-2">Cardholder Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-glass w-full px-4 py-3"
              />
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 mb-6 text-[#A7B0B7] text-xs">
            <Lock className="w-4 h-4" />
            <span>Your payment is secured with 256-bit encryption</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="neon-button w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Pay ${usdAmount.toFixed(2)}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
