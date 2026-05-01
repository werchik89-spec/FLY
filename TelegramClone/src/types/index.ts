export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'recently' | 'away';
  lastSeen?: Date;
  bio?: string;
  phone?: string;
  isBot?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  forwarded?: boolean;
  forwardedFrom?: string;
  edited?: boolean;
  reactions?: Reaction[];
  attachments?: Attachment[];
  isPinned?: boolean;
  isVoice?: boolean;
  voiceDuration?: number;
}

export interface Reaction {
  emoji: string;
  userId: string;
  animated?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio' | 'sticker' | 'gif';
  url: string;
  name?: string;
  size?: number;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel' | 'saved';
  name: string;
  avatar: string;
  members: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  description?: string;
  adminIds?: string[];
  draft?: string;
}

export interface Sticker {
  id: string;
  url: string;
  emoji: string;
  packName: string;
}

export type Theme = 'light' | 'dark' | 'midnight' | 'emerald' | 'sunset';

export interface AppSettings {
  theme: Theme;
  language: string;
  notifications: boolean;
  soundEnabled: boolean;
  autoTranslate: boolean;
  focusMode: boolean;
  focusSchedule?: { start: string; end: string };
  fontSize: 'small' | 'medium' | 'large';
  chatBackground: string;
  sendByEnter: boolean;
}

export interface FolderFilter {
  id: string;
  name: string;
  icon: string;
  chatIds: string[];
}
