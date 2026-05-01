import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { User, Message, Chat, FriendRequest, IncomingCall } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, { autoConnect: false });
  }
  return socket;
}

export function useStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('zenvor_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<{ callId: string; user: User; callType: string } | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const connectSocket = useCallback((user: User) => {
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
    s.emit('user:online', user.id);

    s.on('message:received', (msg: Message) => {
      setMessages(prev => {
        const newMap = new Map(prev);
        const chatMsgs = [...(newMap.get(msg.chatId) || [])];
        if (!chatMsgs.find(m => m.id === msg.id)) {
          chatMsgs.push(msg);
          newMap.set(msg.chatId, chatMsgs);
        }
        return newMap;
      });
      setChats(prev => {
        return prev.map(c => {
          if (c.id === msg.chatId) {
            return {
              ...c,
              lastMessage: msg,
              unreadCount: msg.senderId !== user.id ? c.unreadCount + 1 : c.unreadCount,
            };
          }
          return c;
        });
      });
    });

    s.on('message:status', ({ messageId, chatId, status }: { messageId: string; chatId: string; status: string }) => {
      setMessages(prev => {
        const newMap = new Map(prev);
        const chatMsgs = (newMap.get(chatId) || []).map(m =>
          m.id === messageId ? { ...m, status: status as Message['status'] } : m
        );
        newMap.set(chatId, chatMsgs);
        return newMap;
      });
    });

    s.on('message:all-read', ({ chatId, readBy }: { chatId: string; readBy: string }) => {
      if (readBy !== user.id) {
        setMessages(prev => {
          const newMap = new Map(prev);
          const chatMsgs = (newMap.get(chatId) || []).map(m =>
            m.senderId === user.id ? { ...m, status: 'read' as const } : m
          );
          newMap.set(chatId, chatMsgs);
          return newMap;
        });
      }
    });

    s.on('message:edited', ({ messageId, chatId, newText }: { messageId: string; chatId: string; newText: string }) => {
      setMessages(prev => {
        const newMap = new Map(prev);
        const chatMsgs = (newMap.get(chatId) || []).map(m =>
          m.id === messageId ? { ...m, text: newText, edited: true } : m
        );
        newMap.set(chatId, chatMsgs);
        return newMap;
      });
    });

    s.on('message:deleted', ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      setMessages(prev => {
        const newMap = new Map(prev);
        const chatMsgs = (newMap.get(chatId) || []).filter(m => m.id !== messageId);
        newMap.set(chatId, chatMsgs);
        return newMap;
      });
    });

    s.on('user:status', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    });

    s.on('friend:request:received', (request: FriendRequest) => {
      setFriendRequests(prev => [...prev, request]);
    });

    s.on('friend:accepted', ({ friend, chatId }: { friend: User; chatId: string }) => {
      setChats(prev => {
        if (prev.find(c => c.id === chatId)) return prev;
        return [...prev, { id: chatId, friend, lastMessage: undefined, unreadCount: 0 }];
      });
    });

    s.on('typing:started', ({ chatId }: { chatId: string }) => {
      setTypingUsers(prev => new Map(prev).set(chatId, true));
    });

    s.on('typing:stopped', ({ chatId }: { chatId: string }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(chatId);
        return newMap;
      });
    });

    s.on('call:incoming', (call: IncomingCall) => {
      setIncomingCall(call);
    });

    s.on('call:accepted', ({ callId }: { callId: string }) => {
      if (activeCall && activeCall.callId === callId) {
        // Call is accepted, already showing call screen
      }
    });

    s.on('call:rejected', () => {
      setActiveCall(null);
    });

    s.on('call:ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    // Load friend requests
    s.emit('friend:requests', user.id, (requests: FriendRequest[]) => {
      setFriendRequests(requests);
    });

    // Load friends as chats
    s.emit('friend:list', user.id, (friendList: User[]) => {
      const chatList: Chat[] = friendList.map(friend => ({
        id: [user.id, friend.id].sort().join(':'),
        friend,
        lastMessage: undefined,
        unreadCount: 0,
      }));
      setChats(chatList);

      // Load message history for each chat
      chatList.forEach(chat => {
        s.emit('message:history', { chatId: chat.id }, (msgs: Message[]) => {
          setMessages(prev => {
            const newMap = new Map(prev);
            newMap.set(chat.id, msgs);
            return newMap;
          });
          if (msgs.length > 0) {
            setChats(prev => prev.map(c =>
              c.id === chat.id ? { ...c, lastMessage: msgs[msgs.length - 1] } : c
            ));
          }
        });
      });

      // Track online status
      friendList.forEach(f => {
        if (f.isOnline) {
          setOnlineUsers(prev => new Set(prev).add(f.id));
        }
      });
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setCurrentUser(data.user);
    localStorage.setItem('zenvor_user', JSON.stringify(data.user));
    connectSocket(data.user);
    return data.user;
  }, [connectSocket]);

  const register = useCallback(async (username: string, password: string, displayName: string) => {
    const res = await fetch(`${SERVER_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setCurrentUser(data.user);
    localStorage.setItem('zenvor_user', JSON.stringify(data.user));
    connectSocket(data.user);
    return data.user;
  }, [connectSocket]);

  const logout = useCallback(() => {
    const s = getSocket();
    s.disconnect();
    setCurrentUser(null);
    setChats([]);
    setMessages(new Map());
    setActiveChat(null);
    setFriendRequests([]);
    localStorage.removeItem('zenvor_user');
  }, []);

  const sendMessage = useCallback((text: string, replyTo?: string) => {
    if (!activeChat || !currentUser) return;
    const s = getSocket();
    s.emit('message:send', {
      chatId: activeChat,
      senderId: currentUser.id,
      text,
      replyTo: replyTo || null,
    });
  }, [activeChat, currentUser]);

  const editMessage = useCallback((messageId: string, newText: string) => {
    if (!activeChat) return;
    const s = getSocket();
    s.emit('message:edit', { messageId, chatId: activeChat, newText });
  }, [activeChat]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!activeChat) return;
    const s = getSocket();
    s.emit('message:delete', { messageId, chatId: activeChat });
  }, [activeChat]);

  const markAsRead = useCallback((chatId: string) => {
    if (!currentUser) return;
    const s = getSocket();
    s.emit('message:read', { chatId, userId: currentUser.id });
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, unreadCount: 0 } : c
    ));
  }, [currentUser]);

  const sendFriendRequest = useCallback((toId: string) => {
    if (!currentUser) return;
    const s = getSocket();
    s.emit('friend:request', { fromId: currentUser.id, toId });
  }, [currentUser]);

  const acceptFriendRequest = useCallback((requestId: string) => {
    if (!currentUser) return;
    const s = getSocket();
    s.emit('friend:accept', { requestId, userId: currentUser.id });
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  }, [currentUser]);

  const rejectFriendRequest = useCallback((requestId: string) => {
    if (!currentUser) return;
    const s = getSocket();
    s.emit('friend:reject', { requestId, userId: currentUser.id });
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  }, [currentUser]);

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!currentUser || !query.trim()) return [];
    const res = await fetch(`${SERVER_URL}/api/users/search?q=${encodeURIComponent(query)}&userId=${currentUser.id}`);
    return res.json();
  }, [currentUser]);

  const startTyping = useCallback((chatId: string) => {
    if (!currentUser) return;
    const s = getSocket();
    s.emit('typing:start', { chatId, userId: currentUser.id });

    const existing = typingTimeoutRef.current.get(chatId);
    if (existing) clearTimeout(existing);
    typingTimeoutRef.current.set(chatId, setTimeout(() => {
      s.emit('typing:stop', { chatId, userId: currentUser.id });
      typingTimeoutRef.current.delete(chatId);
    }, 3000));
  }, [currentUser]);

  const initiateCall = useCallback((userId: string, callType: 'voice' | 'video') => {
    if (!currentUser) return;
    const s = getSocket();
    const callId = crypto.randomUUID();
    s.emit('call:initiate', { callerId: currentUser.id, receiverId: userId, callType });
    const friend = chats.find(c => c.friend.id === userId)?.friend;
    if (friend) {
      setActiveCall({ callId, user: friend, callType });
    }
  }, [currentUser, chats]);

  const acceptCall = useCallback(() => {
    if (!incomingCall || !currentUser) return;
    const s = getSocket();
    s.emit('call:accept', {
      callId: incomingCall.callId,
      receiverId: currentUser.id,
      callerId: incomingCall.caller.id,
    });
    setActiveCall({
      callId: incomingCall.callId,
      user: incomingCall.caller,
      callType: incomingCall.callType,
    });
    setIncomingCall(null);
  }, [incomingCall, currentUser]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    const s = getSocket();
    s.emit('call:reject', { callId: incomingCall.callId, callerId: incomingCall.caller.id });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (!activeCall || !currentUser) return;
    const s = getSocket();
    s.emit('call:end', {
      callId: activeCall.callId,
      userId: currentUser.id,
      otherUserId: activeCall.user.id,
    });
    setActiveCall(null);
  }, [activeCall, currentUser]);

  // Reconnect on load if user is saved
  useEffect(() => {
    if (currentUser) {
      connectSocket(currentUser);
    }
    return () => {
      const s = getSocket();
      s.removeAllListeners();
    };
  }, []);

  return {
    currentUser,
    chats,
    activeChat,
    setActiveChat,
    messages,
    friendRequests,
    onlineUsers,
    typingUsers,
    incomingCall,
    activeCall,
    login,
    register,
    logout,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    startTyping,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
