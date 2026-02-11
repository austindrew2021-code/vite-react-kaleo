// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { ArrowRight, Info, Wallet, CreditCard } from 'lucide-react';
import { usePresaleStore } from '../store/presaleStore';
import { PRESALE_CONFIG, getCurrentPrice, calculateTokens } from '../config/presaleConfig';
import { CardPayment } from '../components/CardPayment';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const { isConnected, address } = useAccount();
  const { sendTransaction, isPending: isSending } = useSendTransaction();
  
  const { 
    ethAmount, 
    usdAmount, 
    tokenAmount, 
    selectedPaymentMethod,
    setEthAmount, 
    setUsdAmount,
    setTokenAmount,
    setPaymentMethod,
    addPurchase,
    currentStage,
    getStageData,
    getWalletPurchases,
    reset 
  } = usePresaleStore();
  
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);

  const stageData = getStageData(currentStage);
  const currentPrice = getCurrentPrice(currentStage - 1);
  
  // Get wallet purchase data
  const walletData = address ? getWalletPurchases(address) : null;

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const bg = bgRef.current;

    if (!section || !card || !bg) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      scrollTl
        .fromTo(card, 
          { x: '60vw', opacity: 0, scale: 0.9 }, 
          { x: 0, opacity: 1, scale: 1, ease: 'none' },
          0
        )
        .fromTo('.buy-title', 
          { x: '-10vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' },
          0.05
        )
        .fromTo('.buy-content', 
          { y: '4vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .to({}, { duration: 0.4 })
        .fromTo(card, 
          { x: 0, opacity: 1 }, 
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(bg, 
          { scale: 1 }, 
          { scale: 1.05, ease: 'power2.in' },
          0.7
        );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleEthChange = (value: string) => {
    setEthAmount(value);
  };

  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const price = getCurrentPrice(currentStage - 1);
      const tokens = calculateTokens(parseFloat(value), price);
      // Calculate ETH equivalent
      const ethPrice = 3500;
      const eth = parseFloat(value) / ethPrice;
      setEthAmount(eth.toFixed(6));
      setTokenAmount(tokens.toLocaleString());
    } else {
      setEthAmount('');
      setTokenAmount('');
    }
  };

  const handleCryptoBuy = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const eth = parseFloat(ethAmount);
    const usd = parseFloat(usdAmount);

    if (isNaN(eth) || eth <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (usd < PRESALE_CONFIG.MIN_PURCHASE) {
      toast.error(`Minimum purchase is $${PRESALE_CONFIG.MIN_PURCHASE}`);
      return;
    }

    if (usd > PRESALE_CONFIG.MAX_PURCHASE) {
      toast.error(`Maximum purchase is $${PRESALE_CONFIG.MAX_PURCHASE.toLocaleString()}`);
      return;
    }

    try {
      // Send ETH to team wallet
      sendTransaction({
        to: PRESALE_CONFIG.TEAM_WALLET as `0x${string}`,
        value: parseEther(ethAmount),
      }, {
        onSuccess: (hash: string) => {
          // Record the purchase
          const tokens = calculateTokens(usd, currentPrice);
          addPurchase({
            id: Math.random().toString(36).substring(2, 15),
            walletAddress: address.toLowerCase(),
            amountUSD: usd,
            amountETH: eth,
            tokens,
            stage: currentStage,
            price: currentPrice,
            paymentMethod: 'ETH',
            timestamp: Date.now(),
            txHash: hash,
            status: 'completed',
          });
          
          toast.success(`Successfully purchased ${tokens.toLocaleString()} KLEO tokens!`);
          reset();
        },
        onError: (error: Error) => {
          toast.error('Transaction failed: ' + error.message);
        },
      });
    } catch (err) {
      toast.error('Transaction failed. Please try again.');
    }
  };

  const handleCardBuy = () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const usd = parseFloat(usdAmount);

    if (isNaN(usd) || usd <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (usd < PRESALE_CONFIG.MIN_PURCHASE) {
      toast.error(`Minimum purchase is $${PRESALE_CONFIG.MIN_PURCHASE}`);
      return;
    }

    setIsCardOpen(true);
  };

  const handleCardSuccess = () => {
    toast.success('Payment successful! Tokens will be distributed after presale.');
    setIsCardOpen(false);
    reset();
  };

  const setPresetAmount = (amount: number) => {
    handleUsdChange(amount.toString());
    const ethPrice = 3500;
    const eth = amount / ethPrice;
    setEthAmount(eth.toFixed(6));
  };

  const nextStagePrice = currentStage < PRESALE_CONFIG.TOTAL_STAGES 
    ? PRESALE_CONFIG.STAGES[currentStage].price 
    : null;

  return (
    <section 
      ref={sectionRef} 
      id="buy"
      className="section-pinned z-20 flex items-center justify-center"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/stage_city_bg_02.jpg" 
          alt="Cyberpunk street"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/85" />
      </div>

      {/* Main Card */}
      <div 
        ref={cardRef}
        className="glass-card relative w-[min(95vw,520px)] rounded-[28px] overflow-hidden p-6"
        style={{ opacity: 0 }}
      >
        {/* Stage Badge */}
        <div className="buy-title flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium">
              Stage {currentStage} of {PRESALE_CONFIG.TOTAL_STAGES}
            </span>
            {nextStagePrice && (
              <span className="text-[#A7B0B7] text-xs">
                Next: ${nextStagePrice.toFixed(5)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[#2BFFF1] font-bold">${currentPrice.toFixed(5)}</span>
            <span className="text-[#A7B0B7] text-xs ml-1">/token</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="buy-title mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#A7B0B7]">Stage Progress</span>
            <span className="text-[#2BFFF1] font-medium">{stageData.progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-500"
              style={{ width: `${stageData.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-[#A7B0B7]">
            <span>${stageData.raised.toLocaleString()} raised</span>
            <span>${stageData.target.toLocaleString()} target</span>
          </div>
        </div>

        {/* Wallet Info (if connected and has purchases) */}
        {isConnected && walletData && walletData.totalTokens > 0 && (
          <div className="buy-content mb-4 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#A7B0B7] text-xs mb-1">Your Holdings</p>
                <p className="text-[#2BFFF1] text-xl font-bold">
                  {walletData.totalTokens.toLocaleString()} KLEO
                </p>
              </div>
              <button
                onClick={() => setShowWalletInfo(!showWalletInfo)}
                className="text-[#A7B0B7] hover:text-[#2BFFF1] text-xs"
              >
                {showWalletInfo ? 'Hide' : 'View'} History
              </button>
            </div>
            {showWalletInfo && (
              <div className="mt-3 pt-3 border-t border-[#2BFFF1]/20">
                <p className="text-[#A7B0B7] text-xs mb-2">Purchase History:</p>
                {walletData.purchases.slice(-3).map((purchase, idx) => (
                  <div key={idx} className="flex justify-between text-xs mb-1">
                    <span className="text-[#A7B0B7]">
                      {new Date(purchase.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[#F4F6FA]">
                      {purchase.tokens.toLocaleString()} KLEO
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Method Toggle */}
        <div className="buy-content flex gap-2 mb-4">
          <button
            onClick={() => setPaymentMethod('ETH')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              selectedPaymentMethod === 'ETH'
                ? 'bg-[#2BFFF1]/20 border border-[#2BFFF1] text-[#2BFFF1]'
                : 'bg-white/5 border border-white/10 text-[#A7B0B7] hover:border-white/20'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Crypto (ETH)
          </button>
          <button
            onClick={() => setPaymentMethod('CARD')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              selectedPaymentMethod === 'CARD'
                ? 'bg-[#2BFFF1]/20 border border-[#2BFFF1] text-[#2BFFF1]'
                : 'bg-white/5 border border-white/10 text-[#A7B0B7] hover:border-white/20'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Card
          </button>
        </div>

        {/* Input Section */}
        <div className="buy-content mb-4">
          <label className="block text-[#A7B0B7] text-sm mb-2">
            Amount (USD)
          </label>
          <div className="relative mb-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] text-lg">$</span>
            <input
              type="number"
              value={usdAmount}
              onChange={(e) => handleUsdChange(e.target.value)}
              placeholder="0.00"
              className="input-glass w-full pl-10 pr-4 py-4 text-xl font-semibold"
              min={PRESALE_CONFIG.MIN_PURCHASE}
              max={PRESALE_CONFIG.MAX_PURCHASE}
              step="1"
            />
          </div>
          
          {selectedPaymentMethod === 'ETH' && (
            <div className="relative">
              <input
                type="number"
                value={ethAmount}
                onChange={(e) => handleEthChange(e.target.value)}
                placeholder="0.0"
                className="input-glass w-full px-4 py-3 text-base"
                step="0.001"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] text-sm font-medium">
                ETH
              </span>
            </div>
          )}
          
          {/* Preset Amounts */}
          <div className="flex gap-2 mt-3">
            {[50, 100, 250, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => setPresetAmount(amount)}
                className="flex-1 px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Token Output */}
        {tokenAmount && (
          <div className="buy-content mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[#A7B0B7] text-sm mb-1">You will receive</p>
            <p className="text-[#2BFFF1] text-2xl font-bold">
              {tokenAmount} <span className="text-lg">KLEO</span>
            </p>
            <p className="text-[#A7B0B7] text-xs mt-1">
              At ${currentPrice.toFixed(5)} per token
            </p>
          </div>
        )}

        {/* Buy Button */}
        <button
          onClick={selectedPaymentMethod === 'ETH' ? handleCryptoBuy : handleCardBuy}
          disabled={isSending || !usdAmount || parseFloat(usdAmount) <= 0}
          className="buy-content neon-button w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <>
              {selectedPaymentMethod === 'ETH' ? 'Buy with ETH' : 'Buy with Card'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Helper Text */}
        <div className="buy-content mt-4 flex items-center justify-center gap-2 text-[#A7B0B7] text-xs">
          <Info className="w-4 h-4" />
          <span>Min: ${PRESALE_CONFIG.MIN_PURCHASE} · Max: ${PRESALE_CONFIG.MAX_PURCHASE.toLocaleString()}</span>
        </div>

        {/* Notice */}
        <div className="buy-content mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-yellow-400 text-xs text-center">
            Tokens will be distributed after presale ends. Trading begins after launch.
          </p>
        </div>
      </div>

      {/* Card Payment Modal */}
      {isCardOpen && (
        <CardPayment
          usdAmount={parseFloat(usdAmount) || 0}
          isOpen={isCardOpen}
          onClose={() => setIsCardOpen(false)}
          onSuccess={handleCardSuccess}
          walletAddress={address || ''}
        />
      )}
    </section>
  );
}
