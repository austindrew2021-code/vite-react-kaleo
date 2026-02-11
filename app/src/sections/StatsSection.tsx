// @ts-nocheck
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Users, Layers, Clock, ChevronRight } from 'lucide-react';
import { usePresaleStore } from '../store/presaleStore';
import { PRESALE_CONFIG } from '../config/presaleConfig';

gsap.registerPlugin(ScrollTrigger);

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  
  const { totalRaised, currentStage, getStageData } = usePresaleStore();
  
  const stageData = getStageData(currentStage);
  
  // Calculate total target across all stages
  const totalTarget = PRESALE_CONFIG.STAGES.reduce((acc, stage) => acc + stage.target, 0);
  const overallProgress = (totalRaised / totalTarget) * 100;

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const bg = bgRef.current;

    if (!section || !panel || !bg) return;

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
          { y: 0, opacity: 1, ease: 'none' },
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
    }, section);

    return () => ctx.revert();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section 
      ref={sectionRef} 
      className="section-pinned z-30 flex items-center justify-center"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/stats_city_bg_03.jpg" 
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/70 via-[#05060B]/40 to-[#05060B]/80" />
      </div>

      {/* Stacked Cards Container */}
      <div className="relative">
        {/* Back Stack Cards */}
        <div 
          className="stack-card absolute glass-card rounded-[28px] overflow-hidden"
          style={{ 
            width: 'min(92vw, 560px)', 
            minHeight: '520px',
            transform: 'translate(16px, 20px) rotate(4deg)',
            opacity: 0.25
          }}
        />
        <div 
          className="stack-card absolute glass-card rounded-[28px] overflow-hidden"
          style={{ 
            width: 'min(92vw, 560px)', 
            minHeight: '520px',
            transform: 'translate(8px, 10px) rotate(4deg)',
            opacity: 0.45
          }}
        />

        {/* Main Panel */}
        <div 
          ref={panelRef}
          className="glass-card relative w-[min(92vw,560px)] rounded-[28px] overflow-hidden p-8"
          style={{ transform: 'rotate(4deg)', opacity: 0 }}
        >
          {/* Content */}
          <div className="relative">
            {/* Stage Indicator */}
            <div className="stats-content flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium">
                Stage {currentStage} Active
              </span>
            </div>

            {/* Big Number */}
            <div className="stats-number mb-2 text-center">
              <h2 className="text-[clamp(36px,5vw,56px)] font-bold text-[#2BFFF1] leading-none">
                {formatCurrency(totalRaised)}
              </h2>
            </div>
            
            <div className="stats-content mb-6 text-center">
              <p className="text-[#F4F6FA] text-lg font-medium">
                Total Raised
              </p>
              <p className="text-[#A7B0B7] text-sm">
                of {formatCurrency(totalTarget)} goal
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="stats-content mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#A7B0B7]">Overall Progress</span>
                <span className="text-[#2BFFF1] font-medium">{overallProgress.toFixed(2)}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
            </div>

            {/* Current Stage Progress */}
            <div className="stats-content mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#A7B0B7] text-sm">Stage {currentStage} Progress</span>
                <span className="text-[#2BFFF1] font-medium">{stageData.progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-500"
                  style={{ width: `${stageData.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#A7B0B7]">
                <span>${stageData.raised.toLocaleString()}</span>
                <span>${stageData.target.toLocaleString()}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-content grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1">
                  <Layers className="w-4 h-4" />
                  Current Stage
                </div>
                <p className="text-[#F4F6FA] text-xl font-bold">{currentStage} / {PRESALE_CONFIG.TOTAL_STAGES}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Token Price
                </div>
                <p className="text-[#2BFFF1] text-xl font-bold">${PRESALE_CONFIG.STAGES[currentStage - 1]?.price.toFixed(5)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Presale Status
                </div>
                <p className="text-[#F4F6FA] text-xl font-bold">Active</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-[#A7B0B7] text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Total Supply
                </div>
                <p className="text-[#F4F6FA] text-xl font-bold">1B KLEO</p>
              </div>
            </div>

            {/* Stage List */}
            <div className="stats-content mb-6">
              <p className="text-[#A7B0B7] text-sm mb-3">Stage Prices</p>
              <div className="space-y-2 max-h-[120px] overflow-y-auto">
                {PRESALE_CONFIG.STAGES.map((stage) => (
                  <div 
                    key={stage.stage}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      stage.stage === currentStage 
                        ? 'bg-[#2BFFF1]/10 border border-[#2BFFF1]/30' 
                        : stage.stage < currentStage 
                          ? 'bg-white/5 opacity-60'
                          : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        stage.stage === currentStage 
                          ? 'bg-[#2BFFF1] text-[#05060B]'
                          : stage.stage < currentStage
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/10 text-[#A7B0B7]'
                      }`}>
                        {stage.stage < currentStage ? '✓' : stage.stage}
                      </span>
                      <span className={stage.stage === currentStage ? 'text-[#F4F6FA]' : 'text-[#A7B0B7]'}>
                        Stage {stage.stage}
                      </span>
                    </div>
                    <span className={stage.stage === currentStage ? 'text-[#2BFFF1] font-medium' : 'text-[#A7B0B7]'}>
                      ${stage.price.toFixed(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="stats-content flex items-center justify-center gap-4">
              <a 
                href="#buy"
                className="neon-button px-6 py-3 text-sm font-semibold flex items-center gap-2"
              >
                Buy Kaleo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#whitepaper"
                className="text-[#A7B0B7] hover:text-[#2BFFF1] text-sm font-medium transition-colors flex items-center gap-1"
              >
                White Paper
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
