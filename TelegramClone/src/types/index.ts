export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  createdAt: string;
  lastSeen: string;
  isOnline?: boolean;
  isFriend?: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

export interface VoiceMessage {
  url: string;
  duration: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  replyTo: string | null;
  forwardedFrom?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  edited: boolean;
  pinned?: boolean;
  file?: FileAttachment;
  voice?: VoiceMessage;
}

export interface Chat {
  id: string;
  friend: User;
  lastMessage?: Message;
  unreadCount: number;
  pinnedMessage?: Message;
  isGroup?: boolean;
  groupName?: string;
  groupMembers?: User[];
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  fromUser: User;
  createdAt: string;
}

export interface IncomingCall {
  callId: string;
  caller: User;
  callType: 'voice' | 'video';
}
