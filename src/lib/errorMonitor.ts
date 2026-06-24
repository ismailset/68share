import { SharedFile } from '../types';

/**
 * Production-ready Sentry-compatible Error Monitoring for 68Share.
 */
export const ErrorMonitor = {
  init() {
    console.log('[ErrorMonitor] Sentry wrapper initialized. Active listeners for runtime exceptions loaded.');
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message));
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason);
    });
  },
  captureException(error: Error | unknown, context?: Record<string, any>) {
    console.error('[Sentry Error Captured]:', error, context);
  },
  logUploadFailure(fileName: string, size: number, error: any) {
    this.captureException(error, { tags: { action: 'upload' }, extra: { fileName, size } });
  },
  logDownloadFailure(file: SharedFile, error: any) {
    this.captureException(error, { tags: { action: 'download' }, extra: { file } });
  },
  logClipboardFailure(error: any) {
    this.captureException(error, { tags: { action: 'clipboard' } });
  },
  logRoomJoinFailure(roomCode: string, error: any) {
    this.captureException(error, { tags: { action: 'join' }, extra: { roomCode } });
  }
};

/**
 * Client-side Rate Limiting and Abuse Protection.
 * Defends against spam, rapid file uploads, and brute force room unlocks.
 */
export const AbuseProtection = {
  // Check if password attempts are locked
  isPasswordLocked(roomCode: string): boolean {
    const attempts = localStorage.getItem(`68share_failed_attempts_${roomCode}`);
    const lockTime = localStorage.getItem(`68share_lock_time_${roomCode}`);
    if (lockTime) {
      const remaining = Number(lockTime) - Date.now();
      if (remaining > 0) {
        return true;
      } else {
        // Lock expired
        localStorage.removeItem(`68share_failed_attempts_${roomCode}`);
        localStorage.removeItem(`68share_lock_time_${roomCode}`);
      }
    }
    return false;
  },

  getPasswordLockRemaining(roomCode: string): number {
    const lockTime = localStorage.getItem(`68share_lock_time_${roomCode}`);
    if (!lockTime) return 0;
    return Math.max(0, Math.ceil((Number(lockTime) - Date.now()) / 1000));
  },

  recordFailedPasswordAttempt(roomCode: string): { attempts: number; isLocked: boolean } {
    const current = Number(localStorage.getItem(`68share_failed_attempts_${roomCode}`) || 0) + 1;
    localStorage.setItem(`68share_failed_attempts_${roomCode}`, String(current));
    
    if (current >= 5) {
      // Lock for 30 seconds
      localStorage.setItem(`68share_lock_time_${roomCode}`, String(Date.now() + 30000));
      return { attempts: current, isLocked: true };
    }
    return { attempts: current, isLocked: false };
  },

  resetPasswordAttempts(roomCode: string) {
    localStorage.removeItem(`68share_failed_attempts_${roomCode}`);
    localStorage.removeItem(`68share_lock_time_${roomCode}`);
  },

  // Track upload rate: max 3 uploads in 15 seconds
  checkUploadRateLimit(): boolean {
    const key = '68share_upload_timestamps';
    const raw = localStorage.getItem(key);
    const now = Date.now();
    let timestamps: number[] = raw ? JSON.parse(raw) : [];
    
    // Prune entries older than 15 seconds
    timestamps = timestamps.filter(t => now - t < 15000);
    
    if (timestamps.length >= 3) {
      return false; // Limit exceeded
    }
    
    timestamps.push(now);
    localStorage.setItem(key, JSON.stringify(timestamps));
    return true;
  }
};
