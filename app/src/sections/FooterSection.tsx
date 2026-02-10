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

    const ctx = gsap.context(() => {
      gsap.fromTo('.footer-title',
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

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
      className="relative bg-[#0B0E14] py-16 z-[60]"
    >
      <div className="max-w-[980px] mx-auto px-6">
        {/* Main Content */}
        <div className="text-center mb-12">
          <h3 className="footer-title text-[clamp(24px,3vw,36px)] font-bold text-[#F4F6FA] mb-4">
            Ready to <span className="text-[#2BFFF1]">leverage trade</span>?
          </h3>
          <p className="footer-title text-[#A7B0B7] mb-4">
            The first leverage platform for Pump.fun memecoins
          </p>
          <a 
            href="mailto:hello@kaleo.xyz"
            className="footer-title inline-flex items-center gap-2 text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors"
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
              className="footer-link text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm font-medium flex items-center gap-2"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          ))}
        </div>

        {/* Socials */}
        <div className="flex justify-center gap-4 mb-12">
          {socials.map((social, index) => (
            <a
              key={index}
              href={social.href}
              className="footer-link w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#A7B0B7] hover:text-[#2BFFF1] hover:border-[#2BFFF1]/50 transition-all"
              aria-label={social.label}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#2BFFF1] flex items-center justify-center">
                <span className="text-[#05060B] font-bold text-xs">K</span>
              </div>
              <span className="text-[#F4F6FA] font-semibold text-sm">Kaleo</span>
            </div>

            {/* Copyright */}
            <p className="text-[#A7B0B7] text-xs">
              © 2026 Kaleo. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex gap-4">
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-xs transition-colors">
                Privacy
              </a>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-xs transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
