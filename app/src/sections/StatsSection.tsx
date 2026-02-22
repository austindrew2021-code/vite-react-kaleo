import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Users, Trophy, Zap } from 'lucide-react';
import {
  usePresaleStore,
  getCurrentStage,
  getOverallProgress,
  HARD_CAP_USD,
} from '../store/presaleStore';
import { createClient } from '@supabase/supabase-js';

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

gsap.registerPlugin(ScrollTrigger);

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const { totalRaised } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);
  const overallProgress = getOverallProgress(totalRaised);

  const [totalBuyers, setTotalBuyers] = useState<number>(0);

  // Fetch distinct buyer count from Supabase on mount
  useEffect(() => {
    if (!supabase) return;
    const fetchBuyers = async () => {
      const { data, error } = await supabase
        .from('presale_purchases')
        .select('wallet_address');
      if (error) { console.error('Buyers fetch error:', error.message); return; }
      const unique = new Set(data?.map((r: { wallet_address: string }) => r.wallet_address.toLowerCase()));
      setTotalBuyers(unique.size);
    };
    fetchBuyers();

    // Listen for new purchases and increment buyer count
    const channel = supabase
      .channel('stats-buyers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presale_purchases' }, () => {
        fetchBuyers(); // re-fetch to get accurate unique count
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const progressBar = progressRef.current;
    if (!section || !panel) return;

    const ctx = gsap.context(() => {
      // Simple fade-up — no pin, no scrub, no rotation
      gsap.fromTo(panel,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          }
        }
      );

      gsap.fromTo('.stats-content',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
          }
        }
      );

      if (progressBar) {
        gsap.fromTo(progressBar,
          { width: '0%' },
          {
            width: `${overallProgress}%`,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none none',
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [overallProgress]);

  const statItems = [
    { icon: Users, label: 'Buyers', value: totalBuyers.toLocaleString() },
    { icon: TrendingUp, label: 'Current Stage', value: `${currentStage.stage}/12` },
    { icon: Zap, label: 'Price/KLEO', value: `$${currentStage.priceUsd.toFixed(4)}`, highlight: true },
    { icon: Trophy, label: 'Discount', value: `${currentStage.discount}%`, highlight: true },
  ];

  return (
    <section
      ref={sectionRef}
      className="fade-in-section relative py-24 flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/stats_city_bg_03.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/70 via-[#05060B]/40 to-[#05060B]/80" />
      </div>

      <div
        ref={panelRef}
        className="glass-card relative w-[min(92vw,600px)] rounded-[28px] overflow-hidden p-6 sm:p-8 mx-auto"
        style={{ opacity: 0 }}
      >
        <div className="relative">
          <div className="stats-number mb-4 text-center">
            <h2 className="text-[clamp(32px,5vw,56px)] font-bold text-[#2BFFF1] leading-none">
              ${totalRaised.toLocaleString('en-US', {maximumFractionDigits: 0})} USD
            </h2>
          </div>

          <div className="stats-content mb-6 text-center">
            <p className="text-[#F4F6FA] text-lg font-medium">Raised in Presale</p>
          </div>

          <div className="stats-content mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A7B0B7]">Presale Progress</span>
              <span className="text-[#2BFFF1] font-medium">{overallProgress.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-gray-800/80 rounded-full overflow-hidden shadow-inner">
              <div
                ref={progressRef}
                className="h-full bg-gradient-to-r from-[#2BFFF1] via-cyan-400 to-purple-600 rounded-full"
                style={{ width: '0%' }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-[#A7B0B7]">
              <span>0</span>
              <span>Hard Cap: ${HARD_CAP_USD.toLocaleString()} USD</span>
            </div>
          </div>

          <div className="stats-content grid grid-cols-2 gap-4 mb-8">
            {statItems.map((stat, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center gap-3 text-[#A7B0B7] text-sm mb-2">
                  <stat.icon className="w-5 h-5" />
                  {stat.label}
                </div>
                <p className={`text-2xl font-bold ${stat.highlight ? 'text-[#2BFFF1]' : 'text-[#F4F6FA]'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <p className="stats-content text-[#A7B0B7] text-sm mb-8 leading-relaxed text-center">
            Join thousands of leverage traders. All trading fees fund weekly leverage trading contests with massive prizes.
          </p>

          <div className="stats-content flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#buy"
              className="neon-button px-8 py-4 text-base font-semibold flex items-center justify-center gap-2 hover:gap-3 transition-all w-full sm:w-auto"
            >
              Buy Kaleo
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              className="text-[#A7B0B7] hover:text-[#2BFFF1] text-base font-medium transition-colors flex items-center gap-2 px-6 py-4"
            >
              How It Works
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
