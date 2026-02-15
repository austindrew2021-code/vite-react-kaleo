import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const content = contentRef.current;
    const bg = bgRef.current;

    if (!section || !card || !content || !bg) return;

    // Initial quick fade-in on load (draw-in effect)
    gsap.fromTo(section, 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline();

      loadTl
        .fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.6 })
        .fromTo(card, 
          { y: '18vh', scale: 0.96, opacity: 0 }, 
          { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo('.hero-title-word', 
          { y: 24, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
          '-=0.5'
        )
        .fromTo('.hero-subtitle', 
          { y: 14, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
          '-=0.3'
        )
        .fromTo('.hero-cta', 
          { y: 14, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
          '-=0.2'
        );

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          pinSpacing: false,
          scrub: 0.2,                  // Faster response → feels natural
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
        }
      });

      scrollTl
        .fromTo(card, 
          { x: 0, opacity: 1 }, 
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(bg, 
          { scale: 1, opacity: 1 }, 
          { scale: 1.06, opacity: 0.6, ease: 'power2.in' },
          0.7
        );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pinned-section fade-in-section min-h-screen z-10 flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Image – eager load to prevent flash */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
      >
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
        className="glass-card relative w-[min(90vw,1120px)] rounded-[28px] overflow-hidden mx-auto"
        style={{ opacity: 0 }}
      >
        {/* Card Inner Glow */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(43,255,241,0.08) 0%, transparent 50%)'
          }}
        />

        {/* Content */}
        <div ref={contentRef} className="relative flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 p-[6%] flex flex-col justify-center">
            {/* Micro Label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#2BFFF1]" />
                <span className="mono text-xs uppercase tracking-[0.12em] text-[#2BFFF1]">
                  Pump.fun Integration
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold text-[#F4F6FA] leading-[1.05] mb-4">
              <span className="hero-title-word inline-block">Leverage</span>{' '}
              <span className="hero-title-word inline-block">trade</span>
              <br />
              <span className="hero-title-word inline-block text-[#2BFFF1]">any</span>{' '}
              <span className="hero-title-word inline-block text-[#2BFFF1]">memecoin</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] max-w-[420px] mb-6 leading-relaxed">
              The first leverage trading platform for Pump.fun memecoins. Trade with up to 100x leverage. All fees go to leverage trading contests.
            </p>

            {/* Features */}
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

            {/* CTAs */}
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
