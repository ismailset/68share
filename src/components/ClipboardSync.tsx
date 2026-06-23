import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clipboard, Check, Trash2, History, ExternalLink, Code, Copy, 
  ChevronDown, ChevronUp, AlertCircle, Terminal, FileText, Send, RefreshCw, Undo2
} from 'lucide-react';
import { Room, ClipboardEntry } from '../types';
import { getDeviceName } from '../lib/storage';
import { useToast } from './Toast';

interface ClipboardSyncProps {
  room: Room;
  onUpdateRoom: (updated: Room) => Promise<void>;
}

export function ClipboardSync({ room, onUpdateRoom }: ClipboardSyncProps) {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 350)}px`;
    }
  }, [inputText]);

  // Handle syncing to room
  const handleSync = async () => {
    if (!inputText.trim()) {
      toast('Please enter some text or paste copied content to sync.', 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      const now = new Date();
      const currentDevice = getDeviceName();
      
      const newEntry: ClipboardEntry = {
        id: crypto.randomUUID(),
        text: inputText,
        timestamp: now.toISOString(),
        sender: currentDevice,
      };

      // Ensure the history holds at most 20 entries
      const currentHistory = room.clipboardHistory || [];
      const updatedHistory = [newEntry, ...currentHistory].slice(0, 20);

      const updatedRoom: Room = {
        ...room,
        clipboardText: inputText,
        clipboardHistory: updatedHistory,
        activity: [
          {
            id: crypto.randomUUID(),
            timestamp: now.toISOString(),
            type: 'clipboard',
            details: `${currentDevice} synced clipboard content.`,
          },
          ...(room.activity || []),
        ],
      };

      await onUpdateRoom(updatedRoom);
      toast('Clipboard content synced across all devices!', 'success');
      setInputText('');
    } catch (err: any) {
      console.error('Failed to sync clipboard:', err);
      toast('Could not sync clipboard. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Paste from native/system clipboard
  const handlePasteFromSystem = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        toast('Clipboard paste is restricted by your browser. Please paste manually.', 'warning');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        toast('Successfully pasted text from system clipboard!', 'success');
      } else {
        toast('Nothing readable found in your system clipboard.', 'info');
      }
    } catch (err) {
      console.warn('System clipboard read blocked:', err);
      toast('Unable to access system clipboard. Please paste manually (Ctrl+V or Cmd+V).', 'warning');
    }
  };

  // Copy current active text to system clipboard
  const handleCopyToSystem = (text: string, label: string = 'Content copied to system clipboard!') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast(label, 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Restore history entry as active text
  const handleRestore = async (entry: ClipboardEntry) => {
    try {
      const now = new Date();
      const currentDevice = getDeviceName();

      const newEntry: ClipboardEntry = {
        id: crypto.randomUUID(),
        text: entry.text,
        timestamp: now.toISOString(),
        sender: currentDevice,
      };

      const currentHistory = room.clipboardHistory || [];
      const updatedHistory = [newEntry, ...currentHistory.filter(h => h.id !== entry.id)].slice(0, 20);

      const updatedRoom: Room = {
        ...room,
        clipboardText: entry.text,
        clipboardHistory: updatedHistory,
        activity: [
          {
            id: crypto.randomUUID(),
            timestamp: now.toISOString(),
            type: 'clipboard',
            details: `${currentDevice} restored clipboard content from history.`,
          },
          ...(room.activity || []),
        ],
      };

      await onUpdateRoom(updatedRoom);
      toast('Restored selected entry back to active clipboard!', 'success');
    } catch (err) {
      console.error('Failed to restore entry:', err);
      toast('Failed to restore entry.', 'error');
    }
  };

  // Delete a history entry
  const handleDeleteEntry = async (id: string) => {
    try {
      const now = new Date();
      const currentHistory = room.clipboardHistory || [];
      const updatedHistory = currentHistory.filter((entry) => entry.id !== id);
      
      // Determine what the new active text is. If we delete the active text, default to the next one
      const currentActiveText = room.clipboardText;
      const entryToDelete = currentHistory.find(e => e.id === id);
      let newActiveText = currentActiveText;

      if (entryToDelete && currentActiveText === entryToDelete.text) {
        newActiveText = updatedHistory.length > 0 ? updatedHistory[0].text : '';
      }

      const updatedRoom: Room = {
        ...room,
        clipboardText: newActiveText,
        clipboardHistory: updatedHistory,
      };

      await onUpdateRoom(updatedRoom);
      toast('Clipboard item deleted from history.', 'info');
    } catch (err) {
      console.error('Failed to delete history item:', err);
      toast('Failed to delete item.', 'error');
    }
  };

  // Code language and structural detector
  const detectLanguage = (text: string): { isCode: boolean; language: string; formatted: string } => {
    const trimmed = text.trim();
    
    // Check if it's JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return { isCode: true, language: 'json', formatted: JSON.stringify(parsed, null, 2) };
      } catch (e) {}
    }

    // Checking JS / TS
    if (
      trimmed.includes('import ') ||
      trimmed.includes('export ') ||
      trimmed.includes('const ') ||
      trimmed.includes('let ') ||
      trimmed.includes('function ') ||
      trimmed.includes('console.log') ||
      trimmed.includes('=>')
    ) {
      return { isCode: true, language: trimmed.includes('tsx') || trimmed.includes('interface ') ? 'typescript' : 'javascript', formatted: text };
    }

    // Checking Python
    if (
      trimmed.includes('def ') ||
      trimmed.includes('elif ') ||
      trimmed.includes('import os') ||
      trimmed.includes('print(') ||
      (trimmed.includes('import ') && trimmed.includes('as '))
    ) {
      return { isCode: true, language: 'python', formatted: text };
    }

    // Checking HTML
    if (trimmed.includes('<html>') || trimmed.includes('</div>') || trimmed.includes('class=') || trimmed.includes('id=')) {
      if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return { isCode: true, language: 'html', formatted: text };
      }
    }

    // Checking CSS
    if (trimmed.includes('{') && trimmed.includes('}') && (trimmed.includes('color:') || trimmed.includes('margin:') || trimmed.includes('padding:'))) {
      return { isCode: true, language: 'css', formatted: text };
    }

    // Checking Bash
    if (
      trimmed.startsWith('npm ') ||
      trimmed.startsWith('npx ') ||
      trimmed.startsWith('git ') ||
      trimmed.startsWith('cd ') ||
      trimmed.startsWith('mkdir ') ||
      trimmed.startsWith('sudo ') ||
      trimmed.startsWith('./')
    ) {
      return { isCode: true, language: 'bash', formatted: text };
    }

    return { isCode: false, language: '', formatted: text };
  };

  // URL link detector
  const detectUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const activeClipboardText = room.clipboardText || '';
  const detectedCode = detectLanguage(activeClipboardText);
  const detectedLinks = detectUrls(activeClipboardText);

  // Extract hostname for clickable card
  const getDomainName = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.hostname.replace('www.', '');
    } catch (e) {
      return urlString;
    }
  };

  return (
    <div className="flex flex-col gap-6" id="clipboard-container">
      {/* Primary Input Card */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-sm text-left relative overflow-hidden">
        {/* Decorative subtle background icon */}
        <div className="absolute right-6 top-6 text-neutral-50/40 select-none pointer-events-none">
          <Clipboard className="w-24 h-24 stroke-[1.5]" />
        </div>

        <div className="relative z-10">
          <h2 className="text-lg font-sans font-extrabold text-neutral-900 flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-[#2563EB]" />
            <span>Clipboard Sync Tunnel</span>
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            Instantly synchronize links, text snippets, and code across other screens and devices.
          </p>
        </div>

        {/* Text Input Wrapper */}
        <div className="mt-5 relative z-10">
          <div className="relative border border-neutral-200 focus-within:border-neutral-400 focus-within:shadow-xs transition-all rounded-2xl bg-neutral-50/20 overflow-hidden">
            <textarea
              ref={textareaRef}
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste text, links, code, notes, passwords, commands, or anything else..."
              className="w-full bg-transparent px-4 py-3.5 font-sans text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none resize-none"
              style={{ minHeight: '120px' }}
            />
            
            {/* Length / Info Bar */}
            <div className="px-4 py-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-sans text-neutral-400 bg-neutral-50/50">
              <span className="font-medium font-mono">{inputText.length} characters</span>
              {inputText.length > 5000 && (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Heavy snippet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Command Buttons */}
        <div className="mt-4 flex flex-wrap gap-2.5 relative z-10 justify-between items-center">
          <button
            type="button"
            onClick={handlePasteFromSystem}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-sans font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5 text-neutral-400" />
            <span>Paste from Clipboard</span>
          </button>

          <button
            type="button"
            disabled={isSyncing || !inputText.trim()}
            onClick={handleSync}
            className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-sans font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Sync Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Sync Display */}
      <AnimatePresence mode="wait">
        {activeClipboardText ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4"
          >
            {/* Header / Meta */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-sans font-extrabold text-neutral-800 tracking-wide uppercase">Active Tunneled Content</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyToSystem(activeClipboardText)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-sans font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Main Visual Render Area */}
            <div className="bg-[#FAFBFD] border border-neutral-150 rounded-2xl p-4 overflow-x-auto">
              {detectedCode.isCode ? (
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2 border-b border-neutral-100 pb-1">
                    <span className="flex items-center gap-1">
                      {detectedCode.language === 'bash' ? <Terminal className="w-3 h-3 text-indigo-600" /> : <Code className="w-3 h-3 text-indigo-600" />}
                      {detectedCode.language} code block
                    </span>
                    <span>Syntax highlighted format</span>
                  </div>
                  <pre className="font-mono text-xs text-neutral-800 whitespace-pre leading-[1.6]">
                    <code>{detectedCode.formatted}</code>
                  </pre>
                </div>
              ) : (
                <p className="font-sans text-sm text-neutral-800 whitespace-pre-wrap leading-[1.75]">
                  {activeClipboardText}
                </p>
              )}
            </div>

            {/* Clickable URL Previews */}
            {detectedLinks.length > 0 && (
              <div className="mt-2 flex flex-col gap-3">
                <span className="text-[10px] font-sans font-extrabold text-neutral-400 tracking-wider uppercase">Detected Clickable Links</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detectedLinks.map((link, idx) => {
                    const domain = getDomainName(link);
                    return (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl border border-neutral-150 hover:border-blue-200 bg-white hover:bg-blue-50/10 flex items-center justify-between gap-3 group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Use Google Favicon Service */}
                          <img
                            src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`}
                            alt="link logo"
                            className="w-8 h-8 rounded-lg shrink-0 border border-neutral-100 p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="text-left min-w-0">
                            <h4 className="text-[11px] font-sans font-extrabold text-neutral-400 uppercase tracking-wider">
                              {domain}
                            </h4>
                            <p className="text-xs font-sans font-semibold text-neutral-800 truncate mt-0.5 group-hover:text-[#2563EB] transition-colors">
                              {link}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#2563EB] shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sync Timestamp Footer */}
            {room.clipboardHistory && room.clipboardHistory.length > 0 && (
              <div className="text-[10px] font-sans font-semibold text-neutral-400 text-right mt-1">
                Last synchronized by <span className="font-bold text-neutral-600">{room.clipboardHistory[0].sender}</span> at{' '}
                {new Date(room.clipboardHistory[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-14 text-center rounded-3xl bg-neutral-50/50 border border-dashed border-neutral-200/80 p-6 flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
              <Clipboard className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="font-sans font-extrabold text-neutral-700 text-sm">Nothing shared yet</h4>
            <p className="font-sans text-xs text-neutral-500 mt-1 max-w-[310px] mx-auto leading-relaxed">
              Paste or type text above and sync it to instantly mirror it on your phone, tablet, or another colleague's monitor.
            </p>
            <button
              onClick={handlePasteFromSystem}
              className="mt-4 px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-xs font-sans font-semibold text-neutral-700 border border-neutral-200 hover:border-neutral-300 transition-colors shadow-xs"
            >
              Paste from System Clipboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible History Section */}
      {room.clipboardHistory && room.clipboardHistory.length > 0 && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-sm text-left">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="w-full flex items-center justify-between text-sm font-sans font-extrabold text-neutral-800 tracking-wider uppercase cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              <span>Clipboard History ({room.clipboardHistory.length})</span>
            </div>
            {isHistoryExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          <AnimatePresence>
            {isHistoryExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {room.clipboardHistory.map((entry) => {
                    const isCurrentActive = entry.text === activeClipboardText;
                    return (
                      <div
                        key={entry.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                          isCurrentActive 
                            ? 'border-blue-200 bg-blue-50/5' 
                            : 'border-neutral-150 hover:border-neutral-250 bg-white'
                        }`}
                      >
                        {/* Entry Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-sans font-bold text-neutral-700 truncate max-w-[120px]" title={entry.sender}>
                              {entry.sender}
                            </span>
                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                            <span className="text-[10px] font-sans font-semibold text-neutral-400 uppercase">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            {isCurrentActive && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-[9px] font-mono font-bold uppercase rounded-md text-[#2563EB] border border-blue-100">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyToSystem(entry.text, 'Selected history item copied!')}
                              className="p-1.5 rounded-lg border border-neutral-150 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                              title="Copy item content"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRestore(entry)}
                              className="p-1.5 rounded-lg border border-neutral-150 hover:bg-neutral-50 text-neutral-500 hover:text-[#2563EB] transition-colors cursor-pointer"
                              title="Restore to active clipboard"
                              disabled={isCurrentActive}
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1.5 rounded-lg border border-neutral-150 hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete from history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="bg-neutral-50/50 border border-neutral-100 p-2.5 rounded-xl font-sans text-xs text-neutral-600 whitespace-pre-wrap max-h-24 overflow-y-auto leading-[1.6]">
                          {entry.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
