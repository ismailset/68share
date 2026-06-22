import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, ArrowRight, Laptop, Tablet, Smartphone, FileUp, ShieldCheck, Clock, Check, AlertCircle } from 'lucide-react';

interface HeroProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onCheckRoomExists: (code: string) => boolean;
}

export function Hero({ onCreateRoom, onJoinRoom, onCheckRoomExists }: HeroProps) {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = joinCode.trim().toUpperCase();
    if (formattedCode.length < 6) {
      setErrorMsg('Code must be 6 characters');
      return;
    }
    if (onCheckRoomExists(formattedCode)) {
      onJoinRoom(formattedCode);
    } else {
      setErrorMsg(`Room "${formattedCode}" not found. Try creating one!`);
    }
  };

  const handleChangeCode = (val: string) => {
    setJoinCode(val.toUpperCase().slice(0, 6));
    setErrorMsg('');
  };

  return (
    <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 text-center">
        
        {/* Sparkle/Brand Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900/[0.04] border border-neutral-900/[0.06] rounded-full text-xs font-sans font-medium text-neutral-800 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>Now Active: Clean Multi-Tab Real-Time Sharing</span>
        </motion.div>

        {/* Headline & Subheadline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-serif font-bold tracking-wide text-[#111111] max-w-4xl mx-auto leading-[1.1]"
        >
          Share Files Between <br />Devices <span className="text-[#2563EB]">In Seconds.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-[20px] text-[#666666] max-w-2xl mx-auto mt-6 font-sans leading-[1.75]"
        >
          Create a temporary room, share a code, and instantly transfer files between phones, laptops, tablets, and teams. No signup required.
        </motion.p>

        {/* CTA Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 justify-center sm:flex-row relative z-20"
        >
          <button
            onClick={onCreateRoom}
            className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white font-sans font-semibold text-[17px] py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Create Room
            <ArrowRight className="w-5 h-5 animate-pulse" />
          </button>

          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full sm:w-auto bg-white hover:bg-neutral-50 text-[#111111] border border-black/5 py-4 px-10 rounded-2xl font-sans font-semibold text-[17px] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              Join Room
            </button>
          ) : (
            <motion.form 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              onSubmit={handleJoinSubmit}
              className="flex items-center gap-2 p-1.5 bg-white border border-black/5 rounded-2xl w-full max-w-md shadow-lg"
            >
              <input
                type="text"
                value={joinCode}
                onChange={(e) => handleChangeCode(e.target.value)}
                placeholder="Enter 6-char code"
                className="pl-4 pr-1 py-2 font-mono font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none w-full tracking-wider text-center uppercase"
                autoFocus
              />
              <button
                type="submit"
                className="bg-[#111111] hover:bg-neutral-800 text-white font-sans font-semibold text-[14px] px-6 py-3 rounded-xl whitespace-nowrap transition-colors cursor-pointer"
              >
                Join
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* Error notice */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-red-600 font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1 — Interactive Preview Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 md:mt-20 max-w-4xl mx-auto rounded-3xl bg-white border border-neutral-200/60 shadow-2xl shadow-neutral-100/60 p-4 md:p-6 text-left relative"
        >
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          
          {/* Header Controls mimicking app UI */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 px-3 py-1 bg-neutral-50 border border-neutral-200/50 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-[11px] font-semibold tracking-wider text-neutral-500">ROOM CODE</span>
                <span className="font-mono text-xs font-bold text-neutral-900 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">68A7F2</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded-full bg-neutral-900 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">MB</div>
                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">IP</div>
                <div className="w-6 h-6 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-[10px] text-neutral-500 font-sans">1+</div>
              </div>
              <span className="text-[11px] font-sans font-medium text-neutral-400">3 Online</span>
            </div>
          </div>

          {/* Interactive Mock sync representation layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Visual multi-device transfer schema animations */}
            <div className="md:col-span-4 bg-neutral-50 border border-neutral-200/40 rounded-2xl p-4 flex flex-col justify-between min-h-[180px]">
              <span className="text-xs font-sans text-neutral-400 font-medium">Uploader Source</span>
              
              <div className="flex flex-col items-center gap-3 my-4">
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-md flex items-center justify-center text-blue-600"
                >
                  <Laptop className="w-6 h-6" />
                </motion.div>
                <div className="text-center">
                  <p className="text-xs font-sans font-semibold text-neutral-900">MacBook Pro</p>
                  <p className="text-[10px] font-mono text-neutral-400">192.168.1.12</p>
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-sans font-medium text-center flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Connected to Room</span>
              </div>
            </div>

            {/* Middle transferring animated node */}
            <div className="md:col-span-4 flex flex-col items-center justify-center min-h-[140px] text-center relative px-2">
              <div className="absolute inset-0 bg-radial-gradient from-blue-50/40 via-transparent to-transparent -z-10" />
              
              {/* Path indicators */}
              <div className="text-xs font-sans font-medium text-neutral-400 mb-2">Instant Transfer</div>
              
              <div className="w-full flex items-center justify-center gap-1.5 my-3">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"
                >
                  <Share2 className="w-4 h-4" />
                </motion.div>
                <div className="flex gap-1">
                  <motion.span 
                    animate={{ x: [0, 20, 0], opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-600" 
                  />
                  <motion.span 
                    animate={{ x: [0, 20, 0], opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-600" 
                  />
                  <motion.span 
                    animate={{ x: [0, 20, 0], opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay: 0.8 }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-600" 
                  />
                </div>
              </div>

              {/* Countdown badge */}
              <div className="mt-2 bg-yellow-50 text-yellow-700 border border-yellow-100 px-3 py-1 rounded-full text-[10px] font-mono font-medium inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Room expires in 59:45</span>
              </div>
            </div>

            {/* Right receiver dashboard mock card */}
            <div className="md:col-span-4 bg-neutral-50 border border-neutral-200/40 rounded-2xl p-4 flex flex-col justify-between min-h-[180px]">
              <span className="text-xs font-sans text-neutral-400 font-medium">Receiver Targets</span>
              
              <div className="flex justify-center gap-6 my-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow flex items-center justify-center text-neutral-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[10.5px] font-sans font-medium text-neutral-600">iPhone 15</span>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow flex items-center justify-center text-neutral-600">
                    <Tablet className="w-5 h-5" />
                  </div>
                  <span className="text-[10.5px] font-sans font-medium text-neutral-600">iPad Pro</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 font-sans text-center">
                Syncing files magically over the air
              </div>
            </div>

          </div>

          {/* Floaters showing actual card mock details */}
          <div className="mt-6 border-t border-neutral-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div 
              style={{ x: -5 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="bg-white border border-neutral-200/80 rounded-xl p-3 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <span className="text-xs font-bold font-mono">ZIP</span>
                </div>
                <div>
                  <h4 className="text-xs font-sans font-semibold text-neutral-950">design_assets_v2.zip</h4>
                  <p className="text-[10px] font-mono text-neutral-400">142.5 MB • Uploaded by MacBook</p>
                </div>
              </div>
              <span className="text-[11px] font-serif font-sans font-medium text-emerald-600">Ready</span>
            </motion.div>

            <motion.div 
              style={{ x: 5 }}
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
              className="bg-white border border-neutral-200/80 rounded-xl p-3 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <span className="text-xs font-bold font-mono">MP4</span>
                </div>
                <div>
                  <h4 className="text-xs font-sans font-semibold text-neutral-950">screencast_demo.mp4</h4>
                  <p className="text-[10px] font-mono text-neutral-400">42.1 MB • Just now</p>
                </div>
              </div>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </motion.div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
