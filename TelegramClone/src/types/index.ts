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

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  replyTo: string | null;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  edited: boolean;
}

export interface Chat {
  id: string;
  friend: User;
  lastMessage?: Message;
  unreadCount: number;
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
