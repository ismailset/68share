import React from 'react';
import { Plus, Send, RefreshCw } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      no: '01',
      title: 'Create Room',
      desc: 'Set custom room durations and optional passcodes to establish a private, temporary transfer tunnel instantly.',
      icon: <Plus className="w-5 h-5 text-neutral-800" />,
    },
    {
      no: '02',
      title: 'Share Access',
      desc: 'Share the custom room code, a simple direct web URL, or display the dynamic, mobile-ready QR code.',
      icon: <Send className="w-5 h-5 text-neutral-800" />,
    },
    {
      no: '03',
      title: 'Real-Time Sync',
      desc: 'Drag and drop files to sync instantly with other screens. Download instantly with peerless high speed.',
      icon: <RefreshCw className="w-5 h-5 text-neutral-800" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-y border-neutral-200/50 relative">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-sans font-bold tracking-widest text-[#2563EB] uppercase">Seamless Workflow</p>
          <h2 className="text-3xl md:text-4xl lg:text-[44px] font-serif font-bold text-[#111111] mt-3 tracking-wide">
            How It Works
          </h2>
          <p className="text-sm md:text-base text-[#666666] mt-4 leading-[1.75] font-sans">
            No emails, no accounts, no software installs. Transfer photos, documents, and folders in less than 10 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          
          {/* Subtle connecting lines */}
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 -z-0" />

          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              
              {/* Step circle container */}
              <div className="w-14 h-14 rounded-2xl bg-white border border-black/10 flex items-center justify-center shadow-lg shadow-neutral-100/60 group-hover:scale-105 duration-300 transition-transform relative">
                {step.icon}
                <span className="absolute -top-2.5 -right-2 bg-[#2563EB] border border-[#2563EB]/40 text-white rounded-md text-[10px] font-mono font-bold px-1.5 py-0.5 tracking-tighter shadow-sm shadow-blue-500/25">
                  {step.no}
                </span>
              </div>

              <h3 className="text-lg font-sans font-semibold text-[#111111] mt-6 tracking-wide">
                {step.title}
              </h3>

              <p className="text-xs md:text-sm text-[#666666] mt-3 leading-[1.75] max-w-[280px] font-sans">
                {step.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
