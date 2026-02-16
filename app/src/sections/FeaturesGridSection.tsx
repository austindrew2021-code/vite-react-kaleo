import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Trophy, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function FeaturesGridSection() {
  useEffect(() => {
    // Quick fade-in on load (draw-in effect)
    gsap.fromTo('.features-grid-section',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    // Stagger fade-in + slight scale for cards & thumbnails
    gsap.fromTo('.grid-card',
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.features-grid-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Parallax on thumbnails (subtle movement)
    gsap.fromTo('.grid-thumb',
      { y: 30 },
      {
        y: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: '.features-grid-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
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
      className="fade-in-section features-grid-section relative py-16 md:py-20 overflow-hidden bg-gradient-to-b from-black to-gray-900"
    >
      {/* Background Image – eager load to prevent flash */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/grid_city_bg_05.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/90 via-[#05060B]/70 to-[#05060B]/90" />
      </div>

      {/* Content */}
      <div className="relative px-6 md:px-8 max-w-7xl mx-auto">
        <h2 className="grid-title text-[clamp(32px,4vw,48px)] font-bold text-[#F4F6FA] text-center mb-6 md:mb-8">
          Built for <span className="text-[#2BFFF1]">degens</span>
        </h2>
        <p className="text-[#A7B0B7] text-center text-base md:text-lg mb-10 md:mb-16 max-w-2xl mx-auto">
          The first leverage platform designed specifically for memecoin traders
        </p>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.className} glass-card rounded-[28px] overflow-hidden p-6 md:p-8 relative min-h-[340px] flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-[#2BFFF1]/30`}
            >
              {/* Icon */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-[#2BFFF1]" />
              </div>

              {/* Content */}
              <div className="grid-content flex flex-col flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-[#F4F6FA] mb-4">
                  {feature.title}
                </h3>
                <p className="text-[#A7B0B7] leading-relaxed mb-6 text-sm md:text-base flex-1">
                  {feature.description}
                </p>
              </div>

              {/* Link */}
              <a
                href={feature.linkHref}
                className="text-[#2BFFF1] font-medium flex items-center gap-2 hover:gap-3 transition-all mt-auto text-sm md:text-base"
              >
                {feature.link}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </a>

              {/* Thumbnail Image */}
              <div className="grid-thumb absolute bottom-0 right-0 w-[35%] h-[35%] md:w-[40%] md:h-[40%] opacity-60 transition-all duration-300 hover:opacity-80">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover rounded-tl-[28px]"
                  loading="eager"
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
