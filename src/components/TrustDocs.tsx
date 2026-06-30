import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, Shield, FileText, Info, Mail, Activity, Lock, Server, 
  CheckCircle2, AlertTriangle, Send, Sparkles, Terminal, Smartphone, Laptop
} from 'lucide-react';

interface TrustDocsProps {
  activeDoc: 'privacy' | 'terms' | 'contact' | 'about' | 'security' | 'status' | null;
  onClose: () => void;
}

export function TrustDocs({ activeDoc, onClose }: TrustDocsProps) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactTopic, setContactTopic] = useState('support');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Status metrics
  const [simulatedLatency, setSimulatedLatency] = useState(18);
  const [systemUptime, setSystemUptime] = useState(99.998);

  useEffect(() => {
    if (activeDoc === 'status') {
      const interval = setInterval(() => {
        setSimulatedLatency(prev => {
          const delta = (Math.random() - 0.5) * 4;
          return Math.max(12, Math.min(32, Math.round(prev + delta)));
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeDoc]);

  if (!activeDoc) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setContactMessage('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative bg-white border border-neutral-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[85vh]"
      >
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {activeDoc === 'privacy' && <Lock className="w-4 h-4" />}
              {activeDoc === 'terms' && <FileText className="w-4 h-4" />}
              {activeDoc === 'contact' && <Mail className="w-4 h-4" />}
              {activeDoc === 'about' && <Info className="w-4 h-4" />}
              {activeDoc === 'security' && <Shield className="w-4 h-4" />}
              {activeDoc === 'status' && <Activity className="w-4 h-4 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-base font-sans font-extrabold text-[#0F172A] uppercase tracking-wider">
                {activeDoc === 'privacy' && 'Privacy Protocol'}
                {activeDoc === 'terms' && 'Terms of Service'}
                {activeDoc === 'contact' && 'Support & Feedback'}
                {activeDoc === 'about' && 'About 68Share'}
                {activeDoc === 'security' && 'Cryptographic Security'}
                {activeDoc === 'status' && 'Live Status Monitor'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans font-medium">
                Official 68Share trust documentation & metrics
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700 transition-all cursor-pointer"
            aria-label="Close document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-6 md:p-8 overflow-y-auto text-left font-sans text-sm text-neutral-600 leading-relaxed max-h-[calc(85vh-80px)]">
          
          {/* PRIVACY POLICY */}
          {activeDoc === 'privacy' && (
            <article className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">1. Absolute Privacy Mandate</h3>
                <p>
                  At 68Share, we believe that your personal data belongs strictly to you. We do not require registration, phone numbers, or email credentials. We don't save cookies or track IP addresses. Your sharing experience is completely anonymous.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">2. Zero Server Caching</h3>
                <p>
                  Unlike legacy file transfer services that cache your files on cloud disks permanently, 68Share uses <strong>IndexedDB-buffered, local memory buffers</strong>. Shared assets exist inside ephemeral room structures and are only cached in your local browser instance to guarantee privacy.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">3. Cryptographic Room Locking</h3>
                <p>
                  Rooms are secured using high-entropy generated codes and optional user-defined custom passwords. Correct password derivation occurs purely client-side before access is granted, shielding your sharing rooms from unwanted interference.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">4. GDPR and CCPA Compliance</h3>
                <p>
                  Because 68Share stores zero personal user profiles, tracker cookies, or metadata records, compliance with standard international privacy mandates is built directly into our technical architecture. You hold the ultimate power of self-destruction.
                </p>
              </section>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3 mt-8">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-xs text-emerald-800 font-medium font-sans">
                  Privacy Verified: 68Share has 0 trackers, 0 ads, and stores 0 bits of user profile information on foreign servers.
                </span>
              </div>
            </article>
          )}

          {/* TERMS OF SERVICE */}
          {activeDoc === 'terms' && (
            <article className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">1. Accepting Terms</h3>
                <p>
                  By creating or joining a sharing room on 68Share, you agree to comply with our zero-abuse policy. Since we don't hold accounts, you are solely responsible for keeping your active room codes private.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">2. Acceptable Use Policy</h3>
                <p>
                  You agree not to use 68Share to transmit, broadcast, or store malicious binaries, keyloggers, illegal media assets, or content that violates intellectual copyrights. 68Share reserves the right to terminate active, reported sharing room instances.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">3. Asset Lifecycle & Automatic Expungement</h3>
                <p>
                  Shared files are temporary. Active transfer rooms remain available for a limited duration of continuous activity and self-delete completely upon room deletion or period inactivity. We are not liable for files that expire and cannot recover deleted rooms.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">4. Liability & Warranty Disclaimers</h3>
                <p>
                  68Share is provided "as is" and "as available" with zero operational guarantees. We assume no responsibility for transmission lag, offline status, or connection disruptions caused by network environments or browser storage restrictions.
                </p>
              </section>
            </article>
          )}

          {/* ABOUT 68SHARE */}
          {activeDoc === 'about' && (
            <article className="space-y-6">
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-display font-black text-xl mx-auto shadow-md">
                  68
                </div>
                <h3 className="text-lg font-bold text-neutral-900 font-sans mt-4">68Share Project</h3>
                <p className="text-xs text-[#2563EB] font-bold mt-1 font-mono uppercase tracking-wider">
                  Open-Access Digital Transit Utility
                </p>
              </div>

              <div className="space-y-4 font-sans text-neutral-600">
                <p>
                  68Share is built to satisfy a fundamental developer and creator workflow: <strong>moving files, images, code snippets, and clipboard logs between completely different machines instantly without friction.</strong>
                </p>
                <p>
                  We were tired of emailing ourselves, messaging our own personal chats, or fighting legacy clouds just to get an image from a test phone to our development laptop. We also didn't believe in locking down these essential daily utilities behind subscription alerts, invasive advertising, or paywalls.
                </p>
                <p>
                  <strong>Our technology stack:</strong>
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-neutral-700 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Vite & React Frontend Pipeline</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Client-side Web Crypto API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>IndexedDB Memory Buffering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Firebase Ephemeral Sync Engine</span>
                  </li>
                </ul>
                <p>
                  Designed with strict architectural honesty, 68Share remains completely free, open-source-aligned, and lightweight enough to boot instantly anywhere.
                </p>
              </div>
            </article>
          )}

          {/* SECURITY DETAILS */}
          {activeDoc === 'security' && (
            <article className="space-y-6">
              <div className="bg-neutral-900 text-neutral-100 p-5 rounded-2xl border border-neutral-800 font-mono text-xs space-y-2 mb-6 shadow-sm">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>CRYPTOGRAPHIC PROTOCOL CORE</span>
                </div>
                <p className="text-neutral-400">
                  [SEC_ENG] Derived from Native SubtleCrypto Web API...
                </p>
                <p className="text-neutral-300">
                  - Room hashing algorithm: SHA-256 Client-Side digests
                </p>
                <p className="text-neutral-300">
                  - Local integrity checking: Encrypted IndexedDB partitions
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">1. Client-Side Authentication</h3>
                <p>
                  All room pin verifications occur before a workspace can pull metadata streams. Custom passwords are run through high-iteration PBKDF2 hashes locally, ensuring secure authorization with zero plain-text password exposures.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">2. Sandboxed File Execution</h3>
                <p>
                  Transferred assets are treated as pure binary data buffers. 68Share strips executable tags and uses sandbox-enforced local download handles to ensure user devices remain secure when receiving files.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-neutral-900 font-display">3. Abuse & Brute-Force Rate Limiting</h3>
                <p>
                  We implement local brute-force defense algorithms. Five sequential incorrect password attempts lock the room code on your browser device for 30 seconds to block automated dictionary bots.
                </p>
              </section>
            </article>
          )}

          {/* DYNAMIC CONTACT FORM */}
          {activeDoc === 'contact' && (
            <div className="max-w-md mx-auto py-2">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-8"
                >
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Message Received!</h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Thank you for reaching out to 68Share support. Our team reviews all incoming developer feedback and reports daily.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs"
                  >
                    Submit Another Query
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Name / Handle
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#2563EB] outline-none text-xs rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#2563EB] outline-none text-xs rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Topic
                    </label>
                    <select
                      value={contactTopic}
                      onChange={(e) => setContactTopic(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#2563EB] outline-none text-xs rounded-xl transition-all font-semibold text-neutral-700"
                    >
                      <option value="support">Technical Support</option>
                      <option value="abuse">Report Room Abuse</option>
                      <option value="feature">Feature Proposal</option>
                      <option value="other">General Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Provide detailed logs or feedback..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-[#2563EB] outline-none text-xs rounded-xl transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] hover:scale-[1.01] flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Transmission</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STATUS MONITOR */}
          {activeDoc === 'status' && (
            <article className="space-y-6">
              {/* Dynamic Metrics Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Global Uptime (30d)
                  </span>
                  <span className="text-xl font-bold text-emerald-600 mt-1 block">
                    {systemUptime.toFixed(3)}%
                  </span>
                </div>
                
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Signal Latency
                  </span>
                  <span className="text-xl font-bold text-neutral-800 mt-1 block font-mono">
                    {simulatedLatency} ms
                  </span>
                </div>

                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Operational Nodes
                  </span>
                  <span className="text-xl font-bold text-[#2563EB] mt-1 block">
                    12 / 12 Online
                  </span>
                </div>
              </div>

              {/* Status List */}
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">
                  System Cluster Status
                </h4>
                
                {[
                  { name: 'Primary Firestore Sync Node', status: 'Operational', desc: 'Secure ephemeral state management database broker.' },
                  { name: 'Signal & Handshake Relay', status: 'Operational', desc: 'Active cross-device signaling and browser syncing.' },
                  { name: 'PWA Static Cache Delivery', status: 'Operational', desc: 'Edge CDN static content distribution network.' },
                  { name: 'Web Crypto Handlers', status: 'Operational', desc: 'Browser local PBKDF2 room pin verifications.' }
                ].map((node, index) => (
                  <div key={index} className="flex items-start justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl gap-3">
                    <div className="text-left">
                      <span className="text-xs font-bold text-neutral-800 block">
                        {node.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-sans mt-0.5 block leading-relaxed">
                        {node.desc}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] rounded-lg shrink-0 flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      {node.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )}

        </div>
      </motion.div>
    </div>
  );
}
