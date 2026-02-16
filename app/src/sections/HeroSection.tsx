import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const bg = bgRef.current;

    if (!section || !card || !bg) return;

    // Quick fade-in & stagger entrance on load/scroll
    gsap.fromTo(section,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const tl = gsap.timeline();

    tl.fromTo(bg,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }
    )
    .fromTo(card,
      { y: 60, scale: 0.96, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo('.hero-title-word',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo('.hero-subtitle',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('.hero-cta',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
      '-=0.2'
    );

  }, []);

  return (
    <section
      ref={sectionRef}
      className="fade-in-section min-h-[80vh] lg:min-h-screen flex items-center justify-center relative overflow-hidden pt-16 pb-12"
    >
      {/* Background Image – eager load to prevent flash */}
      <div ref={bgRef} className="absolute inset-0 w-full h-full">
        <img
          src="/hero_city_bg.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/60 via-transparent to-[#05060B]/80" />
      </div>

      {/* Hero Card – centered on all screens */}
      <div
        ref={cardRef}
        className="glass-card relative w-[min(90vw,1120px)] rounded-[28px] overflow-hidden mx-auto shadow-2xl shadow-cyan-900/20"
      >
        {/* Card Inner Glow */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(43,255,241,0.12) 0%, transparent 50%)'
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 p-8 lg:p-[6%] flex flex-col justify-center">
            {/* Micro Label */}
            <div className="flex items-center gap-2 mb-5">
              <div className="px-3 py-1.5 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#2BFFF1]" />
                <span className="mono text-xs uppercase tracking-[0.12em] text-[#2BFFF1]">
                  Pump.fun Integration
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold text-[#F4F6FA] leading-[1.05] mb-5 text-balance">
              <span className="hero-title-word inline-block">Leverage</span>{' '}
              <span className="hero-title-word inline-block">trade</span>
              <br />
              <span className="hero-title-word inline-block text-[#2BFFF1]">any</span>{' '}
              <span className="hero-title-word inline-block text-[#2BFFF1]">memecoin</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] max-w-[420px] mb-8 leading-relaxed">
              The first leverage trading platform for Pump.fun memecoins. Trade with up to 100x leverage. All fees go to leverage trading contests.
            </p>

            {/* Features Badges */}
            <div className="hero-subtitle flex flex-wrap gap-3 mb-8">
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs flex items-center gap-1.5 transition-transform hover:scale-105 hover:border-[#2BFFF1]/30">
                <TrendingUp className="w-3.5 h-3.5" />
                100x Max Leverage
              </span>
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs flex items-center gap-1.5 transition-transform hover:scale-105 hover:border-[#2BFFF1]/30">
                <Zap className="w-3.5 h-3.5" />
                Instant Execution
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href="#buy"
                className="hero-cta neon-button px-8 py-4 text-base font-semibold flex items-center justify-center gap-2 hover:gap-3 transition-all w-full sm:w-auto"
              >
                Buy Kaleo
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#features"
                className="hero-cta text-[#A7B0B7] hover:text-[#2BFFF1] text-base font-medium transition-colors flex items-center gap-2 px-6 py-4 hover:gap-3"
              >
                Learn More
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right Image – hidden on mobile */}
          <div className="lg:w-[45%] h-[300px] lg:h-auto relative hidden lg:block">
            <img
              src="/hero_card_person.jpg"
              alt="Neon portrait"
              className="absolute inset-0 w-full h-full object-cover rounded-br-[28px]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
