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

  return (
    <section className="pinned-section fade-in-section min-h-screen py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Roadmap
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {phases.map((phase, idx) => (
            <div key={idx} className="relative p-8 rounded-2xl bg-gray-900/60 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-500 text-black font-bold rounded-full text-sm">
                {phase.date}
              </div>

              <h3 className="text-2xl font-bold text-cyan-400 mt-6 mb-6 text-center">{phase.title}</h3>

              <ul className="space-y-4 text-gray-300">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-cyan-400 mr-3 mt-1">•</span>
                    {item}
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
