import React from 'react';
import { motion } from 'motion/react';
import { 
  Clock, QrCode, RefreshCw, Lock, HardDrive, Smartphone, ShieldAlert,
  Sparkles, CheckCircle, SmartphoneIcon, Laptop, HelpCircle
} from 'lucide-react';

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#F8FAFC] border-b border-neutral-200/60 relative overflow-hidden">
      {/* Decorative ambient visual meshes */}
      <div className="absolute top-[20%] right-[-5%] w-[30rem] h-[30rem] bg-indigo-200/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[35rem] h-[35rem] bg-blue-100/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-display font-extrabold rounded-full tracking-wider uppercase">
            Supercharged Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-[#0F172A] mt-4 tracking-tight leading-tight">
            Designed for instant, borderless file transfer
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-4 font-sans">
            A minimalist utility engineered with precision. Every module is fine-tuned to connect screens and move bytes cleanly.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Card 1: Temporary Rooms (Span 8) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -6 }}
            className="md:col-span-8 bg-white border border-neutral-200 rounded-[32px] p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-blue-400 transition-[border-color,box-shadow,transform] duration-300 relative overflow-hidden group min-h-[300px] motion-card-gpu"
          >
            {/* Corner glowing element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2563EB] mb-6 group-hover:scale-105 duration-300 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#0F172A] tracking-tight">Temporary Sandbox Rooms</h3>
              <p className="text-sm text-[#64748B] mt-3 max-w-xl font-sans leading-relaxed">
                Set custom expiration limits from 10 minutes up to 7 days. Once the selected countdown runs out, files, cache keys, room history, and trace indices are completely, permanently deleted.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-[10px] font-display font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Secure Tunneling</span>
              <span className="text-xs font-sans text-neutral-400">Pure Ephemerality</span>
            </div>
          </motion.div>

          {/* Card 2: QR Sharing (Span 4) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="md:col-span-4 bg-white border border-neutral-200 rounded-[32px] p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-indigo-400 transition-[border-color,box-shadow,transform] duration-300 h-full relative overflow-hidden group min-h-[300px] motion-card-gpu"
          >
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/5 blur-[25px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-105 duration-300 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-[#0F172A] tracking-tight">Fully Interactive QR</h3>
              <p className="text-sm text-[#64748B] mt-3 font-sans leading-relaxed">
                Generate high-resolution QR codes in seconds. Let guests scan to immediately bypass typing passcode credentials.
              </p>
            </div>
            <div className="mt-8">
              <span className="text-[10px] font-display font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Fast Mobile Pairing</span>
            </div>
          </motion.div>

          {/* Card 3: Real-Time Sync (Span 4) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -6 }}
            className="md:col-span-4 bg-white border border-neutral-200 rounded-[32px] p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-emerald-400 transition-[border-color,box-shadow,transform] duration-300 h-full relative overflow-hidden group min-h-[300px] motion-card-gpu"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-105 duration-300 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-[#0F172A] tracking-tight">Zero-Lag Live Sync</h3>
              <p className="text-sm text-[#64748B] mt-3 font-sans leading-relaxed">
                Experience instantaneous file catalog refreshes. Connected browsers instantly sync view states as bytes are dropped.
              </p>
            </div>
            <div className="mt-8">
              <span className="text-[10px] font-display font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">WebSocket Standard</span>
            </div>
          </motion.div>

          {/* Card 4: Password Protection (Span 8) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="md:col-span-8 bg-white border border-neutral-200 rounded-[32px] p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-red-400 transition-[border-color,box-shadow,transform] duration-300 relative overflow-hidden group min-h-[300px] motion-card-gpu"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-6 group-hover:scale-105 duration-300 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#0F172A] tracking-tight">Active Shield Passcodes</h3>
              <p className="text-sm text-[#64748B] mt-3 max-w-xl font-sans leading-relaxed">
                Add an optional passphrase credential key before rooms can list active shared content. Protects your file transfers on multi-device networks and public coffee shop Wi-Fi routers.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-[10px] font-display font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">Encrypted Access</span>
              <span className="text-xs font-sans text-neutral-400">Custom Defense Keys</span>
            </div>
          </motion.div>

          {/* Card 5: Large Files (Span 8) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -6 }}
            className="md:col-span-8 bg-white border border-neutral-200 rounded-[32px] p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-amber-400 transition-[border-color,box-shadow,transform] duration-300 relative overflow-hidden group min-h-[300px] motion-card-gpu"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-105 duration-300 transition-transform">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#0F172A] tracking-tight">Intelligent Filesize Handling</h3>
              <p className="text-sm text-[#64748B] mt-3 max-w-xl font-sans leading-relaxed">
                Seamlessly transfer photos, folders, docs, and rich binary files up to 25MB inside index-backed client memory. Prompts with warning metrics to optimize transmission integrity.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-[10px] font-display font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Index Backed</span>
              <span className="text-xs font-sans text-neutral-400">Filesize Auditing</span>
            </div>
          </motion.div>

          {/* Card 6: Multi-Device (Span 4) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="md:col-span-4 bg-white border border-neutral-200 rounded-[32px] p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-rose-400 transition-[border-color,box-shadow,transform] duration-300 h-full relative overflow-hidden group min-h-[300px] motion-card-gpu"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 group-hover:scale-105 duration-300 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-[#0F172A] tracking-tight">Cross-Platform Sync</h3>
              <p className="text-sm text-[#64748B] mt-3 font-sans leading-relaxed">
                Connect effortlessly on iOS, Android, macOS, Windows, or Linux. Fully optimized mobile layout adjusts spacing beautifully.
              </p>
            </div>
            <div className="mt-8">
              <span className="text-[10px] font-display font-extrabold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">Universal Responsive</span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
