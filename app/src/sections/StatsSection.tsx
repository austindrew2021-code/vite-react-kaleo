import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Users, Trophy, Zap } from 'lucide-react';
import {
  usePresaleStore,
  getCurrentStage,
  getOverallProgress,
  HARD_CAP_ETH,
} from '../store/presaleStore';

gsap.registerPlugin(ScrollTrigger);

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const { totalRaised, purchases } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);
  const overallProgress = getOverallProgress(totalRaised);
  const totalBuyers = purchases.length;

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const bg = bgRef.current;
    const progressBar = progressRef.current;

    if (!section || !panel || !bg) return;

    gsap.fromTo(section,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          pinSpacing: false,
          scrub: 0.2,
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
        }
      });

      scrollTl
        .fromTo(panel,
          { x: '-60vw', rotate: 8, opacity: 0 },
          { x: 0, rotate: 4, opacity: 1, ease: 'none' },
          0
        )
        .fromTo('.stack-card',
          { y: '10vh', scale: 0.96, opacity: 0 },
          { y: 0, scale: 1, opacity: (i: number) => i === 0 ? 0.25 : 0.45, stagger: 0.06, ease: 'none' },
          0.05
        )
        .fromTo('.stats-number',
          { y: '6vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.12
        )
        .fromTo('.stats-content',
          { y: '4vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none', stagger: 0.1 },
          0.18
        )
        .to({}, { duration: 0.4 })
        .fromTo(panel,
          { x: 0, rotate: 4, opacity: 1 },
          { x: '55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo('.stack-card',
          { opacity: (i: number) => i === 0 ? 0.25 : 0.45 },
          { opacity: 0, ease: 'power2.in' },
          0.75
        )
        .fromTo(bg,
          { scale: 1 },
          { scale: 1.05, ease: 'power2.in' },
          0.7
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
              toggleActions: 'play none none reverse'
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
    { icon: Zap, label: 'Price/KLEO', value: `${currentStage.priceEth} ETH`, highlight: true },
    { icon: Trophy, label: 'Discount', value: `${currentStage.discount}%`, highlight: true },
  ];

  return (
    <section
      ref={sectionRef}
      className="pinned-section fade-in-section min-h-screen z-30 flex items-center justify-center relative overflow-hidden"
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

      <div className="relative w-[min(92vw,600px)] mx-auto">
        <div
          className="stack-card absolute glass-card rounded-[28px] overflow-hidden"
          style={{
            width: '100%',
            minHeight: '480px',
            transform: 'translate(16px, 20px) rotate(4deg)',
            opacity: 0.25
          }}
        />
        <div
          className="stack-card absolute glass-card rounded-[28px] overflow-hidden"
          style={{
            width: '100%',
            minHeight: '480px',
            transform: 'translate(8px, 10px) rotate(4deg)',
            opacity: 0.45
          }}
        />

        <div
          ref={panelRef}
          className="glass-card relative rounded-[28px] overflow-hidden p-6 sm:p-8 mx-auto"
          style={{ transform: 'rotate(4deg)', opacity: 0 }}
        >
          <div className="relative">
            <div className="stats-number mb-4 text-center">
              <h2 className="text-[clamp(32px,5vw,56px)] font-bold text-[#2BFFF1] leading-none">
                {totalRaised.toFixed(4)} ETH
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
                  className="h-full bg-gradient-to-r from-[#2BFFF1] via-cyan-400 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '0%' }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2 text-[#A7B0B7]">
                <span>0</span>
                <span>Hard Cap: {HARD_CAP_ETH.toLocaleString()} ETH</span>
              </div>
            </div>

            <div className="stats-content grid grid-cols-2 gap-4 mb-8">
              {statItems.map((stat, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-cyan-500/30 hover:scale-[1.02] hover:shadow-cyan-500/10"
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
      </div>
    </section>
  );
}
