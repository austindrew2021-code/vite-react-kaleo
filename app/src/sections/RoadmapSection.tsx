import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2, Circle, Rocket, Code, Globe, Shield, Zap, TrendingUp, Users, Award } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const phases = [
  {
    title: 'Foundation',
    date: 'Q1 2026',
    status: 'active' as const,
    icon: Rocket,
    items: [
      { text: 'Smart contract development & audit', done: true },
      { text: 'Token presale launch on Sepolia testnet', done: true },
      { text: 'Website & dApp deployment', done: true },
      { text: 'Community building (Twitter, Discord, Telegram)', done: false },
      { text: 'Initial marketing campaign & influencer partnerships', done: false },
      { text: 'DEX listing (Uniswap / QuickSwap)', done: false },
    ],
  },
  {
    title: 'Platform Build',
    date: 'Q2 2026',
    status: 'upcoming' as const,
    icon: Code,
    items: [
      { text: 'Leverage trading dashboard (up to 100x)', done: false },
      { text: 'Pump.fun memecoin integration API', done: false },
      { text: 'Advanced order types (limit, stop-loss, take-profit)', done: false },
      { text: 'Risk management & liquidation engine', done: false },
      { text: 'Weekly trading contest system launch', done: false },
      { text: 'Mobile-responsive trading UI', done: false },
    ],
  },
  {
    title: 'Growth & Expansion',
    date: 'Q3 2026',
    status: 'upcoming' as const,
    icon: Globe,
    items: [
      { text: 'Cross-chain support (Polygon, Arbitrum, Base)', done: false },
      { text: 'Mobile app beta (iOS & Android)', done: false },
      { text: 'CEX listing applications (Tier 2)', done: false },
      { text: 'Staking rewards program launch', done: false },
      { text: 'Partnership integrations with DEX aggregators', done: false },
      { text: 'Governance voting for KLEO holders', done: false },
    ],
  },
  {
    title: 'Ecosystem Maturity',
    date: 'Q4 2026',
    status: 'upcoming' as const,
    icon: Shield,
    items: [
      { text: 'Tier 1 CEX listings', done: false },
      { text: 'Institutional-grade trading features', done: false },
      { text: 'API access for algorithmic traders', done: false },
      { text: 'Yield farming vaults with auto-compounding', done: false },
      { text: 'Community-governed treasury management', done: false },
      { text: 'Multi-language support & global expansion', done: false },
    ],
  },
];

export function RoadmapSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.roadmap-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none', once: true }
        }
      );

      gsap.fromTo('.roadmap-phase',
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none', once: true }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="roadmap"
      className="fade-in-section relative py-24 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-[#080B12] to-[#05060B]" />

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(43,255,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(43,255,241,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="roadmap-header text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium uppercase tracking-widest">
              Development Roadmap
            </span>
          </div>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold text-[#F4F6FA] mb-4 text-balance">
            Building the future of{' '}
            <span className="text-[#2BFFF1]">memecoin leverage</span>
          </h2>
          <p className="text-[#A7B0B7] text-lg max-w-2xl mx-auto leading-relaxed">
            Our development roadmap outlines key milestones from presale through
            full platform maturity. Each phase builds on the last to deliver a
            world-class trading experience.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connecting line (desktop only) */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2BFFF1]/40 via-[#2BFFF1]/20 to-transparent" />

          <div className="space-y-8 lg:space-y-12">
            {phases.map((phase, idx) => {
              const isLeft = idx % 2 === 0;
              const completedCount = phase.items.filter(i => i.done).length;
              const totalCount = phase.items.length;

              return (
                <div
                  key={idx}
                  className={`roadmap-phase relative lg:flex lg:items-start lg:gap-8 ${
                    isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot (desktop) */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-8 z-10">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      phase.status === 'active'
                        ? 'bg-[#2BFFF1] border-[#2BFFF1] shadow-lg shadow-[#2BFFF1]/40'
                        : 'bg-[#0B0E14] border-[#A7B0B7]/30'
                    }`} />
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden lg:block lg:w-1/2" />

                  {/* Phase card */}
                  <div className="lg:w-1/2">
                    <div className={`glass-card rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                      phase.status === 'active'
                        ? 'border-[#2BFFF1]/30 shadow-lg shadow-[#2BFFF1]/5'
                        : ''
                    }`}>
                      {/* Phase header */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          phase.status === 'active'
                            ? 'bg-[#2BFFF1]/15 border border-[#2BFFF1]/30'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          <phase.icon className={`w-6 h-6 ${
                            phase.status === 'active' ? 'text-[#2BFFF1]' : 'text-[#A7B0B7]'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-[#F4F6FA]">
                              {phase.title}
                            </h3>
                            {phase.status === 'active' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#2BFFF1]/15 text-[#2BFFF1] text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[#A7B0B7] text-sm">{phase.date}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#A7B0B7]">Progress</span>
                          <span className="text-[#2BFFF1] font-medium">
                            {completedCount}/{totalCount}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-700"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Items list */}
                      <ul className="space-y-3">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            {item.done ? (
                              <CheckCircle2 className="w-4 h-4 text-[#2BFFF1] mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#A7B0B7]/40 mt-0.5 shrink-0" />
                            )}
                            <span className={`text-sm leading-relaxed ${
                              item.done ? 'text-[#F4F6FA]' : 'text-[#A7B0B7]'
                            }`}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Zap, label: 'Max Leverage', value: '100x' },
            { icon: TrendingUp, label: 'Presale Stages', value: '12' },
            { icon: Users, label: 'Target Users', value: '50K+' },
            { icon: Award, label: 'Weekly Contests', value: 'All Fees' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-xl p-4 text-center">
              <stat.icon className="w-5 h-5 text-[#2BFFF1] mx-auto mb-2" />
              <p className="text-[#F4F6FA] text-lg font-bold">{stat.value}</p>
              <p className="text-[#A7B0B7] text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
