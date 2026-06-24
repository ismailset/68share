import React from 'react';
import { motion } from 'motion/react';
import { Plus, Send, RefreshCw, Sparkles, QrCode, FileCheck } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      no: '01',
      title: 'Create Secure Room',
      desc: 'Pick your duration limits, set an optional passcode, and lock in your ephemeral workspace channel in a single click.',
      icon: <Plus className="w-6 h-6 text-[#2563EB]" />,
      badge: 'Immediate Setup'
    },
    {
      no: '02',
      title: 'Share the Key',
      desc: 'Send the 6-character code link or display the interactive, mobile-optimized QR code for instant scan-to-join.',
      icon: <Send className="w-6 h-6 text-indigo-600" />,
      badge: 'Zero Friction'
    },
    {
      no: '03',
      title: 'Transfer Files',
      desc: 'Drag & drop photos, documents, and folders. Files instantly synchronize in real time across paired browser dashboards.',
      icon: <RefreshCw className="w-6 h-6 text-emerald-600" />,
      badge: 'Pure Speed'
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#FFFFFF] border-b border-neutral-100 relative overflow-hidden">
      {/* Accent Background Highlights */}
      <div className="absolute top-[30%] left-[-10%] w-[40rem] h-[35rem] rounded-full bg-[#3B82F6]/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header content */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="px-3 py-1 bg-blue-50 text-[#2563EB] text-[11px] font-display font-extrabold rounded-full tracking-wider uppercase">
            Seamless Workflow
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-[#0F172A] mt-4 tracking-tight leading-tight">
            Designed for instant, fluid file delivery
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-4 font-sans max-w-2xl mx-auto">
            Zero accounts to sign, no credentials, and no applications to install. Transfer assets between screens in less than 10 seconds.
          </p>
        </div>

        {/* Floating Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 relative">
          
          {/* Subtle linking line in background */}
          <div className="hidden md:block absolute top-[90px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 -z-10" />

          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8 }}
              className="bg-white border border-neutral-200 hover:border-blue-400 p-8 rounded-[32px] text-left relative transition-[border-color,box-shadow,transform] duration-300 shadow-md hover:shadow-xl hover:shadow-blue-500/5 group motion-card-gpu"
            >
              {/* Card glowing decorator */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-indigo-50/10 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

              <div className="flex items-center justify-between">
                {/* Step circle icon */}
                <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-neutral-100 flex items-center justify-center shadow-inner relative group-hover:bg-white duration-300 transition-all">
                  {step.icon}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display font-semibold text-[#64748B] bg-neutral-100 px-2 py-0.5 rounded-full select-none">
                    {step.badge}
                  </span>
                  <span className="font-mono text-3xl font-black text-neutral-200 select-none group-hover:text-blue-200 duration-300 transition-colors">
                    {step.no}
                  </span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-display font-semibold text-[#0F172A] mt-8 group-hover:text-[#2563EB] duration-300 transition-colors">
                {step.title}
              </h3>

              <p className="text-sm text-[#64748B] mt-3 leading-relaxed font-sans">
                {step.desc}
              </p>

              {/* Action trigger dummy just to enrich detail */}
              <div className="mt-6 flex items-center gap-1.5 text-xs font-sans font-bold text-neutral-400 group-hover:text-[#2563EB] duration-300 transition-colors pointer-events-none">
                <span>View workflow details</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}
