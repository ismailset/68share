import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Clipboard, Check, Users, Clock, UploadCloud, File, Download, 
  Trash2, ShieldAlert, Laptop, ArrowLeft, RefreshCw, Lock, AlertTriangle, Play 
} from 'lucide-react';
import { Room, SharedFile, ActivityItem } from '../types';
import { 
  getRoom, updateRoom, uploadFileToRoom, triggerDownload, 
  formatBytes, getQrCodeUrl, getDeviceName 
} from '../lib/storage';

interface RoomDashboardProps {
  key?: string;
  roomCode: string;
  onLeave: () => void;
}

export function RoomDashboard({ roomCode, onLeave }: RoomDashboardProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showHeaderQr, setShowHeaderQr] = useState(false);
  const [qrColorCode, setQrColorCode] = useState('2563eb'); // Brand blue default
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state & live hooks
  const fetchRoomState = () => {
    const active = getRoom(roomCode);
    if (!active) {
      // Room expired or deleted
      alert('This room has expired or does not exist.');
      onLeave();
      return;
    }
    setRoom(active);
  };

  useEffect(() => {
    fetchRoomState();

    // Check if the room requires authentication first
    const active = getRoom(roomCode);
    if (active && active.password) {
      setIsAuthenticated(false);
    }

    // Bind event listeners for real global multi-tab sync
    const handleSync = () => {
      fetchRoomState();
    };
    
    window.addEventListener('68share_rooms_changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('68share_rooms_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [roomCode]);

  // Expiration countdown loop
  useEffect(() => {
    if (!room) return;

    const calculateTime = () => {
      const expiry = new Date(room.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        alert('This room has reached its duration limits and has expired.');
        onLeave();
        return;
      }

      const hrs = Math.floor(diff / (3600 * 1000));
      const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);

      const fHrs = hrs.toString().padStart(2, '0');
      const fMins = mins.toString().padStart(2, '0');
      const fSecs = secs.toString().padStart(2, '0');

      setTimeLeft(`${fHrs}:${fMins}:${fSecs}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [room?.expiresAt]);

  // Smart Multi-User simulations to make things feel live even in a single tab
  useEffect(() => {
    if (!isAuthenticated || !room) return;

    // After 8 seconds, simulate another user joining the room
    const joinTimer = setTimeout(() => {
      setRoom(prev => {
        if (!prev) return null;
        // Verify we haven't already logged this simulation
        if (prev.activity.some(act => act.details.includes('Galaxy'))) return prev;

        const updatedActivity: ActivityItem = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type: 'join',
          details: 'Galaxy S24 #7011 connected to the room.',
        };
        const updated = {
          ...prev,
          usersOnline: prev.usersOnline + 1,
          activity: [updatedActivity, ...prev.activity],
        };
        updateRoom(updated);
        return updated;
      });
    }, 8500);

    return () => clearTimeout(joinTimer);
  }, [isAuthenticated, roomCode, room?.code]);

  // Handler for password lock
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    if (passwordInput === room.password) {
      setIsAuthenticated(true);
      
      // Log successful unlock activity
      const updated = { ...room };
      updated.activity.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'join',
        details: `${getDeviceName()} entered correct room password keycode.`,
      });
      updateRoom(updated);
    } else {
      setPasswordError('Invalid passphrase passcode. Try again!');
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!room) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!room) return;
    setIsUploading(true);
    setUploadError(null);

    // Prompt user about sizes
    const maxCapacity = 4.2 * 1024 * 1024; // 4.2MB limit for physical base64
    if (file.size > maxCapacity) {
      // Simulate file upload metadata with size warning
      const fileId = crypto.randomUUID();
      const uploader = getDeviceName();
      const fallbackFile: SharedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        uploader,
      };

      const activityItem: ActivityItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'upload',
        details: `${uploader} launched "${file.name}" (${formatBytes(file.size)}). (Bulky file simulation)`,
      };

      room.files.unshift(fallbackFile);
      room.activity.unshift(activityItem);
      updateRoom(room);
      setIsUploading(false);

      // Trigger a visual simulation of download for bulky file
      simulateMockReceiverDownload(file.name);
      return;
    }

    try {
      const parsed = await uploadFileToRoom(room.code, file);
      if (parsed) {
        // Trigger simulated action
        simulateMockReceiverDownload(file.name);
      }
    } catch (err) {
      setUploadError('Failed to parse file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const simulateMockReceiverDownload = (fileName: string) => {
    if (!room) return;
    // Simulate other connected user downloading our newly uploaded file after 5 seconds
    setTimeout(() => {
      setRoom(prev => {
        if (!prev) return null;
        const updatedActivity: ActivityItem = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type: 'download',
          details: `Galaxy S24 #7011 downloaded your file "${fileName}".`,
        };
        const updated = {
          ...prev,
          activity: [updatedActivity, ...prev.activity],
        };
        updateRoom(updated);
        return updated;
      });
    }, 5500);
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  if (!room) {
    return (
      <div className="py-20 text-center text-neutral-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-neutral-400 mb-2" />
        <span>Syncing Room {roomCode}...</span>
      </div>
    );
  }

  // Authentication shield screen
  if (!isAuthenticated) {
    return (
      <section className="py-16 px-4 max-w-md mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-neutral-200 shadow-xl rounded-3xl p-6 sm:p-8"
        >
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          
          <h2 className="text-xl font-sans font-bold text-neutral-900 text-center tracking-wide">Interactive Passkey Required</h2>
          <p className="text-xs text-neutral-500 text-center mt-1 font-sans">Room {roomCode} is password-shielded.</p>

          <form onSubmit={handleAuthSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-neutral-400 uppercase tracking-widest mb-1">Passkey Code</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter password"
                className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-neutral-400"
                required
              />
              {passwordError && <p className="text-red-600 text-xs mt-1.5 font-sans font-medium">{passwordError}</p>}
            </div>

            <button
              type="submit"
              className="bg-neutral-950 hover:bg-neutral-800 text-white w-full rounded-xl py-3 font-sans font-bold text-sm transition-colors cursor-pointer"
            >
              Unlock Terminal
            </button>
            
            <button
              type="button"
              onClick={onLeave}
              className="text-xs text-neutral-400 hover:text-neutral-600 font-sans text-center underline cursor-pointer mt-2"
            >
              Go back home
            </button>
          </form>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-10 max-w-5xl mx-auto px-4 md:px-6 relative z-10">
      
      {/* Top dashboard control header bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onLeave}
            className="p-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer shadow-sm"
            title="Leave Room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="relative">
            <h1 className="text-xl md:text-2xl font-sans font-bold text-neutral-950 tracking-wide">{room.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">ROOM CODE:</span>
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{room.code}</span>
              
              <button 
                onClick={handleCopyCode}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-sans cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>

              <span className="text-neutral-300">|</span>

              <button 
                onClick={() => setShowHeaderQr(!showHeaderQr)}
                className="text-xs text-[#2563EB] hover:text-blue-700 font-semibold flex items-center gap-1.5 font-sans cursor-pointer transition-colors"
                aria-expanded={showHeaderQr}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showHeaderQr ? 'Hide QR Code' : 'Quick QR Code'}</span>
              </button>
            </div>

            {/* Expandable Interactive QR Panel */}
            <AnimatePresence>
              {showHeaderQr && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 mt-3 z-50 bg-white border border-black/5 rounded-3xl p-5 shadow-2xl w-full sm:w-[350px] text-left"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB]">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="font-sans font-bold text-neutral-900 text-sm">Scan to Join Room</span>
                    </div>
                    <button 
                      onClick={() => setShowHeaderQr(false)}
                      className="text-neutral-400 hover:text-neutral-600 text-xs font-sans cursor-pointer bg-neutral-50 hover:bg-neutral-100 p-1 rounded-full px-2"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    {/* Interactive Color Swatches */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[10px] font-sans font-bold text-neutral-400 tracking-wider uppercase mr-1">Tweak QR:</span>
                      {[
                        { name: 'Blue', hex: '2563eb', bg: 'bg-[#2563EB]' },
                        { name: 'Dark', hex: '111111', bg: 'bg-[#111111]' },
                        { name: 'Emerald', hex: '059669', bg: 'bg-[#059669]' },
                        { name: 'Amber', hex: 'ea580c', bg: 'bg-[#EA580C]' },
                      ].map((swatch) => (
                        <button
                          key={swatch.name}
                          onClick={() => setQrColorCode(swatch.hex)}
                          className={`w-4.5 h-4.5 rounded-full border cursor-pointer transition-all ${swatch.bg} ${
                            qrColorCode === swatch.hex ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'border-neutral-200'
                          }`}
                          title={`Switch to ${swatch.name} QR`}
                        />
                      ))}
                    </div>

                    {/* QR Code Graphic Area */}
                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-md flex items-center justify-center mb-4 transition-all hover:scale-102">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Join Room QR Code" 
                        className="w-44 h-44 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="text-center mb-4">
                      <span className="font-mono text-sm font-bold text-neutral-900 bg-neutral-50 px-3 py-1 rounded border border-black/5 inline-block">
                        {room.code}
                      </span>
                      <p className="text-[11px] text-[#666666] mt-2 font-sans max-w-[280px] leading-[1.6]">
                        Point your mobile camera at this code to join immediately.
                      </p>
                    </div>

                    {/* Download & Copy links */}
                    <div className="w-full flex gap-2 border-t border-neutral-100 pt-4">
                      <button
                        onClick={() => {
                          const customUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`;
                          window.open(customUrl, '_blank');
                        }}
                        className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-black/5 py-2 px-3 rounded-xl font-sans text-xs font-semibold tracking-tight transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-center"
                      >
                        <Download className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Save Image</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getShareUrl());
                          setCopiedQrLink(true);
                          setTimeout(() => setCopiedQrLink(false), 2000);
                        }}
                        className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white py-2 px-3 rounded-xl font-sans text-xs font-semibold tracking-tight transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-center"
                      >
                        {copiedQrLink ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                        <span>{copiedQrLink ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sync panel telemetry elements */}
        <div className="flex items-center gap-3.5 bg-neutral-50 border border-neutral-200/50 rounded-2xl p-3 shrink-0 self-start md:self-auto">
          
          <div className="flex items-center gap-1.5 border-r border-neutral-200/60 pr-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold uppercase text-neutral-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>{room.usersOnline} Connected</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono text-[11.5px] font-bold text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-sm">
              EXPIRES IN: {timeLeft}
            </span>
          </div>

        </div>
      </div>

      {/* Main split dashboard area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Interactive Zone: File uploads & files catalog */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Draggable Active Upload Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerSelectFile}
            className={`cursor-pointer group relative p-8 md:p-10 border-2 border-dashed rounded-3xl flex flex-col items-center text-center transition-all ${
              isDragging 
                ? 'border-[#2563EB] bg-blue-50/20' 
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-lg'
            }`}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] border border-neutral-200 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-6 h-6 text-[#2563EB]" />
            </div>

            <h3 className="font-sans font-bold text-neutral-900 mt-4 text-[15px] tracking-wide">
              {isUploading ? 'Registering byte uploads...' : 'Drag & Drop files here'}
            </h3>
            
            <p className="font-sans text-xs text-neutral-500 mt-1 max-w-[280px]">
              {isUploading 
                ? 'Compressing file structure for room synchronized transmission...' 
                : 'or click to browse local files. Supports images, zipped logs, docs, and datasets.'}
            </p>
            
            <div className="mt-4 px-3 py-1 bg-[#FAFAFA] border border-black/5 rounded-full inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold text-[#666666] group-hover:text-neutral-600">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Max 4MB for instant base64 transfer, larger simulated</span>
            </div>

            {uploadError && (
              <p className="text-red-600 text-xs mt-3 font-sans font-semibold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                <AlertTriangle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}
          </div>

          {/* Shared Files list banner view */}
          <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-sans font-bold text-neutral-900 tracking-wide uppercase mb-4 flex items-center gap-2">
              <File className="w-4.5 h-4.5 text-[#2563EB]" />
              <span>Room Shelf Catalog ({room.files.length} Saved)</span>
            </h2>

            {room.files.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-neutral-50 border border-black/5">
                <div className="w-8 h-8 rounded-full bg-neutral-250/50 flex flex-col justify-center items-center text-neutral-400 mx-auto mb-2">
                   <File className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-sans font-semibold text-xs text-neutral-900">Room Catalog is Empty</h4>
                <p className="font-sans text-[11px] text-[#666666] mt-1">Upload a file to sync immediately with other open windows!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {room.files.map((file) => {
                    const isBulky = !file.dataUrl;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        key={file.id}
                        className="p-3 bg-[#FAFAFA] hover:bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center justify-between gap-4 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 border border-neutral-200">
                            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">{file.name.split('.').pop()?.substring(0, 4) || 'FILE'}</span>
                          </div>
                          
                          <div className="min-w-0 text-left">
                            <h4 className="text-xs font-sans font-semibold text-neutral-900 truncate pr-1" title={file.name}>
                              {file.name}
                            </h4>
                            <p className="text-[10.5px] font-mono text-neutral-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span>{formatBytes(file.size)}</span>
                              <span className="text-neutral-300">•</span>
                              <span className="text-neutral-400 truncate max-w-[120px]">{file.uploader}</span>
                              {isBulky && (
                                <>
                                  <span className="text-neutral-300">•</span>
                                  <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold border border-amber-100 shrink-0">Simulated Link</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => triggerDownload(file)}
                            className="bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                            title="Download Segment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: QR utilities & logging activities */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Share widget card */}
          <div className="bg-white border border-[#2563EB]/15 rounded-3xl p-5 shadow-sm text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-sans font-bold text-neutral-900 text-[14px] mb-3">Room Information</h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCopyLink}
                className="w-full bg-[#FAFAFA] hover:bg-neutral-100 border border-neutral-200 rounded-xl p-2.5 px-3 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block leading-none mb-1">Share Web Link</span>
                  <span className="text-xs text-neutral-800 font-sans truncate block max-w-[180px]">{getShareUrl()}</span>
                </div>
                <div className="shrink-0 p-1 bg-white rounded-md border border-neutral-200">
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-neutral-500" />}
                </div>
              </button>

              {/* QR visibility code */}
              <div className="border border-black/5 rounded-2xl p-4 bg-neutral-50/50">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full font-sans text-xs font-semibold text-neutral-800 hover:text-neutral-950 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>{showQr ? 'Hide QR Code' : 'Display Room QR'}</span>
                  </span>
                  <span>{showQr ? 'Close' : 'Expand'}</span>
                </button>

                {showQr && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col items-center gap-3.5 mt-4 border-t border-neutral-200/50 pt-4"
                  >
                    {/* Interactive Color Swatches */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-sans font-bold text-neutral-400 tracking-wider uppercase mr-1">Color:</span>
                      {[
                        { name: 'Blue', hex: '2563eb', bg: 'bg-[#2563EB]' },
                        { name: 'Dark', hex: '111111', bg: 'bg-[#111111]' },
                        { name: 'Emerald', hex: '059669', bg: 'bg-[#059669]' },
                        { name: 'Amber', hex: 'ea580c', bg: 'bg-[#EA580C]' },
                      ].map((swatch) => (
                        <button
                          key={swatch.name}
                          onClick={() => setQrColorCode(swatch.hex)}
                          className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-all ${swatch.bg} ${
                            qrColorCode === swatch.hex ? 'ring-2 ring-offset-1 ring-blue-500 scale-105' : 'border-neutral-200'
                          }`}
                          title={`Switch to ${swatch.name} QR`}
                        />
                      ))}
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Room QR Code" 
                        className="w-32 h-32 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 font-sans text-center max-w-[180px]">Scan instantly using phone camera to join.</span>
                    
                    <div className="w-full flex gap-1.5 mt-1">
                      <button
                        onClick={() => {
                          const customUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`;
                          window.open(customUrl, '_blank');
                        }}
                        className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-black/5 py-1.5 px-2 rounded-lg font-sans text-[11px] font-semibold tracking-tight transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer shadow-sm text-center"
                      >
                        <Download className="w-3 h-3 text-neutral-500" />
                        <span>Save Image</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getShareUrl());
                          setCopiedQrLink(true);
                          setTimeout(() => setCopiedQrLink(false), 2000);
                        }}
                        className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white py-1.5 px-2 rounded-lg font-sans text-[11px] font-semibold tracking-tight transition-all active:scale-98 flex items-center justify-center gap-1 cursor-pointer shadow-sm text-center"
                      >
                        {copiedQrLink ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                        <span>{copiedQrLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed terminal widget */}
          <div className="bg-neutral-950 text-white border border-neutral-900 rounded-3xl p-5 shadow flex flex-col justify-between flex-1 min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Activity Monitor</span>
                </div>
                <span className="font-mono text-[9.5px] text-neutral-600">68SHARE OS v1.0</span>
              </div>

              <div id="activity-console" className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {room.activity.map((act) => (
                  <div key={act.id} className="text-left leading-normal font-mono text-[10.5px]">
                    <span className="text-neutral-600 mr-2">[{new Date(act.timestamp).toLocaleTimeString()}]</span>
                    <span className={
                      act.type === 'upload' ? 'text-amber-400' 
                      : act.type === 'download' ? 'text-blue-400'
                      : act.type === 'leave' ? 'text-red-400'
                      : 'text-neutral-300'
                    }>
                      {act.details}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-3 mt-4 text-center font-mono text-[9px] text-neutral-600">
              Terminal live listening on events...
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
