import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Twitter, MessageCircle, Send, Mail, FileText, Shield, Trophy } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function FooterSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Initial quick fade-in on load (draw-in effect)
    gsap.fromTo(section, 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const ctx = gsap.context(() => {
      // Title fade-in
      gsap.fromTo('.footer-title',
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%', // earlier for quicker feel
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Links stagger fade-in
      gsap.fromTo('.footer-link',
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Social icons stagger + hover glow
      gsap.fromTo('.footer-social',
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  const links = [
    { label: 'Tokenomics', href: '#', icon: FileText },
    { label: 'Docs', href: '#docs', icon: FileText },
    { label: 'Audit', href: '#', icon: Shield },
    { label: 'Contests', href: '#', icon: Trophy },
  ];

  const socials = [
    { label: 'Twitter', href: '#', icon: Twitter },
    { label: 'Discord', href: '#', icon: MessageCircle },
    { label: 'Telegram', href: '#', icon: Send },
  ];

  return (
    <footer
      ref={sectionRef}
      id="docs"
      className="fade-in-section relative bg-[#0B0E14] py-20 overflow-hidden"
    >
      <div className="max-w-[980px] mx-auto px-6">
        {/* Main Content */}
        <div className="text-center mb-12">
          <h3 className="footer-title text-[clamp(24px,3vw,36px)] font-bold text-[#F4F6FA] mb-4 transition-colors hover:text-[#2BFFF1]">
            Ready to <span className="text-[#2BFFF1]">leverage trade</span>?
          </h3>
          <p className="footer-title text-[#A7B0B7] mb-4">
            The first leverage platform for Pump.fun memecoins
          </p>
          <a
            href="mailto:hello@kaleo.xyz"
            className="footer-title inline-flex items-center gap-2 text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-base font-medium"
          >
            <Mail className="w-5 h-5" />
            hello@kaleo.xyz
          </a>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="footer-link text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm font-medium flex items-center gap-2 hover:gap-3"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          ))}
        </div>

        {/* Socials */}
        <div className="flex justify-center gap-6 mb-12">
          {socials.map((social, index) => (
            <a
              key={index}
              href={social.href}
              className="footer-social w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#A7B0B7] hover:text-[#2BFFF1] hover:border-[#2BFFF1]/50 hover:scale-110 transition-all duration-300"
              aria-label={social.label}
            >
              <social.icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        {/* Divider + Bottom Info */}
        <div className="border-t border-white/10 pt-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2BFFF1] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-[#05060B] font-black text-xl tracking-tighter">K</span>
              </div>
              <span className="text-[#F4F6FA] font-semibold">Kaleo</span>
            </div>

            {/* Copyright */}
            <p className="text-[#A7B0B7]">
              © 2026 Kaleo. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex gap-6">
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors">
                Privacy
              </a>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
