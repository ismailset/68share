import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, CheckCircle2, ChevronRight, Github, Twitter, MessageSquare, 
  ArrowUpRight, Shield, Zap, RefreshCw, FileText
} from 'lucide-react';

interface FooterProps {
  onCreateRoom: () => void;
}

export function Footer({ onCreateRoom }: FooterProps) {
  return (
    <footer className="bg-white border-t border-neutral-200/60 font-sans relative">
      
      {/* Target Location for Pricing */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F8FAFC] border border-neutral-200/70 rounded-[40px] p-8 md:p-14 relative overflow-hidden shadow-sm">
          {/* Tag element */}
          <div className="absolute top-0 right-0 px-5 py-2.5 bg-blue-50 text-[#2563EB] border-l border-b border-blue-100 rounded-bl-3xl text-[10px] font-display font-extrabold tracking-widest uppercase">
            Community Core
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left pricing features info */}
            <div className="lg:col-span-7 text-left">
              <span className="px-3 py-1 bg-blue-50 text-[#2563EB] text-[10px] font-display font-bold rounded-full uppercase tracking-wider">
                Transparent Tier
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-[#0F172A] mt-4 tracking-tight leading-none">
                Simple Pricing. <br />Free Forever.
              </h2>
              
              <p className="text-base text-[#64748B] mt-5 leading-relaxed">
                68Share is built as an open-access transfer utility. We don't believe in locking down vital developer workflows behind paywalls, subscription alerts, or marketing hooks.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Unlimited transient workspaces',
                  'Selectable room limits (10m - 7d)',
                  'Direct deep links & live QR codes',
                  'In-browser sandbox persistence',
                  'Secure passcode access guards',
                  'Active telemetry logs'
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-sans font-medium text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Premium Box Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-neutral-200 p-8 md:p-10 rounded-[32px] shadow-lg text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-[#EA580C] border border-amber-100 px-3 py-1 rounded-full text-[10px] font-display font-extrabold uppercase mb-6">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Free Forever Tier</span>
                </div>

                <div className="font-display text-6xl font-black text-[#0F172A] tracking-tight flex items-baseline justify-center">
                  $0
                  <span className="text-sm font-sans font-medium text-neutral-400 ml-1.5">/ forever</span>
                </div>

                <p className="text-sm text-[#64748B] mt-4 max-w-[260px] mx-auto">
                  Move your bytes quickly with all core standard sharing features configured on demand.
                </p>

                <button
                  onClick={onCreateRoom}
                  className="w-full mt-8 bg-[#2563EB] hover:bg-blue-700 text-white font-sans font-semibold text-[15px] py-4 rounded-full transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
                >
                  <span>Build Safe Room</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 5 — Final CTA banner */}
      <section className="bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] py-24 border-t border-neutral-200/60 text-center relative overflow-hidden">
        {/* Blue radial gradient glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <span className="px-3 py-1 bg-blue-50 text-[#2563EB] text-[10px] font-display font-bold rounded-full tracking-wider uppercase mb-4 inline-block">
            Start Syncing Instantly
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-[#0F172A] mt-2">
            Ready to Share?
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-4 max-w-xl mx-auto font-sans leading-relaxed">
            Generate an ephemeral sandbox room instantly and start transferring crucial directories or folders across networks in less than 10 seconds.
          </p>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={onCreateRoom}
              className="bg-[#2563EB] hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 text-white font-sans font-bold py-4 px-10 rounded-full transition-all active:scale-[0.98] cursor-pointer text-sm tracking-wide shadow-md flex items-center gap-2"
            >
              <span>Create Room Now</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Structured SaaS Footer Directory Map */}
      <div className="border-t border-neutral-200/60 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 pb-12 border-b border-neutral-200/65">
            
            {/* Column 1: Brand details */}
            <div className="col-span-2 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-display font-extrabold text-[15px] shadow-sm shadow-blue-500/20">
                  68
                </div>
                <span className="font-display font-bold text-lg text-[#0F172A] tracking-tight">68Share</span>
              </div>
              <p className="text-sm text-[#64748B] mt-4 max-w-xs font-sans leading-relaxed">
                Empowering rapid, costless cross-device transfers. Powered by direct IndexedDB memory buffers and instant browser handshakes.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="text-left">
              <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3 text-xs font-sans font-medium text-neutral-500">
                <li><a href="#how-it-works" className="hover:text-[#2563EB] transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-[#2563EB] transition-colors">Security Model</a></li>
                <li><a href="#pricing" className="hover:text-[#2563EB] transition-colors">Pricing Tiers</a></li>
                <li className="flex items-center gap-1">
                  <span className="hover:text-neutral-600 cursor-pointer">Live Node</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="text-left">
              <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-xs font-sans font-medium text-neutral-500">
                <li><span className="hover:text-[#2563EB] cursor-pointer text-neutral-500 flex items-center gap-0.5">Docs <ArrowUpRight className="w-3 h-3 text-neutral-400" /></span></li>
                <li><span className="hover:text-[#2563EB] cursor-pointer flex items-center gap-0.5">Release Notes <Sparkles className="w-3 h-3 text-emerald-500" /></span></li>
                <li><span className="hover:text-[#2563EB] cursor-pointer">Browser Sandbox</span></li>
                <li><span className="hover:text-[#2563EB] cursor-pointer">Status Monitor</span></li>
              </ul>
            </div>

            {/* Column 4: Legals */}
            <div className="text-left">
              <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wider mb-4">Legals</h4>
              <ul className="space-y-3 text-xs font-sans font-medium text-neutral-500">
                <li><span className="hover:text-[#2563EB] cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-[#2563EB] cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-[#2563EB] cursor-pointer">Security Auditing</span></li>
                <li><span className="hover:text-[#2563EB] cursor-pointer">Telemetry Discretion</span></li>
              </ul>
            </div>

            {/* Column 5: Social Channels */}
            <div className="text-left">
              <h4 className="text-xs font-display font-extrabold text-[#0F172A] uppercase tracking-wider mb-4">Connect</h4>
              <ul className="space-y-3 text-xs font-sans font-medium text-neutral-500">
                <li>
                  <span className="hover:text-[#2563EB] cursor-pointer flex items-center gap-2">
                    <Github className="w-4 h-4 text-neutral-600" />
                    <span>GitHub</span>
                  </span>
                </li>
                <li>
                  <span className="hover:text-[#2563EB] cursor-pointer flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-neutral-600" />
                    <span>X Profile</span>
                  </span>
                </li>
                <li>
                  <span className="hover:text-[#2563EB] cursor-pointer flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-neutral-600" />
                    <span>Discord Mirror</span>
                  </span>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-sans font-medium text-[11px] text-neutral-400">
              © {new Date().getFullYear()} 68Share. Custom premium infrastructure designed under high-trust constraints.
            </span>
            <div className="flex gap-4">
              <span className="p-2 border border-neutral-100 rounded-full hover:bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-[#0F172A] transition-colors cursor-pointer shadow-sm">
                <Github className="w-4 h-4" />
              </span>
              <span className="p-2 border border-neutral-100 rounded-full hover:bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-[#0F172A] transition-colors cursor-pointer shadow-sm">
                <Twitter className="w-4 h-4" />
              </span>
              <span className="p-2 border border-neutral-100 rounded-full hover:bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-[#0F172A] transition-colors cursor-pointer shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
