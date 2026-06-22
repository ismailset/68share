import React from 'react';
import { Clock, QrCode, RefreshCw, Lock, HardDrive, Smartphone } from 'lucide-react';

export function Features() {
  const featureList = [
    {
      title: 'Temporary Rooms',
      desc: 'Set custom expiration limits from 10 minutes up to 7 days. Files are automatically deleted when the timer ends.',
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      tag: 'Secure'
    },
    {
      title: 'QR Code Sharing',
      desc: 'Generate interactive, fully custom QR codes. Scan with any mobile camera to join rooms instantly.',
      icon: <QrCode className="w-5 h-5 text-indigo-600" />,
      tag: 'Fast Sync'
    },
    {
      title: 'Real-Time Updates',
      desc: 'Files sync globally in real-time. Uploaded items display across other screens instantly as they happen.',
      icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
      tag: 'Interactive'
    },
    {
      title: 'Session Passcodes',
      desc: 'Add password credentials to rooms. Keeps active files restricted and shields unauthorized visitors.',
      icon: <Lock className="w-5 h-5 text-red-500" />,
      tag: 'Optional protection'
    },
    {
      title: 'Dynamic File Support',
      desc: 'Sync images, docs, and folders up to 4MB in size. Built with automatic security warning indicators.',
      icon: <HardDrive className="w-5 h-5 text-amber-500" />,
      tag: 'Adaptable'
    },
    {
      title: 'Universal Access',
      desc: 'Connect effortlessly on macOS, Windows, iPhone, or Android via standard mobile web browsers.',
      icon: <Smartphone className="w-5 h-5 text-rose-500" />,
      tag: 'Universal'
    },
  ];

  return (
    <section id="features" className="py-20 bg-[#FAFAFA] relative">
      <div className="max-w-5xl mx-auto px-4 md:px-6">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-sans font-bold tracking-widest text-[#2563EB] uppercase">Supercharged Utilities</p>
          <h2 className="text-3xl md:text-4xl lg:text-[44px] font-serif font-bold text-[#111111] mt-3 tracking-wide">
            Designed for Instant Transfers
          </h2>
          <p className="text-sm md:text-base text-[#666666] mt-4 leading-[1.75] font-sans">
            Minimal setup, maximum capability. Every feature is tuned to transfer files between screens and people without friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-neutral-200/50 hover:border-black/10 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-black/5 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  {feat.icon}
                </div>
                
                <h3 className="font-sans font-semibold text-[#111111] text-base leading-snug tracking-wide">
                  {feat.title}
                </h3>
                
                <p className="font-sans text-xs md:text-sm text-[#666666] mt-2.5 leading-[1.75]">
                  {feat.desc}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-semibold bg-neutral-50 border border-black/5 px-2.5 py-0.5 rounded">
                  {feat.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
