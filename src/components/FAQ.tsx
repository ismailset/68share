import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Is 68Share completely free?",
      answer: "Yes, 68Share is entirely free. We do not require payment details, subscription plans, or unlock codes. Our goal is to provide a clean, secure, and instant utility for moving assets cross-device with absolute freedom."
    },
    {
      question: "How secure is 68Share?",
      answer: "Highly secure. 68Share utilizes the client-side Web Crypto API to handle hashing and verify room credentials. Files are kept secure, buffered in your browser's local IndexedDB container, and are only transmitted across authenticated, temporary channels. We do not store or inspect your private file contents."
    },
    {
      question: "Do I need an account to share files?",
      answer: "No, there is zero registration or signup required. You don't need to provide an email or phone number. Simply create a 6-character room code, share it with your destination device, and begin transferring your files or clipboards instantly."
    },
    {
      question: "How long are files stored?",
      answer: "68Share rooms are fully ephemeral. Files only exist in your active room container. You can delete them at any time, or they will automatically self-destruct once the room expires (ranging from 10 minutes to 7 days, depending on your custom room selection)."
    },
    {
      question: "Can I transfer files between phones and laptops?",
      answer: "Absolutely! 68Share is designed specifically for seamless cross-platform sharing. You can scan the active room QR code on any iOS or Android phone to instantly join your laptop's room and begin bidirectionally transferring files, photos, or text."
    },
    {
      question: "Is there a file size limit?",
      answer: "To ensure blazing-fast local memory buffering and reliable performance within standard mobile and desktop web browsers, we support file transfers up to 25MB per file."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white border-b border-neutral-100 relative overflow-hidden">
      {/* Decorative vector shapes */}
      <div className="absolute top-[30%] left-[-10%] w-96 h-96 bg-blue-500/5 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-indigo-500/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-display font-extrabold rounded-full tracking-wider uppercase inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0F172A] mt-4 tracking-tight leading-tight">
            Have questions about 68Share?
          </h2>
          <p className="text-sm text-neutral-500 mt-3 font-sans">
            Find immediate answers regarding security, file limits, room expiration, and more.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div 
                key={index} 
                className="border border-neutral-200/80 hover:border-neutral-300 rounded-2xl bg-neutral-50/40 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-5 text-left font-sans font-semibold text-neutral-800 hover:text-neutral-950 transition-colors cursor-pointer text-sm md:text-base outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.question}</span>
                  <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 shrink-0 transition-transform duration-300">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs md:text-sm font-sans text-neutral-500 leading-relaxed border-t border-neutral-200/40">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
