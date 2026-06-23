import React, { useState } from 'react';
import { CreateRoom } from './CreateRoom';
import { Menu, X, Home, Sparkles, Shield, DollarSign, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWA } from './PWAManager';

interface NavbarProps {
  onCreateRoom: () => void;
  onNavigateHome: () => void;
}

export function Navbar({ onCreateRoom, onNavigateHome }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    onNavigateHome();
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  return (
    <nav className="sticky top-6 z-50 max-w-5xl mx-auto px-4 md:px-6 w-full flex flex-col gap-2">
      <div id="navbar-pill" className="bg-white/80 backdrop-blur-xl border border-neutral-200/60 rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between shadow-lg shadow-neutral-100/40">
        
        {/* Logo Direction - Option 1: Rounded square with 68 inside */}
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-3 group text-left cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center font-mono font-bold text-white text-sm tracking-tighter shadow-md shadow-blue-500/10 transition-transform group-hover:scale-105 duration-300">
            68
          </div>
          <span className="font-sans font-semibold text-[#111111] tracking-tight text-[17px]">
            68Share
          </span>
        </button>

        {/* Floating Menu Link Items */}
        <div className="hidden md:flex items-center gap-1.5 bg-neutral-50 p-1 rounded-full border border-black/5">
          <button
            onClick={() => handleScrollTo('hero')}
            className="px-4 py-1.5 rounded-full text-[13.5px] font-medium text-[#666666] hover:text-[#111111] hover:bg-white transition-all cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => handleScrollTo('how-it-works')}
            className="px-4 py-1.5 rounded-full text-[13.5px] font-medium text-[#666666] hover:text-[#111111] hover:bg-white transition-all cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleScrollTo('security')}
            className="px-4 py-1.5 rounded-full text-[13.5px] font-medium text-[#666666] hover:text-[#111111] hover:bg-white transition-all cursor-pointer"
          >
            Security
          </button>
          <button
            onClick={() => handleScrollTo('pricing')}
            className="px-4 py-1.5 rounded-full text-[13.5px] font-medium text-[#666666] hover:text-[#111111] hover:bg-white transition-all cursor-pointer"
          >
            Pricing
          </button>
        </div>

        {/* Action button grouping */}
        <div className="flex items-center gap-2">
          {isInstallable && !isInstalled && (
            <button
              onClick={installApp}
              className="hidden sm:flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 px-4 py-2 rounded-full font-sans text-xs md:text-[13px] font-bold tracking-tight cursor-pointer shadow-xs transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Install App</span>
            </button>
          )}

          {/* CTA Button */}
          <button
            onClick={onCreateRoom}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-full font-sans text-xs md:text-[13.5px] font-semibold tracking-tight cursor-pointer shadow-sm transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            Create Room
          </button>

          {/* Hamburger Menu Toggle for Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full border border-black/5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer transition-all flex items-center justify-center active:scale-90"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-[#111111]" /> : <Menu className="w-4 h-4 text-[#111111]" />}
          </button>
        </div>
      </div>

      {/* Advanced Animated Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border border-neutral-200/60 rounded-3xl p-4 shadow-xl shadow-neutral-200/50 flex flex-col gap-1.5 mt-1"
          >
            {[
              { label: "Home", target: "hero", icon: Home },
              { label: "Features", target: "how-it-works", icon: Sparkles },
              { label: "Security", target: "security", icon: Shield },
              { label: "Pricing", target: "pricing", icon: DollarSign },
            ].map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                onClick={() => handleScrollTo(item.target)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14px] font-semibold text-[#666666] hover:text-[#111111] hover:bg-neutral-50 transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-100/80 flex items-center justify-center text-[#2563EB]">
                  <item.icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </motion.button>
            ))}

            {isInstallable && !isInstalled && (
              <motion.button
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.2 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  installApp();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 transition-all cursor-pointer text-left mt-1"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Download className="w-4 h-4" />
                </div>
                <span>Install 68Share</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
