import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Clock, Lock, KeyRound, ShieldAlert, ArrowRight, Clipboard, Check, QrCode, Sparkles } from 'lucide-react';
import { RoomDuration, Room } from '../types';
import { dbCreateRoom, getQrCodeUrl } from '../lib/storage';
import { useToast } from './Toast';

interface CreateRoomProps {
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

export function CreateRoom({ onClose, onRoomCreated }: CreateRoomProps) {
  const { toast } = useToast();
  const [roomName, setRoomName] = useState('');
  const [duration, setDuration] = useState<RoomDuration>('1hr');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'form' | 'success'>('form');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const durationOptions: { value: RoomDuration; label: string; desc: string }[] = [
    { value: '10min', label: '10 Minutes', desc: 'Ideal for brief single-sent handoffs' },
    { value: '1hr', label: '1 Hour', desc: 'Standard for shared collaborative meetings' },
    { value: '24hr', label: '24 Hours', desc: 'Great for day-long temporary tasks' },
    { value: '7days', label: '7 Days', desc: 'Perfect for prolonged ongoing syncs' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPassword = usePassword && password.trim() ? password.trim() : null;
    setIsGenerating(true);
    try {
      const room = await dbCreateRoom(roomName, duration, finalPassword);
      setCreatedRoom(room);
      setStage('success');
    } catch (err: any) {
      console.error('Room Creation Error details:', err);
      toast(`Failed to generate sharing room: ${err?.message || err || 'Unknown Error'}`, 'error', 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const getShareUrl = () => {
    if (!createdRoom) return '';
    return `${window.location.origin}${window.location.pathname}?room=${createdRoom.code}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    toast('Room invitation link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!createdRoom) return;
    navigator.clipboard.writeText(createdRoom.code);
    setCopiedCode(true);
    toast(`Room code ${createdRoom.code} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleEnterDashboard = () => {
    if (createdRoom) {
      onRoomCreated(createdRoom);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white border border-neutral-200/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {stage === 'form' ? (
          <form onSubmit={handleGenerate}>
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-100 rounded-full text-[10px] font-mono font-bold uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Room Setup</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-neutral-900 tracking-wide">Create File-Sharing Room</h2>
              <p className="text-xs text-neutral-500 font-sans mt-1">Configure your temporary sharing tunnel details</p>
            </div>

            {/* Inputs list */}
            <div className="mt-6 flex flex-col gap-5">
              
              {/* Room Name */}
              <div>
                <label className="block text-xs font-sans font-semibold text-neutral-900 tracking-wide uppercase mb-1.5">
                  Room Name <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Layout Assets Sync"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 font-sans text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                />
              </div>

              {/* Durations cards selection */}
              <div>
                <label className="block text-xs font-sans font-semibold text-neutral-900 tracking-wide uppercase mb-2">
                  Room Duration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {durationOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`text-left p-3 rounded-xl border flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                        duration === opt.value
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-sans font-semibold text-[13px]">{opt.label}</span>
                        <Clock className={`w-3.5 h-3.5 ${duration === opt.value ? 'text-white/80' : 'text-neutral-400'}`} />
                      </div>
                      <span className={`text-[10px] leading-tight font-sans mt-2 ${duration === opt.value ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secure Password (Optional) */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2 items-center">
                    <Lock className="w-4 h-4 text-neutral-600" />
                    <span className="text-xs font-sans font-semibold text-neutral-900 tracking-wide uppercase">Password Protection</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="w-4 h-4 text-neutral-950 border-neutral-300 rounded focus:ring-neutral-950 cursor-pointer"
                  />
                </div>

                {usePassword && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2.5"
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter room password passcode"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 font-sans text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                      required
                    />
                  </motion.div>
                )}
              </div>

            </div>

            {/* Submit */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="w-1/3 bg-white hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 text-neutral-700 border border-black/5 rounded-xl py-3 font-sans font-semibold text-xs md:text-sm tracking-tight cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="w-2/3 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl py-3 font-sans font-semibold text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                {isGenerating ? 'Generating...' : 'Create Active Room'}
                {!isGenerating && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Success Stage */}
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-neutral-900 tracking-wide">Room Created!</h2>
              <p className="text-xs text-neutral-500 font-sans mt-1">Share credentials with colleagues or other screens</p>
            </div>

            <div className="mt-6 p-4 bg-neutral-50 border border-black/5 rounded-2xl flex flex-col gap-4">
              
              {/* Room Code block */}
              <div>
                <span className="text-[10px] font-sans font-bold text-neutral-400 tracking-wider uppercase block mb-1">ROOM CODE</span>
                <div className="flex items-center justify-between bg-white border border-black/5 px-4 py-2.5 rounded-xl">
                  <span className="font-mono text-lg font-bold text-neutral-950 tracking-wider">{createdRoom?.code}</span>
                  <button 
                    onClick={handleCopyCode}
                    className="p-1 px-2.5 rounded-lg border border-black/5 bg-neutral-50 hover:bg-neutral-100 text-xs font-sans text-neutral-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Share URL */}
              <div>
                <span className="text-[10px] font-sans font-bold text-neutral-400 tracking-wider uppercase block mb-1">SHARE LINK</span>
                <div className="flex items-center justify-between bg-white border border-black/5 px-4 py-2.5 rounded-xl">
                  <span className="font-sans text-xs text-neutral-500 truncate mr-3">{getShareUrl()}</span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-1 px-2.5 rounded-lg border border-black/5 bg-neutral-50 hover:bg-neutral-100 text-xs font-sans text-neutral-700 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code section */}
              {createdRoom && (
                <div className="flex flex-col items-center border-t border-black/5 pt-4 mt-1">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 tracking-wider uppercase block mb-3">CONVENIENT QR CODE</span>
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-sm">
                    <img 
                      src={getQrCodeUrl(getShareUrl())} 
                      alt="Room QR Code" 
                      className="w-36 h-36 border border-neutral-100 rounded-lg select-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center font-sans mt-2 max-w-[260px]">
                    Scan with any smartphone camera to connect immediately without typing code
                  </p>
                </div>
              )}

            </div>

            {/* Go Dashboard Button */}
            <div className="mt-6">
              <button
                onClick={handleEnterDashboard}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl py-3.5 font-sans font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/10 transition-colors"
              >
                Enter Room Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
