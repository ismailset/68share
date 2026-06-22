import React from 'react';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onCreateRoom: () => void;
}

export function Footer({ onCreateRoom }: FooterProps) {
  return (
    <footer className="bg-white border-t border-neutral-200/50">
      
      {/* Target Location for Pricing scroll */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-4 md:px-6">
        <div className="bg-[#FAFAFA] border border-neutral-200/50 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 bg-blue-50 text-blue-700 border-l border-b border-blue-100 rounded-bl-2xl text-[10px] font-mono font-bold tracking-widest uppercase">
            Transparent Tier
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Left Pricing Details */}
            <div className="text-left">
              <h3 className="text-xs font-sans font-bold tracking-widest text-[#2563EB] uppercase">Costless Sharing</h3>
              <h2 className="text-3xl font-serif font-bold text-neutral-950 mt-2 tracking-wide">
                Simple Pricing. <br />Free Forever.
              </h2>
              
              <p className="text-sm text-[#666666] mt-4 leading-[1.75] font-sans">
                68Share is built as an open, accessible connection utility. There are no surprise limitations, paywalls, or registrations.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs md:text-sm text-neutral-700 font-sans">Unlimited rooms & active transfers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs md:text-sm text-neutral-700 font-sans">Self-expiring rooms (10 mins to 7 days)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs md:text-sm text-neutral-700 font-sans">Direct link & laser-sharp QR-code shares</span>
                </div>
              </div>
            </div>

            {/* Premium Call Card */}
            <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-2xl shadow-sm text-center">
              <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Default Core Plan</span>
              </div>

              <div className="font-sans text-5xl font-extrabold text-[#111111] tracking-wide flex items-baseline justify-center">
                $0
                <span className="text-xs font-sans font-normal text-neutral-400 ml-1">/ forever</span>
              </div>

              <p className="text-xs text-[#666666] font-sans mt-3">
                Created to move bytes fast. Standard features accessible instantly.
              </p>

              <button
                onClick={onCreateRoom}
                className="w-full mt-6 bg-[#2563EB] hover:bg-blue-700 text-white font-sans font-semibold text-sm py-3 px-6 rounded-full transition-transform active:scale-98 cursor-pointer shadow-md shadow-blue-500/10"
              >
                Create Free Room
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Section 5 — Final CTA banner */}
      <section className="bg-neutral-50 py-16 md:py-24 border-t border-black/5 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-[44px] font-serif font-bold tracking-wide text-[#111111]">
            Ready to Share?
          </h2>
          <p className="text-sm md:text-base text-[#666666] mt-3 max-w-xl mx-auto leading-[1.75] font-sans">
            Create an instantaneous connection room and start transferring files between screens in less than 10 seconds.
          </p>
          <div className="mt-8">
            <button
              onClick={onCreateRoom}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-sans font-semibold py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/15 active:scale-98 transition-all cursor-pointer text-sm"
            >
              Create Room Instant
            </button>
          </div>
        </div>
      </section>

      {/* Corporate credits line */}
      <div className="border-t border-neutral-200/50 py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#2563EB] flex items-center justify-center font-mono font-bold text-white text-[11px]">
              68
            </div>
            <span className="font-sans font-medium text-xs text-neutral-400">
              © {new Date().getFullYear()} 68Share. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-neutral-400 font-sans font-medium">
            <span className="hover:text-neutral-600 cursor-pointer">Security Policy</span>
            <span className="hover:text-neutral-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-neutral-600 cursor-pointer">GitHub Mirror</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
