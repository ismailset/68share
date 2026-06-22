import React from 'react';
import { ShieldAlert, Trash2, KeyRound, CheckCircle } from 'lucide-react';

export function Security() {
  const points = [
    {
      title: 'Private Access Only',
      desc: 'No discovery indexes. Only users possessing your unique passcode or code link can access your active files.',
      icon: <KeyRound className="w-5 h-5 text-indigo-400" />
    },
    {
      title: 'Automatic Expiration',
      desc: 'No persistent shadow copies. All shared documents are immediately, permanently deleted from client caches upon limit expiry.',
      icon: <Trash2 className="w-5 h-5 text-red-400" />
    },
    {
      title: 'Direct Client Sandbox',
      desc: 'Operates directly in your browser. Restricting data leak channels to unsecured third-party servers by keeping transfers local.',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />
    }
  ];

  return (
    <section id="security" className="py-20 bg-neutral-950 text-white relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#2563EB]/40 to-transparent" />
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Left panel: Descriptive text */}
          <div className="md:col-span-5 text-left">
            <p className="text-xs font-mono font-bold tracking-widest text-[#2563EB] uppercase">Defensive Architecture</p>
            <h2 className="text-3xl md:text-4xl lg:text-[44px] font-serif font-bold mt-3 tracking-wide text-white leading-tight">
              Your Privacy Is <br />Our Default.
            </h2>
            <p className="text-sm text-neutral-400 mt-5 leading-[1.75] font-sans">
              Unlike permanent cloud databases that index your documents forever, 68Share is built as a highly transient connection bridge. 
            </p>
            <p className="text-sm text-neutral-400 mt-3 leading-[1.75] font-sans">
              We do not track file content, store logs, or retain active files beyond the timer limit. It is the simple, honest alternative for moving bytes.
            </p>

            <div className="mt-8 flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl max-w-sm">
              <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-xs font-sans text-neutral-300">
                Rooms automatically decompose after chosen limits. Securely test sharing with confidence!
              </p>
            </div>
          </div>

          {/* Right panel: Security checklist tiles */}
          <div className="md:col-span-7 flex flex-col gap-5">
            {points.map((pt, idx) => (
              <div 
                key={idx} 
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 flex gap-4 items-start hover:border-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700/50">
                  {pt.icon}
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-white text-base tracking-wide mb-1">
                    {pt.title}
                  </h3>
                  <p className="font-sans text-[13px] md:text-sm text-neutral-400 leading-[1.75]">
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
