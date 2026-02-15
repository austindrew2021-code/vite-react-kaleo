import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

gsap.registerPlugin(ScrollTrigger);

export function FAQSection() {
  const faqs = [
    {
      question: 'What is Kaleo?',
      answer: 'Kaleo is a leverage trading platform for Pump.fun memecoins on Polygon, offering up to 100x leverage with liquidation protection.'
    },
    {
      question: 'How does the presale work?',
      answer: 'Tokens are sold in stages with increasing prices. All funds go to liquidity and development.'
    },
    {
      question: 'How do contests work?',
      answer: 'All trading fees are pooled weekly. Top traders by PNL win prizes from the pool.'
    },
    {
      question: 'Is there a team allocation?',
      answer: 'Yes, 10% vested over 24 months with cliffs.'
    },
    {
      question: 'How do I buy on testnet?',
      answer: 'Switch to Sepolia, get test ETH from faucet, connect wallet, and buy with fake funds.'
    },
  ];

  useEffect(() => {
    // Quick stagger fade-in for FAQ items when section enters view
    gsap.fromTo('.faq-item', 
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.faq-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  }, []);

  return (
    <section className="pinned-section fade-in-section py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto faq-section">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="faq-item border border-cyan-500/20 rounded-xl overflow-hidden bg-gray-900/60 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-white hover:text-cyan-300 transition-colors font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 text-gray-300 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
