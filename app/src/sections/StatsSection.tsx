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
  const progressRef = useRef<HTMLDivElement>(null);

  const { totalRaised, purchases } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);
  const overallProgress = getOverallProgress(totalRaised);
  const totalBuyers = purchases.length;
  const progressPercentage = overallProgress;

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const progressBar = progressRef.current;

    if (!section || !panel) return;

    const ctx = gsap.context(() => {
      // Card entrance
      gsap.fromTo(panel,
        { y: 60, opacity: 0, scale: 0.96 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );

      // Stats numbers counter animation
      gsap.fromTo('.stats-number',
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );

      // Stat items stagger
      gsap.fromTo('.stats-content',
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );

      // Progress bar animation
      if (progressBar) {
        gsap.fromTo(progressBar,
          { width: '0%' },
          {
            width: `${progressPercentage}%`,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none none',
              once: true,
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [progressPercentage]);

  const statItems = [
    { icon: Users, label: 'Purchases', value: totalBuyers.toLocaleString() },
    { icon: TrendingUp, label: 'Current Stage', value: `${currentStage.stage}/12` },
    { icon: Zap, label: 'Price/KLEO', value: `${currentStage.priceEth} ETH`, highlight: true },
    { icon: Trophy, label: 'Discount', value: `${currentStage.discount}%`, highlight: true },
  ];

  return (
    <section
      ref={sectionRef}
      className="fade-in-section min-h-screen flex items-center justify-center relative overflow-hidden py-20"
    >
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/stats_city_bg_03.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/70 via-[#05060B]/40 to-[#05060B]/80" />
      </div>

      {/* Main Panel */}
      <div
        ref={panelRef}
        className="glass-card relative w-[min(92vw,600px)] rounded-[28px] overflow-hidden p-6 sm:p-8 mx-auto"
        style={{ opacity: 0 }}
      >
        <div className="relative">
          {/* Big Number */}
          <div className="stats-number mb-4 text-center">
            <h2 className="text-[clamp(32px,5vw,56px)] font-bold text-[#2BFFF1] leading-none">
              {totalRaised.toFixed(4)} ETH
            </h2>
          </div>

          <div className="stats-content mb-6 text-center">
            <p className="text-[#F4F6FA] text-lg font-medium">Raised in Presale</p>
          </div>

          {/* Progress Bar */}
          <div className="stats-content mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A7B0B7]">Presale Progress</span>
              <span className="text-[#2BFFF1] font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
              <div
                ref={progressRef}
                className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-1000 ease-out"
                style={{ width: '0%' }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-[#A7B0B7]">
              <span>0</span>
              <span>Hard Cap: {HARD_CAP_ETH.toLocaleString()} ETH</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-content grid grid-cols-2 gap-4 mb-8">
            {statItems.map((stat, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-[#2BFFF1]/30 hover:scale-[1.02]"
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

          {/* Description */}
          <p className="stats-content text-[#A7B0B7] text-sm mb-8 leading-relaxed text-center">
            Join thousands of leverage traders. All trading fees fund weekly leverage trading contests with massive prizes.
          </p>

          {/* CTAs */}
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
