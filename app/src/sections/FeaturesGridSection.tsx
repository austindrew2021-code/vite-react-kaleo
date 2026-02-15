import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Trophy, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function FeaturesGridSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Section title
      gsap.fromTo('.grid-title',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Card A
      gsap.fromTo('.grid-card-a',
        { x: '-8vw', rotate: -2, opacity: 0 },
        {
          x: 0,
          rotate: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Card B
      gsap.fromTo('.grid-card-b',
        { x: '8vw', rotate: 2, opacity: 0 },
        {
          x: 0,
          rotate: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Thumbnails parallax
      gsap.fromTo('.grid-thumb',
        { y: 20 },
        {
          y: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      title: 'Leverage Contests',
      description: 'All trading fees are pooled into weekly leverage trading contests. Top traders win massive prizes from the fee pool.',
      link: 'View Leaderboard',
      linkHref: '#',
      icon: Trophy,
      image: '/thumb_security.jpg',
      className: 'grid-card-a'
    },
    {
      title: 'Community Driven',
      description: 'Kaleo holders govern the platform, vote on new features, and decide on contest parameters and fee distributions.',
      link: 'Join Community',
      linkHref: '#',
      icon: Users,
      image: '/thumb_community.jpg',
      className: 'grid-card-b'
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="pinned-section min-h-screen relative py-[10vh] z-40"
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src="/grid_city_bg_05.jpg" 
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/90 via-[#05060B]/70 to-[#05060B]/90" />
      </div>

      {/* Content */}
      <div className="relative px-[6vw]">
        {/* Section Title */}
        <h2 className="grid-title text-[clamp(30px,3.6vw,48px)] font-bold text-[#F4F6FA] text-center mb-4">
          Built for <span className="text-[#2BFFF1]">degens</span>
        </h2>
        <p className="text-[#A7B0B7] text-center mb-12 max-w-[500px] mx-auto">
          The first leverage platform designed specifically for memecoin traders
        </p>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`${feature.className} glass-card rounded-[28px] overflow-hidden p-8 relative min-h-[320px] flex flex-col`}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-[#2BFFF1]" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-[#F4F6FA] mb-4">
                {feature.title}
              </h3>
              <p className="text-[#A7B0B7] leading-relaxed mb-6 flex-1">
                {feature.description}
              </p>

              {/* Link */}
              <a 
                href={feature.linkHref}
                className="text-[#2BFFF1] font-medium flex items-center gap-2 hover:gap-3 transition-all"
              >
                {feature.link}
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Thumbnail Image */}
              <div className="grid-thumb absolute bottom-0 right-0 w-[40%] h-[40%] opacity-50">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-tl-[28px]"
                />
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-[#0B0E14]/50 to-[#0B0E14]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
