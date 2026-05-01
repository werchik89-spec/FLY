import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { User, Message, Chat, FriendRequest, IncomingCall, FileAttachment } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, { autoConnect: false });
  }
  return socket;
}

const notificationSound = typeof Audio !== 'undefined' ? new Audio('data:audio/wav;base64,UklGRlgFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQFAAB/f39/f39/gICAgIGBgYGCgoKCg4ODg4SEhISFhYWFhoaGhoeHh4eIiIiIiYmJiYqKioqLi4uLjIyMjI2NjY2Ojo6Oj4+Pj5CQkJCRkZGRkpKSkpOTk5OUlJSUlZWVlZaWlpaXl5eXmJiYmJmZmZmampqam5ubm5ycnJydnZ2dnp6enp+fn5+goKCgoaGhoaKioqKjo6Ojo6SkpKSlpaWlpqampqenp6eoqKioqampqaqqqqqqq6urq6ysrKytra2trq6urq+vr6+wsLCwsbGxsbKysrKzs7Ozs7S0tLS1tbW1tra2tre3t7e4uLi4ubm5ubq6urq7u7u7u7y8vLy9vb29vr6+vr+/v7/AwMDAwcHBwcLCwsLDw8PDw8TExMTFxcXFxsbGxsfHx8fIyMjIycnJycrKysrLy8vLy8zMzMzNzc3Nzs7Ozs/Pz8/Q0NDQ0NHR0dHS0tLS09PT09TU1NTV1dXV1tbW1tfX19fY2NjY2dnZ2dra2trb29vb3Nzc3N3d3d3e3t7e39/f3+Dg4ODh4eHh4uLi4uPj4+Pk5OTk5eXl5ebm5ubn5+fn6Ojo6Onp6enq6urq6+vr6+zs7Ozt7e3t7u7u7u/v7+/w8PDw8fHx8fLy8vLz8/Pz9PT09PX19fX29vb29/f39/j4+Pj5+fn5+vr6+vv7+/v8/Pz8/f39/f7+/v7///8=') : null;

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
  const [activeCall, setActiveCall] = useState<{ callId: string; user: User; callType: string; screenSharing?: boolean } | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Map<string, Message>>(new Map());
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<boolean>(() => {
    return localStorage.getItem('zenvor_notifications') !== 'false';
  });
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const playNotification = useCallback(() => {
    if (notifications && notificationSound) {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {});
    }
  }, [notifications]);

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
      if (msg.senderId !== user.id) {
        playNotification();
      }
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

    s.on('message:pinned', ({ chatId, message }: { chatId: string; message: Message }) => {
      setPinnedMessages(prev => new Map(prev).set(chatId, message));
    });

    s.on('message:unpinned', ({ chatId }: { chatId: string }) => {
      setPinnedMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(chatId);
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
      playNotification();
    });

    s.on('friend:accepted', ({ friend, chatId }: { friend: User; chatId: string }) => {
      setChats(prev => {
        if (prev.find(c => c.id === chatId)) return prev;
        return [...prev, { id: chatId, friend, lastMessage: undefined, unreadCount: 0 }];
      });
    });

    s.on('group:created', ({ chatId, groupName, members, isGroup }: { chatId: string; groupName: string; members: User[]; isGroup: boolean }) => {
      setChats(prev => {
        if (prev.find(c => c.id === chatId)) return prev;
        return [...prev, {
          id: chatId,
          friend: members[0],
          lastMessage: undefined,
          unreadCount: 0,
          isGroup,
          groupName,
          groupMembers: members,
        }];
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
      playNotification();
    });

    s.on('call:accepted', () => {
      // Call is accepted, already showing call screen
    });

    s.on('call:rejected', () => {
      setActiveCall(null);
    });

    s.on('call:ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    s.on('call:screen-sharing', ({ userId, sharing }: { userId: string; sharing: boolean }) => {
      setActiveCall(prev => prev ? { ...prev, screenSharing: sharing } : null);
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

      chatList.forEach(chat => {
        s.emit('message:history', { chatId: chat.id }, (data: { messages: Message[]; pinnedMessage: Message | null }) => {
          const msgs = data.messages || data;
          setMessages(prev => {
            const newMap = new Map(prev);
            newMap.set(chat.id, Array.isArray(msgs) ? msgs : []);
            return newMap;
          });
          const msgArray = Array.isArray(msgs) ? msgs : [];
          if (msgArray.length > 0) {
            setChats(prev => prev.map(c =>
              c.id === chat.id ? { ...c, lastMessage: msgArray[msgArray.length - 1] } : c
            ));
          }
          if (data.pinnedMessage) {
            setPinnedMessages(prev => new Map(prev).set(chat.id, data.pinnedMessage!));
          }
        });
      });

      friendList.forEach(f => {
        if (f.isOnline) {
          setOnlineUsers(prev => new Set(prev).add(f.id));
        }
      });
    });

    // Load groups
    s.emit('group:list', user.id, (groupList: { chatId: string; groupName: string; members: User[]; isGroup: boolean }[]) => {
      if (groupList && groupList.length > 0) {
        setChats(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newGroups = groupList.filter(g => !existingIds.has(g.chatId)).map(g => ({
            id: g.chatId,
            friend: g.members[0],
            lastMessage: undefined,
            unreadCount: 0,
            isGroup: true,
            groupName: g.groupName,
            groupMembers: g.members,
          }));
          return [...prev, ...newGroups];
        });

        groupList.forEach(g => {
          s.emit('message:history', { chatId: g.chatId }, (data: { messages: Message[]; pinnedMessage: Message | null }) => {
            const msgs = data.messages || data;
            setMessages(prev => {
              const newMap = new Map(prev);
              newMap.set(g.chatId, Array.isArray(msgs) ? msgs : []);
              return newMap;
            });
          });
        });
      }
    });
  }, [playNotification]);

  const login = useCallback(async (username: string, password: string) => {
    let res;
    try {
      res = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error('Сервер недоступен. Запустите: npm run dev:server');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setCurrentUser(data.user);
    localStorage.setItem('zenvor_user', JSON.stringify(data.user));
    connectSocket(data.user);
    return data.user;
  }, [connectSocket]);

  const register = useCallback(async (username: string, password: string, displayName: string) => {
    let res;
    try {
      res = await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });
    } catch {
      throw new Error('Сервер недоступен. Запустите: npm run dev:server');
    }
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

  const sendMessage = useCallback((text: string, replyTo?: string, file?: FileAttachment, voice?: { url: string; duration: number }) => {
    if (!activeChat || !currentUser) return;
    const s = getSocket();
    s.emit('message:send', {
      chatId: activeChat,
      senderId: currentUser.id,
      text,
      replyTo: replyTo || null,
      file: file || null,
      voice: voice || null,
    });
  }, [activeChat, currentUser]);

  const uploadFile = useCallback(async (file: File): Promise<FileAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const res = await fetch(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64,
              fileType: file.type,
            }),
          });
          const data = await res.json();
          data.url = `${SERVER_URL}${data.url}`;
          resolve(data);
        } catch {
          reject(new Error('Upload failed'));
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

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

  const pinMessage = useCallback((messageId: string) => {
    if (!activeChat) return;
    const s = getSocket();
    s.emit('message:pin', { messageId, chatId: activeChat });
  }, [activeChat]);

  const unpinMessage = useCallback(() => {
    if (!activeChat) return;
    const s = getSocket();
    s.emit('message:unpin', { chatId: activeChat });
  }, [activeChat]);

  const forwardMessage = useCallback((messageId: string, toChatId: string) => {
    if (!activeChat || !currentUser) return;
    const s = getSocket();
    s.emit('message:forward', {
      fromChatId: activeChat,
      messageId,
      toChatId,
      senderId: currentUser.id,
    });
  }, [activeChat, currentUser]);

  const searchMessages = useCallback((query: string) => {
    if (!activeChat || !query.trim()) {
      setSearchResults([]);
      return;
    }
    const s = getSocket();
    s.emit('message:search', { chatId: activeChat, query }, (results: Message[]) => {
      setSearchResults(results);
    });
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

  const createGroup = useCallback((name: string, memberIds: string[]) => {
    if (!currentUser) return;
    const s = getSocket();
    s.emit('group:create', { name, creatorId: currentUser.id, memberIds });
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

  const toggleScreenShare = useCallback(() => {
    if (!activeCall || !currentUser) return;
    const s = getSocket();
    const sharing = !activeCall.screenSharing;
    s.emit('call:screen-share', {
      callId: activeCall.callId,
      userId: currentUser.id,
      otherUserId: activeCall.user.id,
      sharing,
    });
    setActiveCall(prev => prev ? { ...prev, screenSharing: sharing } : null);
  }, [activeCall, currentUser]);

  const toggleNotifications = useCallback(() => {
    setNotifications(prev => {
      const next = !prev;
      localStorage.setItem('zenvor_notifications', String(next));
      return next;
    });
  }, []);

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
    pinnedMessages,
    searchResults,
    notifications,
    login,
    register,
    logout,
    sendMessage,
    uploadFile,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    forwardMessage,
    searchMessages,
    markAsRead,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    createGroup,
    startTyping,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleScreenShare,
    toggleNotifications,
  };
}
