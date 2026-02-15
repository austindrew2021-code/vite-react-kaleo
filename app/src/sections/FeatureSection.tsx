import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Shield, Rocket } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function FeatureSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const phone = phoneRef.current;
    const arc = arcRef.current;

    if (!section || !card || !phone) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { y: '8vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.feature-headline',
        { x: '-6vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo(phone,
        { x: '10vw', scale: 0.98, opacity: 0 },
        {
          x: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      if (arc) {
        const length = arc.getTotalLength();
        gsap.set(arc, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(arc, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      gsap.fromTo('.feature-bullet',
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none reverse'
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  const features = [
    { 
      icon: Rocket, 
      text: 'Trade any Pump.fun memecoin',
      image: '/thumb_pump.jpg'
    },
    { 
      icon: TrendingUp, 
      text: 'Up to 100x leverage',
      image: '/thumb_leverage.jpg'
    },
    { 
      icon: Shield, 
      text: 'Liquidation protection',
      image: '/thumb_security.jpg'
    },
  ];

  return (
    <section 
      ref={sectionRef} 
      id="features"
      className="pinned-section fade-in-section min-h-screen relative py-[10vh] z-40"
    >
      <div className="absolute inset-0 w-full h-full">
        <img 
          src="/feature_city_bg_04.jpg" 
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/60 to-[#05060B]/90" />
      </div>

      <div 
        ref={cardRef}
        className="glass-card relative mx-auto w-[min(92vw,1180px)] rounded-[28px] overflow-hidden min-h-[70vh]"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-col lg:flex-row h-full">
          <div className="flex-1 p-[6%] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium">
                Pump.fun Integration
              </span>
            </div>
            
            <h2 className="feature-headline text-[clamp(30px,3.6vw,48px)] font-bold text-[#F4F6FA] mb-6">
              Trade <span className="text-[#2BFFF1]">any memecoin</span> with leverage
            </h2>
            
            <p className="text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] mb-8 leading-relaxed max-w-[420px]">
              Connect your wallet and start leverage trading any memecoin from Pump.fun instantly. No waiting, no restrictions.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="feature-bullet flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-[#2BFFF1]" />
                  </div>
                  <span className="text-[#F4F6FA] font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <a 
              href="#buy"
              className="neon-button w-fit px-6 py-3 text-sm font-semibold flex items-center gap-2"
            >
              Start Trading
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div 
            ref={phoneRef}
            className="flex-1 relative flex items-center justify-center p-[6%]"
            style={{ opacity: 0 }}
          >
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 400 500"
              fill="none"
            >
              <path
                ref={arcRef}
                d="M 50 250 Q 200 50 350 250 Q 200 450 50 250"
                stroke="#2BFFF1"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
            
            <div className="relative z-10">
              <img 
                src="/feature_phone_mockup.jpg" 
                alt="Trading app mockup"
                className="w-full max-w-[280px] rounded-2xl shadow-2xl"
              />
              <div 
                className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl -z-10"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(43,255,241,0.4) 0%, transparent 70%)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
