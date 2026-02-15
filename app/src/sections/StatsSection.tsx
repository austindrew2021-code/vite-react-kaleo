import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Users, Trophy, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const stats = {
    raised: 2840000,
    goal: 5000000,
    traders: 1247,
    volume24h: 15800000,
    maxLeverage: 100,
  };

  const progressPercentage = (stats.raised / stats.goal) * 100;

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const bg = bgRef.current;
    const progressBar = progressRef.current;

    if (!section || !panel || !bg) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.25,
          anticipatePin: 1,
          fastScrollEnd: true,
        }
      });

      scrollTl
        .fromTo(panel, { x: '-60vw', rotate: 8, opacity: 0 }, { x: 0, rotate: 4, opacity: 1, ease: 'none' }, 0)
        .fromTo('.stack-card', { y: '10vh', scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: (i: number) => i === 0 ? 0.25 : 0.45, stagger: 0.06, ease: 'none' }, 0.05)
        .fromTo('.stats-number', { y: '6vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.12)
        .fromTo('.stats-content', { y: '4vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.18)
        .to({}, { duration: 0.4 })
        .fromTo(panel, { x: 0, rotate: 4, opacity: 1 }, { x: '55vw', opacity: 0, ease: 'power2.in' }, 0.7)
        .fromTo('.stack-card', { opacity: (i: number) => i === 0 ? 0.25 : 0.45 }, { opacity: 0, ease: 'power2.in' }, 0.75)
        .fromTo(bg, { scale: 1 }, { scale: 1.05, ease: 'power2.in' }, 0.7);

      if (progressBar) {
        gsap.fromTo(progressBar,
          { width: '0%' },
          { width: `${progressPercentage}%`, duration: 1.5, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' } }
        );
      }

    }, section);

    return () => ctx.revert();
  }, [progressPercentage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return formatCurrency(value);
  };

  return (
    <section 
      ref={sectionRef} 
      className="pinned-section fade-in-section min-h-screen z-30 flex items-center justify-center relative"
    >
      <div ref={bgRef} className="absolute inset-0 w-full h-full">
        <img 
          src="/stats_city_bg_03.jpg" 
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/70 via-[#05060B]/40 to-[#05060B]/80" />
      </div>

      <div className="relative">
        <div className="stack-card absolute glass-card rounded-[28px] overflow-hidden" style={{ width: 'min(92vw, 600px)', minHeight: '480px', transform: 'translate(16px, 20px) rotate(4deg)', opacity: 0.25 }} />
        <div className="stack-card absolute glass-card rounded-[28px] overflow-hidden" style={{ width: 'min(92vw, 600px)', minHeight: '480px', transform: 'translate(8px, 10px) rotate(4deg)', opacity: 0.45 }} />

        <div ref={panelRef} className="glass-card relative w-[min(92vw,600px)] rounded-[28px] overflow-hidden p-8 mx-auto" style={{ transform: 'rotate(4deg)', opacity: 0 }}>
          <div className="relative">
            <div className="stats-number mb-2 text-center">
              <h2 className="text-[clamp(36px,5vw,56px)] font-bold text-[#2BFFF1] leading-none">
                {formatCurrency(stats.raised)}
              </h2>
            </div>

            <div className="stats-content mb-6 text-center">
              <p className="text-[#F4F6FA] text-lg font-medium">Raised in presale</p>
            </div>

            <div className="stats-content mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#A7B0B7]">Presale Progress</span>
                <span className="text-[#2BFFF1] font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div ref={progressRef} className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full" style={{ width: '0%' }} />
              </div>
              <div className="flex justify-between text-xs mt-2 text-[#A7B0B7]">
                <span>0</span>
                <span>Goal: {formatCurrency(stats.goal)}</span>
              </div>
            </div>

            <div className="stats-content grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1"><Users className="w-4 h-4" />Traders</div>
                <p className="text-[#F4F6FA] text-xl font-bold">{stats.traders.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1"><TrendingUp className="w-4 h-4" />24h Volume</div>
                <p className="text-[#F4F6FA] text-xl font-bold">{formatVolume(stats.volume24h)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1"><Zap className="w-4 h-4" />Max Leverage</div>
                <p className="text-[#2BFFF1] text-xl font-bold">{stats.maxLeverage}x</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1"><Trophy className="w-4 h-4" />Contests</div>
                <p className="text-[#F4F6FA] text-xl font-bold">Live</p>
              </div>
            </div>

            <p className="stats-content text-[#A7B0B7] text-sm mb-6 leading-relaxed text-center">
              Join thousands of leverage traders. All trading fees fund weekly leverage trading contests with massive prizes.
            </p>

            <div className="stats-content flex items-center justify-center gap-4">
              <a href="#buy" className="neon-button px-6 py-3 text-sm font-semibold flex items-center gap-2">
                Buy Kaleo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#features" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-sm font-medium transition-colors flex items-center gap-1">
                How It Works
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
