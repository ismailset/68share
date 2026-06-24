import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Clipboard, Check, Users, Clock, UploadCloud, File, Download, 
  ShieldAlert, ArrowLeft, Lock, AlertTriangle, RefreshCw, FileText, Image as ImageIcon, Film, Archive,
  Laptop, Smartphone, Tablet, Monitor, Eye, X, Loader2
} from 'lucide-react';
import { Room, SharedFile, ActivityItem } from '../types';
import { 
  dbGetRoom, dbUpdateRoom, dbSubscribeRoom, dbUploadFileToRoom, dbTriggerDownload, dbGetFileData,
  formatBytes, getQrCodeUrl, getDeviceName, dbJoinRoomPresence, dbLeaveRoomPresence
} from '../lib/storage';
import { hashPassword } from '../lib/crypto';
import { AbuseProtection } from '../lib/errorMonitor';
import { useToast } from './Toast';
import { ClipboardSync } from './ClipboardSync';

interface RoomDashboardProps {
  key?: string;
  roomCode: string;
  onLeave: () => void;
}

export function RoomDashboard({ roomCode, onLeave }: RoomDashboardProps) {
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'clipboard'>('files');
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showHeaderQr, setShowHeaderQr] = useState(false);
  const [qrColorCode, setQrColorCode] = useState('2563eb'); // Brand blue default
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Real-time Upload Progress, cancellation and retry states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);
  const cancelUploadRef = useRef<{ cancel?: () => void }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const lastKnownClipboardTextRef = useRef<string | undefined>(undefined);
  const hasInitializedTabRef = useRef(false);
  const sessionIdRef = useRef(crypto.randomUUID());

  // File Preview capability state
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const isPreviewable = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    const textExts = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'csv', 'xml', 'ini', 'yaml', 'yml'];
    return imageExts.includes(ext) || textExts.includes(ext);
  };

  const handlePreviewFile = async (file: SharedFile) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewContent(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
      
      if (isImg) {
        if (file.isStorage && file.dataUrl) {
          setPreviewContent(file.dataUrl);
        } else {
          let base64Data: string | null = null;
          if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE_CHUNKED:')) {
            const fileId = file.dataUrl.substring(18);
            base64Data = await dbGetFileData(fileId, true, file.chunkCount);
          } else if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE:')) {
            const fileId = file.dataUrl.substring(10);
            base64Data = await dbGetFileData(fileId);
          } else if (file.isChunked) {
            base64Data = await dbGetFileData(file.id, true, file.chunkCount);
          } else {
            base64Data = await dbGetFileData(file.id);
          }

          if (base64Data) {
            setPreviewContent(base64Data);
          } else {
            throw new Error("Unable to retrieve image content");
          }
        }
      } else {
        // Text file
        let textContent = '';
        if (file.isStorage && file.dataUrl) {
          const res = await fetch(file.dataUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch text content: ${res.statusText}`);
          }
          textContent = await res.text();
        } else {
          let base64Data: string | null = null;
          if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE_CHUNKED:')) {
            const fileId = file.dataUrl.substring(18);
            base64Data = await dbGetFileData(fileId, true, file.chunkCount);
          } else if (file.dataUrl && file.dataUrl.startsWith('FIRESTORE:')) {
            const fileId = file.dataUrl.substring(10);
            base64Data = await dbGetFileData(fileId);
          } else if (file.isChunked) {
            base64Data = await dbGetFileData(file.id, true, file.chunkCount);
          } else {
            base64Data = await dbGetFileData(file.id);
          }

          if (base64Data) {
            if (base64Data.startsWith('data:')) {
              const parts = base64Data.split(',');
              if (parts.length >= 2) {
                const isBase64 = parts[0].includes('base64');
                if (isBase64) {
                  const binaryString = atob(parts[1]);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  textContent = new TextDecoder('utf-8').decode(bytes);
                } else {
                  textContent = decodeURIComponent(parts[1]);
                }
              } else {
                textContent = base64Data;
              }
            } else {
              textContent = base64Data;
            }
          } else {
            throw new Error("Unable to retrieve text content");
          }
        }
        setPreviewContent(textContent);
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      setPreviewError(err?.message || 'Failed to assemble preview contents.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Synchronize initial active tab with room focus
  useEffect(() => {
    if (room && room.defaultTab && !hasInitializedTabRef.current) {
      setActiveTab(room.defaultTab);
      hasInitializedTabRef.current = true;
    }
  }, [room]);

  // Subscribe to real-time room updates in Firestore
  useEffect(() => {
    const uppercaseCode = roomCode.trim().toUpperCase();
    
    const unsubscribe = dbSubscribeRoom(uppercaseCode, (active) => {
      if (!active) {
        toast('This room has expired or been closed.', 'warning');
        onLeave();
        return;
      }

      // Live real-time Clipboard update notification
      if (
        active.clipboardText !== undefined &&
        active.clipboardText !== null &&
        active.clipboardText !== lastKnownClipboardTextRef.current
      ) {
        if (lastKnownClipboardTextRef.current !== undefined && active.clipboardText !== '') {
          const latestHistory = active.clipboardHistory && active.clipboardHistory[0];
          if (latestHistory && latestHistory.sender !== getDeviceName()) {
            toast(`Clipboard updated by ${latestHistory.sender}`, 'info');
          }
        }
        lastKnownClipboardTextRef.current = active.clipboardText;
      } else if (!active.clipboardText) {
        lastKnownClipboardTextRef.current = '';
      }

      setRoom(active);
    });

    // Handle initial join increments & password shield checks
    dbGetRoom(uppercaseCode).then(async (active) => {
      if (active) {
        if (active.passwordHash || active.password) {
          setIsAuthenticated(false);
        } else {
          // No password, join room presence atomically
          await dbJoinRoomPresence(uppercaseCode, sessionIdRef.current, getDeviceName());
        }
      }
    }).catch(err => {
      console.error("Error fetching room on mount:", err);
    });

    return () => {
      unsubscribe();
      // Remove current session atomically upon exiting
      dbLeaveRoomPresence(uppercaseCode, sessionIdRef.current).catch(e => console.error(e));
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
        toast('This room has reached its duration limits and has expired.', 'warning', 5000);
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

  // Handler for password lock with secure hashing and brute force protection
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const uppercaseCode = roomCode.trim().toUpperCase();

    if (AbuseProtection.isPasswordLocked(uppercaseCode)) {
      const remaining = AbuseProtection.getPasswordLockRemaining(uppercaseCode);
      setPasswordError(`Too many failed attempts. Locked. Please try again in ${remaining}s.`);
      toast(`Verification is locked for ${remaining}s.`, 'error');
      return;
    }

    let isValid = false;
    if (room.passwordHash && room.passwordSalt) {
      const hashed = await hashPassword(passwordInput, room.passwordSalt);
      isValid = hashed === room.passwordHash;
    } else if (room.password) {
      isValid = passwordInput === room.password;
    }

    if (isValid) {
      AbuseProtection.resetPasswordAttempts(uppercaseCode);
      setIsAuthenticated(true);
      toast('Shield room unlocked successfully!', 'success');
      
      // Update room presence atomically
      await dbJoinRoomPresence(uppercaseCode, sessionIdRef.current, getDeviceName());
    } else {
      const result = AbuseProtection.recordFailedPasswordAttempt(uppercaseCode);
      if (result.isLocked) {
        setPasswordError('Too many failed attempts. Access locked for 30 seconds.');
        toast('Access locked due to too many failed attempts.', 'error');
      } else {
        const attemptsLeft = 5 - result.attempts;
        setPasswordError(`Invalid password. ${attemptsLeft} attempts remaining.`);
        toast(`Invalid password! ${attemptsLeft} attempts remaining.`, 'error');
      }
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    toast('Room share link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    toast(`Room code ${roomCode} copied!`, 'success');
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
      await processFileUpload(files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileUpload(files);
    }
  };

  const processFileUpload = async (fileList: FileList | File[]) => {
    if (!room) return;

    // Rate Limiting Check
    if (!AbuseProtection.checkUploadRateLimit()) {
      setUploadError('Upload frequency too high. Please wait a few seconds before trying again.');
      toast('Upload frequency limit exceeded.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setFailedFile(null);
    
    const filesArray = Array.from(fileList);
    const maxCapacity = 25 * 1024 * 1024; // 25MB

    // Increment upload stats for feedback trigger
    const currentUploads = Number(localStorage.getItem('68share_upload_count') || '0') + filesArray.length;
    localStorage.setItem('68share_upload_count', String(currentUploads));

    for (const file of filesArray) {
      if (file.size > maxCapacity) {
        setUploadError(`File "${file.name}" is too large (${formatBytes(file.size)}). Max limit is 25MB.`);
        toast(`"${file.name}" exceeds 25MB limit.`, 'error');
        continue;
      }

      setUploadingFileName(file.name);
      setUploadProgress(0);

      try {
        const parsed = await dbUploadFileToRoom(
          room.code, 
          file, 
          (progress) => {
            setUploadProgress(Math.round(progress));
          },
          cancelUploadRef.current
        );
        if (parsed) {
          toast(`Successfully uploaded & shared "${file.name}"!`, 'success');
        }
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'storage/canceled') {
          toast(`Upload of "${file.name}" was cancelled.`, 'warning');
        } else {
          setFailedFile(file);
          setUploadError(`Failed to upload "${file.name}": ${err?.message || 'Transfer error'}`);
          toast(`Failed to upload "${file.name}".`, 'error');
        }
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
    setUploadingFileName(null);
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Helper to get stylized file icons and themes
  const getFileStyleAndIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return {
        bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        icon: <ImageIcon className="w-5 h-5" />,
        label: 'Image'
      };
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'pdf', 'csv', 'xlsx', 'pptx'].includes(ext)) {
      return {
        bg: 'bg-rose-50 text-rose-600 border border-rose-100',
        icon: <FileText className="w-5 h-5" />,
        label: 'Document'
      };
    } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return {
        bg: 'bg-amber-50 text-amber-600 border border-amber-100',
        icon: <Archive className="w-5 h-5" />,
        label: 'Archive'
      };
    } else if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return {
        bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
        icon: <Film className="w-5 h-5" />,
        label: 'Media'
      };
    }
    return {
      bg: 'bg-neutral-50 text-neutral-600 border border-neutral-200/60',
      icon: <File className="w-5 h-5" />,
      label: 'File'
    };
  };

  if (!room) {
    return (
      <div className="py-24 text-center text-neutral-500 font-sans flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="font-sans font-medium text-neutral-600">Rebounding connection & loading Room {roomCode}...</span>
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
          className="bg-white border border-neutral-200/80 shadow-2xl rounded-3xl p-6 sm:p-8"
        >
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          
          <h2 className="text-xl font-sans font-bold text-neutral-900 text-center tracking-wide">Enter Room Password</h2>
          <p className="text-xs text-neutral-500 text-center mt-1 font-sans">Room {roomCode} requires verification.</p>

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
              Unlock Dashboard
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

  const getDeviceIcon = (name: string) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('macbook') || lowercase.includes('dell') || lowercase.includes('thinkpad') || lowercase.includes('laptop')) {
      return <Laptop className="w-4 h-4 text-[#2563EB]" />;
    }
    if (lowercase.includes('iphone') || lowercase.includes('pixel') || lowercase.includes('galaxy') || lowercase.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-[#2563EB]" />;
    }
    if (lowercase.includes('ipad') || lowercase.includes('tablet')) {
      return <Tablet className="w-4 h-4 text-[#2563EB]" />;
    }
    return <Monitor className="w-4 h-4 text-[#2563EB]" />;
  };

  const formatJoinedTime = (isoString: string) => {
    try {
      const joined = new Date(isoString).getTime();
      const diff = Date.now() - joined;
      if (diff < 60000) return 'Just joined';
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Joined';
    }
  };

  return (
    <section className="py-8 max-w-5xl mx-auto px-4 md:px-6 relative z-10 font-sans">
      
      {/* Top dashboard control header bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border-b border-neutral-205/60 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onLeave}
            className="p-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight leading-tight">{room.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[10px] font-sans font-bold tracking-wider text-neutral-400 uppercase">Room Code</span>
              <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{room.code}</span>
              
              <button 
                onClick={handleCopyCode}
                className="text-xs text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1 font-sans cursor-pointer transition-colors"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>

              <span className="text-neutral-300">|</span>

              <button 
                onClick={() => setShowHeaderQr(!showHeaderQr)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 font-sans cursor-pointer transition-colors"
                aria-expanded={showHeaderQr}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showHeaderQr ? 'Hide QR' : 'Share QR Code'}</span>
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
                  className="absolute left-0 mt-3 z-50 bg-white border border-neutral-200 shadow-xl rounded-2xl p-5 w-[300px] text-left"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span className="font-sans font-semibold text-neutral-800 text-sm">Join via QR Code</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    {/* Interactive Color Settings */}
                    <div className="flex items-center gap-1.5 mb-3 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100">
                      <span className="text-[9px] font-sans font-bold text-neutral-400 tracking-wider uppercase mr-1">Color:</span>
                      {[
                        { name: 'Blue', hex: '2563eb', bg: 'bg-blue-600' },
                        { name: 'Dark', hex: '111111', bg: 'bg-neutral-900' },
                        { name: 'Emerald', hex: '059669', bg: 'bg-emerald-600' },
                        { name: 'Amber', hex: 'ea580c', bg: 'bg-amber-600' },
                      ].map((swatch) => (
                        <button
                          key={swatch.name}
                          onClick={() => setQrColorCode(swatch.hex)}
                          className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all ${swatch.bg} ${
                            qrColorCode === swatch.hex ? 'ring-2 ring-indigo-500 scale-110' : 'border border-white hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-2 rounded-xl border border-neutral-200 flex items-center justify-center mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Join Room QR Code" 
                        className="w-32 h-32 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Actions */}
                    <div className="w-full flex gap-2 border-t border-neutral-100 pt-2.5">
                      <button
                        onClick={() => {
                          const customUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`;
                          window.open(customUrl, '_blank');
                        }}
                        className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 py-1.5 rounded-xl font-sans text-xs font-semibold select-none cursor-pointer transition-colors text-center shadow-xs flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save Image</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getShareUrl());
                          setCopiedQrLink(true);
                          setTimeout(() => setCopiedQrLink(false), 2000);
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white py-1.5 rounded-xl font-sans text-xs font-semibold select-none cursor-pointer transition-colors text-center shadow-xs flex items-center justify-center gap-1"
                      >
                        {copiedQrLink ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                        <span>{copiedQrLink ? 'Copied' : 'Copy link'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl p-3 shrink-0 self-start md:self-auto flex-wrap sm:flex-nowrap shadow-xs md:max-w-md">
          
          <div className="flex items-center gap-2 border-r border-neutral-200 pr-4 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-sans font-semibold text-neutral-600">
              {room.activeUsers?.length || room.usersOnline || 1} Screen{(room.activeUsers?.length || room.usersOnline || 1) > 1 ? 's' : ''} Connected
            </span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200/50 rounded-xl">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-mono text-xs font-bold text-amber-700">
              Expires: {timeLeft}
            </span>
          </div>

        </div>
      </div>

      {/* Main split dashboard area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Columns: Upload area & file listing or Clipboard */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tab Selector */}
          <div className="flex bg-[#F3F4F6] p-1 rounded-2xl border border-neutral-200/50 gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 font-sans font-bold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'files'
                  ? 'bg-white text-[#2563EB] shadow-xs border border-black/5 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <File className="w-4 h-4 text-neutral-400" />
              <span>Files Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('clipboard')}
              className={`flex-1 font-sans font-bold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'clipboard'
                  ? 'bg-white text-[#2563EB] shadow-xs border border-black/5 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Clipboard className="w-4 h-4 text-neutral-400" />
              <span>Clipboard Sharing</span>
            </button>
          </div>

          {activeTab === 'files' ? (
            <>
              {/* Active Upload Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerSelectFile}
                className={`cursor-pointer group relative p-8 md:p-10 border-2 border-dashed rounded-3xl flex flex-col items-center text-center transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/10' 
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-150 flex items-center justify-center text-neutral-500 group-hover:scale-105 transition-transform duration-300">
                  <UploadCloud className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>

                <h3 className="font-sans font-bold text-neutral-800 mt-4 text-[15px] tracking-tight">
                  {isUploading ? 'Uploading file...' : 'Drag & Drop files here'}
                </h3>
                
                <p className="font-sans text-xs text-neutral-500 mt-1 max-w-[320px]">
                  {isUploading 
                    ? 'Uploading file segments and syncing across all connected screens...' 
                    : 'or click to browse local files. Supports images, archives, datasets, videos and documents up to 25MB.'}
                </p>

                {uploadProgress !== null && isUploading && (
                  <div className="w-full max-w-sm bg-indigo-50 border border-indigo-100/60 rounded-2xl p-3.5 mt-4 text-left shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-sans font-bold text-indigo-950 truncate max-w-[200px]" title={uploadingFileName || ''}>
                        Uploading: {uploadingFileName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-indigo-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200/80 rounded-full h-1.5 overflow-hidden animate-pulse">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cancelUploadRef.current?.cancel) {
                          cancelUploadRef.current.cancel();
                        }
                      }}
                      className="text-[10px] text-red-600 hover:text-red-700 font-sans font-extrabold uppercase mt-2.5 inline-block cursor-pointer hover:underline"
                    >
                      Cancel Upload
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="flex flex-col items-center gap-2 mt-3">
                    <p className="text-red-600 text-xs font-sans font-semibold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {uploadError}
                    </p>
                    {failedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          processFileUpload([failedFile]);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-sans font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3.5 animate-spin" />
                        <span>Retry Uploading "{failedFile.name}"</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Shared Files Grid Layout */}
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-sm text-left">
                <h2 className="text-sm font-sans font-extrabold text-neutral-800 tracking-wider uppercase mb-5 flex items-center gap-2">
                  <File className="w-4 h-4 text-[#2563EB]" />
                  <span>Shared Files Catalog ({room.files.length})</span>
                </h2>

                {room.files.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl bg-neutral-50/50 border border-neutral-100">
                    <File className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <h4 className="font-sans font-semibold text-sm text-neutral-700">No files uploaded yet</h4>
                    <p className="font-sans text-xs text-neutral-500 mt-1 max-w-[285px] mx-auto">
                      Files dragged and uploaded to this room will immediately pop up for download on all other connected devices.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {room.files.map((file) => {
                        const visualTheme = getFileStyleAndIcon(file.name);
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -10 }}
                            key={file.id}
                            className="p-4 bg-white border border-neutral-150 hover:border-neutral-300 rounded-2xl flex flex-col justify-between gap-4 transition-all hover:shadow-xs group"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${visualTheme.bg}`}>
                                {visualTheme.icon}
                              </div>
                              
                              <div className="min-w-0 text-left flex-grow">
                                <h4 className="text-xs font-sans font-bold text-neutral-800 truncate pr-0.5 group-hover:text-indigo-650 transition-colors" title={file.name}>
                                  {file.name}
                                </h4>
                                <p className="text-[10px] font-sans font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                                  {visualTheme.label}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-100 pt-3 relative z-10">
                              <div className="text-[10px] font-sans text-neutral-500 flex flex-col">
                                <span className="font-bold text-neutral-700 font-mono">{formatBytes(file.size)}</span>
                                <span className="text-neutral-400 mt-0.5 truncate max-w-[130px]" title={`Uploaded by ${file.uploader}`}>
                                  By: {file.uploader}
                                </span>
                              </div>

                              <div className="flex gap-2 items-center">
                                {isPreviewable(file.name) && (
                                  <button
                                    id={`preview-btn-${file.id}`}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      toast(`Assembling preview for "${file.name}"...`, 'success', 1500);
                                      await handlePreviewFile(file);
                                    }}
                                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 w-8 h-8 rounded-xl flex items-center justify-center transition-all select-none shadow-3xs hover:scale-105 cursor-pointer border border-neutral-200/50"
                                    title="Preview File"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}

                                <button 
                                  id={`download-btn-${file.id}`}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    toast(`Downloading "${file.name}"...`, 'success', 2000);
                                    
                                    // Update local stats for feedback trigger
                                    const currentDownloads = Number(localStorage.getItem('68share_download_count') || '0') + 1;
                                    localStorage.setItem('68share_download_count', String(currentDownloads));

                                    await dbTriggerDownload(file, roomCode);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-750 text-white w-8 h-8 rounded-xl flex items-center justify-center transition-all select-none shadow-xs hover:scale-105 cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </>
          ) : (
            <ClipboardSync room={room} onUpdateRoom={dbUpdateRoom} />
          )}

        </div>

        {/* Right Columns: Share utilities & Activity logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Share widgets */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-sm text-left relative overflow-hidden">
            <h3 className="font-sans font-bold text-neutral-400 text-[10px] tracking-wider uppercase mb-3.5">Room Accessories</h3>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCopyLink}
                className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl p-2.5 px-3 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
              >
                <div className="truncate pr-2">
                  <span className="text-[9px] font-sans text-neutral-400 uppercase block leading-none mb-1 font-bold">Copy Room Join URL</span>
                  <span className="text-xs text-neutral-700 font-mono truncate block max-w-[180px]">{getShareUrl()}</span>
                </div>
                <div className="shrink-0 p-1.5 bg-white rounded-lg border border-neutral-200 shadow-3xs group-hover:border-neutral-300 transition-colors">
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-neutral-500" />}
                </div>
              </button>

              {/* QR expander */}
              <div className="border border-neutral-150 rounded-xl p-3 bg-white shadow-3xs">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full font-sans text-xs font-semibold text-neutral-600 hover:text-neutral-850 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>{showQr ? 'Hide Large QR Code' : 'Display QR Code'}</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">{showQr ? 'Close' : 'View'}</span>
                </button>

                {showQr && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col items-center gap-3 mt-3 border-t border-neutral-100 pt-3"
                  >
                    <div className="bg-white p-2 rounded-xl border border-neutral-150 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColorCode}&bgcolor=ffffff&data=${encodeURIComponent(getShareUrl())}`} 
                        alt="Room QR Code" 
                        className="w-24 h-24 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 font-sans text-center max-w-[180px] leading-tight">
                      Scan this code with an external device to connect to this room space instantly.
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Connected Screens (Real-time active users indicator) */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">Connected Screens</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/30 text-[9.5px] font-sans font-extrabold text-emerald-600 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                <span>{room.activeUsers?.length || room.usersOnline || 1} Live</span>
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {room.activeUsers && room.activeUsers.length > 0 ? (
                room.activeUsers.map((u, idx) => {
                  const isMe = u.deviceName === getDeviceName();
                  return (
                    <div 
                      key={u.id || idx}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isMe 
                          ? 'bg-blue-50/10 border-blue-100' 
                          : 'bg-neutral-50/25 border-neutral-150 hover:border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isMe ? 'bg-blue-100/40 text-blue-600' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {getDeviceIcon(u.deviceName)}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-sans truncate block max-w-[120px] ${
                              isMe ? 'font-bold text-blue-800' : 'font-semibold text-neutral-700'
                            }`} title={u.deviceName}>
                              {u.deviceName}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-[8px] font-sans font-extrabold uppercase rounded text-blue-700 border border-blue-200/40 shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[9.5px] font-sans font-semibold text-neutral-400 block mt-0.5">
                            {formatJoinedTime(u.joinedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" />
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl border bg-blue-50/10 border-blue-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-100/40 text-blue-600">
                      {getDeviceIcon(getDeviceName())}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-sans font-bold text-blue-800 truncate block max-w-[120px]">
                          {getDeviceName()}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-[8px] font-sans font-extrabold uppercase rounded text-blue-700 border border-blue-200/40 shrink-0">
                          You
                        </span>
                      </div>
                      <span className="text-[9.5px] font-sans font-semibold text-neutral-400 block mt-0.5">
                        Just joined
                      </span>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" />
                </div>
              )}
            </div>
          </div>

          {/* Activity Logs (Professional activity card) */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between flex-grow min-h-[340px]">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">Activity & Events Log</span>
                <span className="text-[9px] font-mono font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded uppercase border border-neutral-200">Real-time</span>
              </div>

              <div id="activity-console" className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {room.activity.map((act) => (
                  <div key={act.id} className="text-left leading-relaxed font-sans text-xs flex gap-2">
                    <span className="text-neutral-400 font-mono text-[10px] shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`font-medium ${
                      act.type === 'upload' ? 'text-indigo-600' 
                      : act.type === 'download' ? 'text-blue-600'
                      : act.type === 'leave' ? 'text-rose-650'
                      : 'text-neutral-700'
                    }`}>
                      {act.details}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-3 mt-4 text-center font-sans text-[10px] text-neutral-400 font-medium">
              Listening for events details and device syncs...
            </div>
          </div>

        </div>

      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 md:p-6"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-[28px] border border-neutral-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getFileStyleAndIcon(previewFile.name).bg}`}>
                    {getFileStyleAndIcon(previewFile.name).icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-sans font-bold text-neutral-800 truncate pr-2" title={previewFile.name}>
                      {previewFile.name}
                    </h3>
                    <p className="text-[10px] font-sans font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                      {formatBytes(previewFile.size)} • Uploaded by {previewFile.uploader}
                    </p>
                  </div>
                </div>
                <button
                  id="close-preview-x"
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:shadow-xs transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-grow overflow-auto p-6 flex flex-col items-center justify-center min-h-[250px] bg-neutral-50/20">
                {previewLoading && (
                  <div className="flex flex-col items-center gap-3 text-neutral-500 py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <span className="text-xs font-medium font-sans animate-pulse">Assembling secure preview payload...</span>
                  </div>
                )}

                {previewError && (
                  <div className="flex flex-col items-center gap-3 text-neutral-500 max-w-md text-center py-12">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                    <p className="text-sm font-sans font-bold text-neutral-700">Preview Generation Error</p>
                    <p className="text-xs font-sans text-neutral-500">{previewError}</p>
                  </div>
                )}

                {!previewLoading && !previewError && previewContent && (
                  <div className="w-full h-full flex items-center justify-center">
                    {['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(previewFile.name.split('.').pop()?.toLowerCase() || '') ? (
                      <img
                        src={previewContent}
                        alt={previewFile.name}
                        className="max-h-[55vh] md:max-h-[62vh] object-contain rounded-xl border border-neutral-200/60 shadow-xs bg-white p-1.5 select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full max-h-[55vh] md:max-h-[62vh] bg-white rounded-xl border border-neutral-200/80 shadow-3xs overflow-auto">
                        <pre className="font-mono text-[11px] leading-relaxed text-neutral-800 p-5 whitespace-pre-wrap select-text text-left">
                          {previewContent}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <span className="text-[10px] font-sans text-neutral-400 font-medium">
                  Verification Preview Mode • Files are encrypted in transit
                </span>
                
                <div className="flex items-center gap-2.5">
                  <button
                    id="close-preview-btn"
                    onClick={() => setPreviewFile(null)}
                    className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-sans font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-3xs active:scale-[0.99]"
                  >
                    Close View
                  </button>
                  <button
                    id="download-preview-btn"
                    onClick={async () => {
                      toast(`Downloading "${previewFile.name}"...`, 'success', 2000);
                      const currentDownloads = Number(localStorage.getItem('68share_download_count') || '0') + 1;
                      localStorage.setItem('68share_download_count', String(currentDownloads));
                      await dbTriggerDownload(previewFile, roomCode);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-sans font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] hover:scale-[1.01]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
