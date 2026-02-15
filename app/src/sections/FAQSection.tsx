import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="border border-cyan-500/20 rounded-xl overflow-hidden bg-gray-900/40 backdrop-blur-sm"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-white hover:text-cyan-400 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-gray-300">
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
