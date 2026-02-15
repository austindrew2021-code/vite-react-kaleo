import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function RoadmapSection() {
  const phases = [
    {
      title: "Phase 1 – Presale & Launch",
      date: "Q1 2026",
      items: [
        "Presale launch on Polygon",
        "Token generation & distribution",
        "DEX listing (Uniswap / QuickSwap)",
        "Community building & marketing"
      ]
    },
    {
      title: "Phase 2 – Platform Development",
      date: "Q2 2026",
      items: [
        "Leverage trading dashboard (up to 100x)",
        "Advanced order types & risk management",
        "Mobile app (iOS & Android)"
      ]
    },
    {
      title: "Phase 3 – Ecosystem Expansion",
      date: "Q3-Q4 2026",
      items: [
        "Cross-chain integration",
        "Staking & yield farming",
        "Partnerships & CEX listings",
        "Governance token utility"
      ]
    }
  ];

  useEffect(() => {
    // Quick fade-in on load (draw-in effect)
    gsap.fromTo('.roadmap-section', 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    // Stagger fade-in + slight scale for phase cards
    gsap.fromTo('.phase-card', 
      { opacity: 0, y: 30, scale: 0.95 },
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
    <section className="pinned-section fade-in-section roadmap-section relative py-20 bg-gradient-to-b from-black to-gray-900 overflow-hidden">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-500 bg-clip-text text-transparent">
          Roadmap
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {phases.map((phase, idx) => (
            <div 
              key={idx}
              className="phase-card relative p-8 rounded-2xl bg-gray-900/70 border border-cyan-500/20 backdrop-blur-md shadow-xl shadow-cyan-900/10 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-[1.02]"
            >
              {/* Date Badge */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold rounded-full text-sm shadow-lg shadow-cyan-500/40">
                {phase.date}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-cyan-300 mt-10 mb-6 text-center tracking-tight">
                {phase.title}
              </h3>

              {/* Items */}
              <ul className="space-y-4 text-gray-200 text-base">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-cyan-400 text-xl font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
