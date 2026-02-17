import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Zap, TrendingUp, ArrowUp } from 'lucide-react';
import { usePresaleStore } from '../store/presaleStore';
import { getCurrentStage } from '../store/presaleStore';

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const { totalRaised, purchases } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);

  // Simple momentum proxy for presale FOMO (not trading)
  const recentBuys = purchases.filter(p => Date.now() - p.timestamp < 15 * 60 * 1000).length;
  const isActive = recentBuys > 0;

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const bg = bgRef.current;

    if (!section || !card || !bg) return;

    gsap.fromTo(section, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });

    const tl = gsap.timeline();

    tl.fromTo(bg, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' })
      .fromTo(card, { y: 80, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out' }, '-=0.8')
      .fromTo('.hero-title-word', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, '-=0.7')
      .fromTo('.hero-subtitle', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' }, '-=0.4')
      .fromTo('.hero-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' }, '-=0.3')
      .fromTo('.hero-badge', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.4');
  }, []);

  return (
    <section
      ref={sectionRef}
      className="fade-in-section min-h-[85vh] lg:min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-16"
    >
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 w-full h-full">
        <img
          src="/hero_city_bg.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/65 via-transparent to-[#05060B]/85" />
      </div>

      {/* Hero Card */}
      <div
        ref={cardRef}
        className="glass-card relative w-[min(90vw,1180px)] rounded-[32px] overflow-hidden mx-auto shadow-2xl shadow-cyan-900/25"
      >
        <div
          className="absolute inset-0 rounded-[32px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 35% 15%, rgba(43,255,241,0.14) 0%, transparent 55%)',
          }}
        />

        <div className="relative flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center">
            {/* Presale Badge */}
            <div className="hero-badge flex items-center gap-3 mb-6 flex-wrap">
              <div className="px-4 py-2 rounded-full bg-[#2BFFF1]/12 border border-[#2BFFF1]/35 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#2BFFF1]" />
                <span className="text-xs uppercase tracking-wider text-[#2BFFF1] font-medium">
                  Presale Live – Stage {currentStage.stage}/12
                </span>
              </div>

              {/* Subtle momentum cue */}
              <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-2 text-sm">
                <ArrowUp className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-medium">
                  {isActive ? 'Active buying' : 'Price rising'}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[clamp(36px,5vw,64px)] font-extrabold text-[#F4F6FA] leading-[1.05] mb-6 text-balance">
              <span className="hero-title-word inline-block">Leverage</span>{' '}
              <span className="hero-title-word inline-block">trade</span>
              <br />
              <span className="hero-title-word inline-block text-[#2BFFF1]">any</span>{' '}
              <span className="hero-title-word inline-block text-[#2BFFF1]">memecoin</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-[#A7B0B7] text-[clamp(16px,1.3vw,18px)] max-w-[480px] mb-10 leading-relaxed">
              First leverage trading platform built for Pump.fun memecoins. Up to 100x leverage. All platform fees fuel trading contests and rewards.
            </p>

            {/* Badges */}
            <div className="hero-subtitle flex flex-wrap gap-4 mb-10">
              <span className="px-5 py-2.5 rounded-xl bg-white/6 border border-white/12 text-[#A7B0B7] text-sm flex items-center gap-2 transition-transform hover:scale-105 hover:border-[#2BFFF1]/40">
                <TrendingUp className="w-4 h-4 text-[#2BFFF1]" />
                100x Max Leverage
              </span>
              <span className="px-5 py-2.5 rounded-xl bg-white/6 border border-white/12 text-[#A7B0B7] text-sm flex items-center gap-2 transition-transform hover:scale-105 hover:border-[#2BFFF1]/40">
                <Zap className="w-4 h-4 text-[#2BFFF1]" />
                Instant Execution
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <a
                href="#buy"
                className="hero-cta neon-button px-10 py-5 text-lg font-semibold flex items-center justify-center gap-3 hover:gap-4 transition-all w-full sm:w-auto shadow-lg shadow-[#2BFFF1]/20"
              >
                Buy Kaleo Now
                <ArrowRight className="w-6 h-6" />
              </a>
              <a
                href="#features"
                className="hero-cta text-[#A7B0B7] hover:text-[#2BFFF1] text-lg font-medium transition-colors flex items-center gap-3 px-8 py-5 hover:gap-4"
              >
                Explore Features
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right Visual */}
          <div className="lg:w-[48%] h-[320px] lg:h-auto relative hidden lg:block">
            <img
              src="/hero_card_person.jpg"
              alt="Neon character"
              className="absolute inset-0 w-full h-full object-cover rounded-br-[32px]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
