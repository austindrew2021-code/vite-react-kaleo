import { useEffect } from 'react';
import { gsap } from 'gsap';
import { CheckCircle2, Circle, Rocket, Code, Globe, Shield, Zap, TrendingUp, Users, Award } from 'lucide-react';

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
  useEffect(() => {
    gsap.fromTo('.roadmap-section',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    gsap.fromTo('.phase-card',
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.roadmap-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  return (
    <section id="roadmap" className="fade-in-section roadmap-section relative py-20 bg-gradient-to-b from-black to-gray-900 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-sm font-medium uppercase tracking-widest mb-4">
            Development Roadmap
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-[#F4F6FA] mb-4 text-balance">
            Building the future of <span className="text-[#2BFFF1]">memecoin leverage</span>
          </h2>
          <p className="text-[#A7B0B7] text-lg max-w-2xl mx-auto leading-relaxed">
            Our roadmap outlines key milestones from presale through full platform maturity.
          </p>
        </div>

        <div className="space-y-12 lg:space-y-16">
          {phases.map((phase, idx) => {
            const isActive = phase.status === 'active';
            const completedCount = phase.items.filter(i => i.done).length;
            const totalCount = phase.items.length;
            const progress = (completedCount / totalCount) * 100;

            return (
              <div key={idx} className="phase-card">
                <div className={`glass-card rounded-2xl p-6 md:p-8 transition-all duration-300 ${
                  isActive
                    ? 'border-[#2BFFF1]/40 shadow-lg shadow-[#2BFFF1]/10 animate-pulse-slow'
                    : 'border-white/10 hover:border-[#2BFFF1]/20 hover:shadow-cyan-500/10'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${
                      isActive
                        ? 'bg-[#2BFFF1]/15 border border-[#2BFFF1]/30 shadow-md shadow-[#2BFFF1]/20'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <phase.icon className={`w-6 h-6 md:w-7 md:h-7 ${
                        isActive ? 'text-[#2BFFF1]' : 'text-[#A7B0B7]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl md:text-2xl font-bold text-[#F4F6FA]">
                          {phase.title}
                        </h3>
                        {isActive && (
                          <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/15 text-[#2BFFF1] text-xs font-bold uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[#A7B0B7] text-sm mt-1">{phase.date}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#A7B0B7]">Progress</span>
                      <span className="text-[#2BFFF1] font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <ul className="space-y-3 md:space-y-4">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {item.done ? (
                          <CheckCircle2 className="w-5 h-5 text-[#2BFFF1] mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#A7B0B7]/40 mt-0.5 shrink-0" />
                        )}
                        <span className={`text-base md:text-lg leading-relaxed ${
                          item.done ? 'text-[#F4F6FA]' : 'text-[#A7B0B7]'
                        }`}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { icon: Zap, label: 'Max Leverage', value: '100x' },
            { icon: TrendingUp, label: 'Presale Stages', value: '12' },
            { icon: Users, label: 'Target Traders', value: '50K+' },
            { icon: Award, label: 'Weekly Contests', value: 'All Fees' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/10">
              <stat.icon className="w-6 h-6 text-[#2BFFF1] mx-auto mb-3" />
              <p className="text-[#F4F6FA] text-xl font-bold">{stat.value}</p>
              <p className="text-[#A7B0B7] text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
