import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, EyeOff, Lock, Trash2, KeyRound, Radio } from 'lucide-react';

export function Security() {
  const points = [
    {
      title: 'Private Access Only',
      desc: 'No search indexation, discovery catalogs, or SEO leaks. Only users possessing your unique custom room password or direct 6-char key link are authorized to sync.',
      icon: <KeyRound className="w-5 h-5 text-blue-400" />
    },
    {
      title: 'Automated Hard Expiration',
      desc: 'No hidden background archives or cold shadow storage. When your room duration timer expires, all corresponding file memory buffers are instantly, permanently dissolved.',
      icon: <Trash2 className="w-5 h-5 text-indigo-400" />
    },
    {
      title: 'Local Memory Sandboxing',
      desc: 'Operating strictly inside browser IndexedDB and active cache frames. Your transfers never touch permanent index databases, blocking third-party leaks completely.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    }
  ];

  return (
    <section id="security" className="py-24 bg-[#0F172A] text-white relative overflow-hidden">
      {/* Decorative premium meshes */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute -bottom-48 -right-48 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-48 -left-48 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
          
          {/* Left Panel: Content Description */}
          <div className="lg:col-span-5 text-left max-w-xl mx-auto lg:mx-0">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[11px] font-display font-extrabold rounded-full tracking-wider uppercase">
              Defensive Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 tracking-tight leading-tight text-white">
              Privacy built as <br />the core engine.
            </h2>
            <p className="text-base text-neutral-400 mt-5 leading-relaxed font-sans">
              Unlike traditional cloud lockers that index and parse your documents for AI models, 68Share is built from day one as an ephemeral transmission router.
            </p>
            <p className="text-base text-neutral-400 mt-4 leading-relaxed font-sans">
              Our servers store zero metadata, process no login credentials, and retain zero files once the timers end. It is the simple, honest way to move project assets.
            </p>

            <div className="mt-8 flex items-center gap-3.5 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <EyeOff className="w-5 h-5 text-pink-400 shrink-0" />
              <p className="text-xs font-sans text-neutral-300">
                Tunnel endpoints are protected with active client-to-client handshake flags to ensure peerless trust.
              </p>
            </div>
          </div>

          {/* Right Panel: Stunning Cryptographic SVG + Bullet list */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            {/* SVG Cryptographic Animation Graphics */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8 shadow-2xl">
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                {/* Outer orbital wireframe rotating */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-dashed border-blue-500/20"
                />

                {/* Inner orbital wireframe rotating opposite */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                  className="absolute p-4 inset-0 rounded-full border border-spaced border-indigo-500/30"
                />

                {/* Central glowing shield icon */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))", "drop-shadow(0 0 24px rgba(59, 130, 246, 0.7))", "drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))"] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-lg shadow-blue-500/35"
                >
                  <Lock className="w-8 h-8" />
                </motion.div>

                {/* Satellite Nodes */}
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="absolute top-2 left-6 w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"
                />
                <motion.div 
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-3 right-6 w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1.5 uppercase mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Military-Grade Standard
                </span>
                <h4 className="text-lg font-display font-semibold text-white tracking-tight">Active Cryptographic Hash</h4>
                <p className="text-xs text-neutral-400 font-sans mt-2 leading-relaxed">
                  Every connection packet is structured dynamically to prevent router eavesdropping or DNS packet capturing.
                </p>
              </div>
            </div>

            {/* Bullets List */}
            <div className="flex flex-col gap-4">
              {points.map((pt, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 sm:p-6 flex gap-4 items-start hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/5 text-blue-400">
                    {pt.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white text-base tracking-wide">
                      {pt.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-neutral-400 leading-relaxed mt-1.5">
                      {pt.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
