import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Star, Send, X, CheckCircle, Smile } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from './Toast';

export function FeedbackModal() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<'form' | 'success'>('form');

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [purpose, setPurpose] = useState('');
  const [workedWell, setWorkedWell] = useState('');
  const [frustrating, setFrustrating] = useState('');
  const [nextFeature, setNextFeature] = useState('');
  const [useAgain, setUseAgain] = useState<string>('yes');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or submitted feedback
    const completed = localStorage.getItem('68share_feedback_completed');
    const dismissed = localStorage.getItem('68share_feedback_dismissed');
    if (completed || dismissed) return;

    // Track active usage time in seconds
    let activeSeconds = Number(localStorage.getItem('68share_active_seconds') || '0');

    const interval = setInterval(() => {
      activeSeconds += 5;
      localStorage.setItem('68share_active_seconds', String(activeSeconds));

      // Retrieve interaction counts from localStorage
      const uploadCount = Number(localStorage.getItem('68share_upload_count') || '0');
      const downloadCount = Number(localStorage.getItem('68share_download_count') || '0');
      const clipboardCount = Number(localStorage.getItem('68share_clipboard_count') || '0');

      // Condition: Active for > 5 minutes (300 seconds) AND (uploaded >= 1 OR downloaded >= 1 OR clipboard >= 3)
      const timeThreshold = 300; // 5 minutes
      const hasInteracted = uploadCount >= 1 || downloadCount >= 1 || clipboardCount >= 3;

      if (activeSeconds >= timeThreshold && hasInteracted) {
        setIsOpen(true);
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('68share_feedback_dismissed', 'true');
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackId = crypto.randomUUID();
      const docRef = doc(db, 'feedback', feedbackId);

      await setDoc(docRef, {
        rating,
        purpose,
        workedWell,
        frustrating,
        nextFeature,
        useAgain,
        email: email.trim(),
        timestamp: new Date().toISOString()
      });

      localStorage.setItem('68share_feedback_completed', 'true');
      setStage('success');
      toast('Thank you for your valuable feedback!', 'success');
    } catch (err) {
      console.error('Failed to submit feedback to Firestore:', err);
      toast('Failed to save feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white border border-neutral-200/85 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-sans text-neutral-800 text-left"
          >
            {/* Close */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {stage === 'form' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-100 rounded-full text-[10px] font-mono font-bold uppercase mb-3">
                    <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
                    <span>Help Improve 68Share</span>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight leading-none">
                    Share Your Experience
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    You've been using 68Share for a while. We'd love your feedback to polish the platform!
                  </p>
                </div>

                {/* Rating selection (1-5) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Overall Rating (1 - 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-115 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-neutral-200 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 2 */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    What did you use 68Share for today?
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Transferring meeting assets between macbook & phone..."
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                    required
                  />
                </div>

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                      What worked well?
                    </label>
                    <textarea
                      value={workedWell}
                      onChange={(e) => setWorkedWell(e.target.value)}
                      placeholder="Speed, clean design, QR sync..."
                      rows={2}
                      className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                      What was frustrating?
                    </label>
                    <textarea
                      value={frustrating}
                      onChange={(e) => setFrustrating(e.target.value)}
                      placeholder="Any slow uploads, connection drops..."
                      rows={2}
                      className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400 resize-none"
                    />
                  </div>
                </div>

                {/* Next feature */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Which feature should be added next?
                  </label>
                  <input
                    type="text"
                    value={nextFeature}
                    onChange={(e) => setNextFeature(e.target.value)}
                    placeholder="e.g., Folder structures, persistent archives..."
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                  />
                </div>

                {/* Row: Use Again & Optional Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      Would you use 68Share again?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="useAgain"
                          value="yes"
                          checked={useAgain === 'yes'}
                          onChange={() => setUseAgain('yes')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Yes, definitely!</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="useAgain"
                          value="no"
                          checked={useAgain === 'no'}
                          onChange={() => setUseAgain('no')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Maybe not</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                      Your Email <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 border-t border-neutral-100 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="flex-1 bg-neutral-50 hover:bg-neutral-150 border border-neutral-250 py-3 rounded-xl font-semibold text-xs text-neutral-700 transition-colors cursor-pointer text-center"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:bg-neutral-300"
                  >
                    {isSubmitting ? (
                      <Smile className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? 'Sending...' : 'Submit Feedback'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-4">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
                <h3 className="text-xl font-bold text-neutral-900 font-display">Feedback Received!</h3>
                <p className="text-sm text-neutral-500 max-w-[320px]">
                  Your suggestions go directly to our planning team to guide the next 68Share feature set. Thank you!
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-4 bg-[#111111] hover:bg-neutral-800 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
