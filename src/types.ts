export type RoomDuration = '10min' | '1hr' | '24hr' | '7days';

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploader: string;
  dataUrl?: string; // Base64 content for real download/preview (optional/large-file warning capped)
  isChunked?: boolean;
  chunkCount?: number;
}

export interface ClipboardEntry {
  id: string;
  text: string;
  timestamp: string;
  sender: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'join' | 'leave' | 'upload' | 'download' | 'clipboard';
  details: string;
}

export interface Room {
  code: string;
  name: string;
  duration: RoomDuration;
  expiresAt: string;
  password?: string | null;
  files: SharedFile[];
  activity: ActivityItem[];
  usersOnline: number;
  lastActiveAt?: string;
  // Clipboard Sharing fields:
  clipboardText?: string;
  clipboardHistory?: ClipboardEntry[];
  defaultTab?: 'files' | 'clipboard';
  activeUsers?: ActiveUser[];
}

export interface ActiveUser {
  id: string;
  deviceName: string;
  joinedAt: string;
}
