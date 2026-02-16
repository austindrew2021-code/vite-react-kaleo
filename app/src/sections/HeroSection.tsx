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


    const ctx = gsap.context(() => {
      // Background fade
      gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.8 });

      // Card entrance
      const tl = gsap.timeline();
      tl.fromTo(card,
        { y: 40, scale: 0.97, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('.hero-title-word',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo('.hero-subtitle',
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        '-=0.2'
      )
      .fromTo('.hero-cta',
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        '-=0.15'
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="fade-in-section min-h-[80vh] flex items-center justify-center relative overflow-hidden pt-20 pb-12"
    >
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 w-full h-full">
        <img
          src="/hero_city_bg.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/60 via-transparent to-[#05060B]/80" />
      </div>

      {/* Hero Card */}
      <div
        ref={cardRef}
        className="glass-card relative w-[min(90vw,1120px)] rounded-[28px] overflow-hidden mx-auto"
        style={{ opacity: 0 }}
      >
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(43,255,241,0.08) 0%, transparent 50%)'
          }}
        />

        <div className="relative flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 p-8 lg:p-[6%] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#2BFFF1]" />
                <span className="mono text-xs uppercase tracking-[0.12em] text-[#2BFFF1]">
                  Pump.fun Integration
                </span>
              </div>
            </div>

            <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold text-[#F4F6FA] leading-[1.05] mb-4 text-balance">
              <span className="hero-title-word inline-block">Leverage</span>{' '}
              <span className="hero-title-word inline-block">trade</span>
              <br />
              <span className="hero-title-word inline-block text-[#2BFFF1]">any</span>{' '}
              <span className="hero-title-word inline-block text-[#2BFFF1]">memecoin</span>
            </h1>

            <p className="hero-subtitle text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] max-w-[420px] mb-6 leading-relaxed">
              The first leverage trading platform for Pump.fun memecoins. Trade with up to 100x leverage. All fees go to leverage trading contests.
            </p>

            <div className="hero-subtitle flex flex-wrap gap-3 mb-8">
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs flex items-center gap-1.5 transition-transform hover:scale-105">
                <TrendingUp className="w-3.5 h-3.5" />
                100x Max Leverage
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs flex items-center gap-1.5 transition-transform hover:scale-105">
                <Zap className="w-3.5 h-3.5" />
                Instant Execution
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#buy"
                className="hero-cta neon-button px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Buy Kaleo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="hero-cta text-[#A7B0B7] hover:text-[#2BFFF1] text-sm font-medium transition-colors flex items-center gap-1"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:w-[45%] h-[300px] lg:h-auto relative hidden md:block">
            <img
              src="/hero_card_person.jpg"
              alt="Neon portrait"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
