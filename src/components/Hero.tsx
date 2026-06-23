import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop, Smartphone, Share2, ArrowRight, Lock, Clock, Users, Zap, 
  ShieldCheck, FileText, Image as ImageIcon, Film, Archive, Download, 
  Plus, Check, Clipboard, AlertCircle, ChevronRight, Activity, CloudLightning
} from 'lucide-react';

interface HeroProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onCheckRoomExists: (code: string) => boolean;
}

export function Hero({ onCreateRoom, onJoinRoom, onCheckRoomExists }: HeroProps) {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  // Simulated stats state for counters
  const [filesShared, setFilesShared] = useState(984020);
  const [roomsCreated, setRoomsCreated] = useState(48290);

  useEffect(() => {
    // Elegant minor tick-ups to simulate active global sharing activity in real-time
    const interval = setInterval(() => {
      setFilesShared(prev => prev + Math.floor(Math.random() * 2) + 1);
      if (Math.random() > 0.8) {
        setRoomsCreated(prev => prev + 1);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = joinCode.trim().toUpperCase();
    if (formattedCode.length < 6) {
      setErrorMsg('Code must be exactly 6 characters');
      return;
    }
    if (onCheckRoomExists(formattedCode)) {
      onJoinRoom(formattedCode);
    } else {
      setErrorMsg(`Room "${formattedCode}" not found. Try creating a new one!`);
    }
  };

  const handleChangeCode = (val: string) => {
    setJoinCode(val.toUpperCase().slice(0, 6));
    setErrorMsg('');
  };

  return (
    <div className="bg-gradient-to-b from-white via-[#F8FAFC] to-white">
      {/* Hero Section */}
      <section id="hero" className="relative pt-16 pb-20 md:pt-28 md:pb-32 overflow-hidden">
        {/* Subtle background ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-[10%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-blue-100/40 blur-[120px]" />
          <div className="absolute top-[20%] right-[5%] w-[30rem] h-[30rem] rounded-full bg-indigo-100/30 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 text-left max-w-2xl mx-auto lg:mx-0">
              {/* Product Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 shadow-sm rounded-full text-[11px] font-medium text-neutral-800 mb-6"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="font-sans font-medium tracking-wide">68Share Premium v2.5 Active</span>
              </motion.div>

              {/* Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-display font-medium tracking-tight text-[#0F172A] leading-[1.1] md:leading-[1.08]"
              >
                Share Files Between <br />
                Devices In{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 font-extrabold pb-1">
                  Seconds.
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-[#64748B] mt-5 font-sans leading-[1.75]"
              >
                Create a temporary room, share a secured code, and instantly transfer directories or documents between smartphones, tablets, laptops, and teams. No registration, client logs, or bloated cloud accounts required.
              </motion.p>

              {/* Action Area */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row gap-3.5 relative z-20"
              >
                <button
                  onClick={onCreateRoom}
                  className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 text-white font-sans font-semibold text-[15px] py-3.5 px-8 rounded-full transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer outline-none relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  <span>Create Free Room</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                {!showInput ? (
                  <button
                    onClick={() => setShowInput(true)}
                    className="w-full sm:w-auto bg-white hover:bg-neutral-50 text-[#0F172A] border border-neutral-200 hover:border-neutral-300 py-3.5 px-8 rounded-full font-sans font-semibold text-[15px] transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <span>Join with Code</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                ) : (
                  <motion.form 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    onSubmit={handleJoinSubmit}
                    className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-full w-full max-w-sm shadow-md"
                  >
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => handleChangeCode(e.target.value)}
                      placeholder="Enter 6-char code"
                      className="pl-5 pr-1 py-2 font-mono font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none w-full tracking-wider text-left uppercase text-sm"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-[#0F172A] hover:bg-neutral-800 text-white font-sans font-semibold text-[13px] px-5 py-2.5 rounded-full whitespace-nowrap transition-colors cursor-pointer"
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
                    className="mt-4 flex items-center gap-2 text-sm text-red-600 font-medium"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Core Features minimal tags */}
              <div className="mt-8 pt-8 border-t border-neutral-200/50 flex flex-wrap gap-x-6 gap-y-3">
                {[
                  { label: "P2P Speeds", desc: "No proxy throttles" },
                  { label: "No Session Logs", desc: "Completely untrusted" },
                  { label: "Secured", desc: "AES room keys" }
                ].map((tag) => (
                  <div key={tag.label} className="flex flex-col">
                    <span className="text-xs font-sans font-bold text-neutral-800 leading-none mb-1">{tag.label}</span>
                    <span className="text-[10px] text-[#64748B] leading-none">{tag.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Mockup Column */}
            <div className="lg:col-span-6 relative w-full flex items-center justify-center">
              {/* Decorative behind glow element */}
              <div className="absolute w-[24rem] h-[24rem] -z-10 bg-blue-400/10 rounded-full blur-[80px]" />

              <div className="relative w-full max-w-[500px] h-[440px] flex items-center justify-center">
                {/* 1. Sleek Laptop Frame (Left back) */}
                <motion.div
                  initial={{ opacity: 0, x: -30, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute left-2 top-8 w-[270px] bg-white border border-neutral-200/80 rounded-2xl shadow-xl p-3 z-10"
                >
                  {/* Laptop upper bar */}
                  <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-neutral-200" />
                    <span className="w-2 h-2 rounded-full bg-neutral-200" />
                    <span className="w-2 h-2 rounded-full bg-neutral-200" />
                    <div className="ml-auto flex items-center gap-1 bg-blue-50 text-[9px] text-[#2563EB] font-bold px-1.5 py-0.5 rounded">
                      <Laptop className="w-2.5 h-2.5" />
                      <span>macOS</span>
                    </div>
                  </div>

                  {/* Mock Upload Queue */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-neutral-50 rounded-lg p-2 flex items-center gap-2 border border-black/[0.02]">
                      <div className="p-1 rounded bg-blue-100 text-[#2563EB]">
                        <Archive className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#0F172A] truncate">project_final.zip</p>
                        <div className="h-1 bg-neutral-200 rounded-full overflow-hidden mt-1 w-24">
                          <motion.div 
                            animate={{ width: ["0%", "100%", "100%", "0%"] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="h-full bg-blue-600 rounded-full"
                          />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold font-mono text-[#64748B]">12MB</span>
                    </div>

                    <div className="bg-neutral-50 rounded-lg p-2 flex items-center gap-2 border border-black/[0.02]">
                      <div className="p-1 rounded bg-emerald-100 text-emerald-600">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#0F172A] truncate">hero_mockup.png</p>
                        <p className="text-[9px] text-neutral-400">Ready to transfer</p>
                      </div>
                      <span className="text-[9px] text-emerald-600 font-bold font-sans">Done</span>
                    </div>
                  </div>
                </motion.div>

                {/* 2. Path Animation Graphic Connecting Devices */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <svg className="w-full h-full" viewBox="0 0 540 440" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Dashed linking line */}
                    <path 
                      d="M 230 180 Q 280 140 350 220" 
                      stroke="#3B82F6" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                      className="opacity-40"
                    />
                    
                    {/* Floating Pulse Dot */}
                    <motion.circle 
                      r="4" 
                      fill="#2563EB"
                      animate={{
                        cx: [230, 260, 290, 320, 350],
                        cy: [180, 160, 155, 180, 220],
                        opacity: [0, 1, 1, 1, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                      }}
                    />
                  </svg>
                </div>

                {/* 3. iPhone Mobile Frame (Right front) */}
                <motion.div
                  initial={{ opacity: 0, x: 30, y: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute right-4 top-24 w-[160px] bg-white border-2 border-neutral-900 rounded-[30px] shadow-2xl p-2.5 z-30 overflow-hidden"
                >
                  {/* Dynamic Island Ear-speaker Mock */}
                  <div className="mx-auto w-12 h-3.5 bg-neutral-900 rounded-full mb-3 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-900/40 mr-4" />
                  </div>

                  {/* Mobile screen details */}
                  <div className="text-left">
                    <span className="text-[8px] font-mono font-bold text-neutral-400 block uppercase mb-1">ROOM ID</span>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">68A7F2</span>
                      <span className="text-[8px] text-[#64748B] font-sans">4 Joined</span>
                    </div>

                    {/* Pending incoming transfer card */}
                    <div className="bg-[#111111] text-white rounded-xl p-2 flex flex-col gap-1.5 border border-white/5 shadow-md">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                        <span className="text-[8px] font-bold font-sans tracking-wide text-[#E2E8F0]">Incoming sync...</span>
                      </div>
                      <div className="bg-white/[0.07] p-1 rounded-lg flex items-center gap-1.5">
                        <div className="p-0.5 rounded bg-amber-500/10 text-amber-400">
                          <Archive className="w-3 h-3" />
                        </div>
                        <span className="text-[7.5px] text-neutral-300 font-mono font-bold truncate">project_final.zip</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 4. Floating File Cards (Extra high tier aesthetic) */}
                {/* Floating card 1: photo.jpg */}
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [2, 1, 2] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute left-[34%] top-0 bg-white border border-neutral-100 rounded-xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5 z-40 transform -rotate-2 select-none pointer-events-none"
                >
                  <div className="p-1 rounded bg-[#F8FAFC] text-orange-500">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-neutral-800 leading-none block">vacation.mp4</span>
                    <span className="text-[8px] text-neutral-400 leading-none">24 MB</span>
                  </div>
                </motion.div>

                {/* Floating card 2: report.pdf */}
                <motion.div
                  animate={{ y: [0, 8, 0], rotate: [-1, 1, -1] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                  className="absolute right-[12%] bottom-16 bg-white border border-neutral-100 rounded-xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5 z-40 transform rotate-1 select-none pointer-events-none"
                >
                  <div className="p-1 rounded bg-[#F8FAFC] text-red-500">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-neutral-800 leading-none block">Q3_report.pdf</span>
                    <span className="text-[8px] text-neutral-400 leading-none">1.2 MB</span>
                  </div>
                </motion.div>

                {/* 5. Centralized Statistics Panel Overlapping (Floating) */}
                <motion.div
                  style={{ x: "-50%", y: "-50%" }}
                  animate={{ scale: [1, 1.01, 1] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="absolute left-1/2 top-[55%] z-50 bg-white/80 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-3.5 shadow-lg max-w-[200px] text-left"
                >
                  <p className="text-[9px] text-[#64748B] font-sans font-bold tracking-wider uppercase mb-1">Tunnel Telemetry</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">Active Users</span>
                      <span className="font-bold text-[#0F172A] font-mono">4 Online</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">Docs Shared</span>
                      <span className="font-bold text-[#2563EB] font-mono">12 Assets</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-sans">Used Limit</span>
                      <span className="font-bold text-[#059669] font-mono">1.8 / 10 GB</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="border-y border-neutral-200 bg-neutral-50/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-display font-extrabold uppercase tracking-widest text-[#64748B] mb-8">
            Empowering Modern File Workflows Worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { 
                value: `${(filesShared / 1000000).toFixed(2)}M+`, 
                label: 'Files Transferred',
                icon: CloudLightning,
                color: 'text-blue-600'
              },
              { 
                value: `${(roomsCreated / 1000).toFixed(1)}K+`, 
                label: 'Secure Rooms Booted',
                icon: Share2,
                color: 'text-indigo-600'
              },
              { 
                value: '99.99%', 
                label: 'Node Uptime',
                icon: ShieldCheck,
                color: 'text-emerald-600'
              },
              { 
                value: '< 0.2s', 
                label: 'Instant Sync Delay',
                icon: Zap,
                color: 'text-[#EA580C]'
              }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-lg bg-white shadow-sm border border-neutral-100 flex items-center justify-center ${stat.color} mb-3`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-2xl sm:text-3xl font-display font-black text-[#0F172A] tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs text-[#64748B] font-sans mt-1.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Dashboard Preview Section */}
      <section className="py-20 md:py-28 bg-[#FFFFFF] border-b border-neutral-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-14 text-center">
            <span className="px-3 py-1 bg-blue-50 text-[#2563EB] text-[11px] font-display font-extrabold rounded-full tracking-wider uppercase">
              Actual Product Walkthrough
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0F172A] tracking-tight mt-4">
              Real-time dashboards. No installation required.
            </h2>
            <p className="text-[#64748B] font-sans text-sm md:text-base mt-2 max-w-xl mx-auto">
              Get an accurate preview of the intuitive, elegant web panel generated instantly whenever a direct target room is booted.
            </p>
          </div>

          {/* High Fidelity Screen Preview Interface */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto bg-white border border-neutral-200 shadow-2xl rounded-3xl overflow-hidden text-left"
          >
            {/* Window Controls Decorator */}
            <div className="bg-[#F8FAFC] border-b border-neutral-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-neutral-400 font-sans ml-4 select-none">68share_dashboard_v2</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm text-xs font-mono font-bold text-[#2563EB]">
                <Clock className="w-3.5 h-3.5" />
                <span>Timer expires in 59:45 (Default)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Details Panel */}
              <div className="lg:col-span-8 p-6 md:p-8 border-r border-neutral-200">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-[#0F172A]">Project Delivery Asset Tunnel</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">Created by orange.ismail.nub@gmail.com</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-neutral-400">ROOM KEY:</span>
                    <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">68A7F2</span>
                  </div>
                </div>

                {/* Simulated Upload Drag Area */}
                <div className="border-2 border-dashed border-neutral-200 hover:border-blue-400/80 bg-neutral-50/50 rounded-2xl p-8 text-center transition-all cursor-pointer mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 text-[#2563EB]">
                    <Zap className="w-5 h-5 animate-bounce" />
                  </div>
                  <span className="font-sans font-bold text-neutral-800 text-sm block">Drag & Drop files or choose selection</span>
                  <span className="text-xs text-neutral-400 mt-1 font-sans block">Support folders, images, or large binaries up to 4MB</span>
                </div>

                {/* Shared Documents Sample Table */}
                <div>
                  <h4 className="text-xs font-display font-extrabold uppercase tracking-wider text-[#64748B] mb-3">ACTIVE FILES (2)</h4>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { name: 'pitch_deck_revision_final.pdf', size: '2.4 MB', type: 'PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
                      { name: 'assets_brand_pack.zip', size: '1.2 MB', type: 'ZIP', icon: Archive, color: 'text-blue-600', bg: 'bg-blue-50' }
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center border border-black/[0.03]`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-[13px] font-sans font-semibold text-[#0F172A] block">{item.name}</span>
                            <span className="text-[10px] font-mono text-neutral-400 uppercase mt-0.5 block">{item.size} • Expires soon</span>
                          </div>
                        </div>
                        <button className="bg-[#0F172A] hover:bg-neutral-800 text-white rounded-lg p-2 transition-all cursor-pointer">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Activity Panel */}
              <div className="lg:col-span-4 p-6 md:p-8 bg-[#F8FAFC]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-display font-extrabold uppercase tracking-wider text-neutral-500">Live Workspace Activity</h4>
                </div>

                {/* Activity Feed Sim items */}
                <div className="flex flex-col gap-4 mt-4">
                  {[
                    { text: 'MacBook Pro connected code tunnel', time: 'Just now', icon: Laptop, color: 'text-blue-500 bg-blue-50' },
                    { text: 'Uploaded assets_brand_pack.zip (1.2MB)', time: '2 min ago', icon: Zap, color: 'text-emerald-500 bg-emerald-50' },
                    { text: 'iPhone 15 scanned QR to join', time: '5 min ago', icon: Smartphone, color: 'text-purple-500 bg-purple-50' },
                    { text: 'Room created with 60m session limit', time: '8 min ago', icon: ShieldCheck, color: 'text-slate-500 bg-slate-100' }
                  ].map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${act.color} flex items-center justify-center flex-shrink-0 border border-black/[0.02]`}>
                        <act.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-sans text-neutral-700 leading-tight">{act.text}</p>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5 block">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-neutral-200/60 pt-6">
                  <h5 className="text-[10px] font-display font-extrabold text-[#64748B] uppercase tracking-wider mb-2.5">Secure Invitation Code</h5>
                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-center">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=2563eb&bgcolor=ffffff&data=https://68share.io/join/68A7F2" 
                      alt="Room QR Code" 
                      className="w-24 h-24 select-none"
                    />
                  </div>
                  <span className="text-[9.5px] text-neutral-400 text-center block mt-2 font-sans">
                    Other hosts can scan this interactive laser-sharp display directly onto mobile platforms.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
