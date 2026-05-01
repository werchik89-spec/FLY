import { useState, useCallback, useEffect } from 'react';
import { User, Chat, Message, AppSettings, Theme, FolderFilter } from '../types';
import { generateMockData } from '../utils/mockData';

const STORAGE_KEY = 'nexus-messenger-data';
const SETTINGS_KEY = 'nexus-messenger-settings';

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'ru',
  notifications: true,
  soundEnabled: true,
  autoTranslate: false,
  focusMode: false,
  fontSize: 'medium',
  chatBackground: 'default',
  sendByEnter: true,
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadMessages(): Record<string, Message[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY + '-messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const key of Object.keys(parsed)) {
        parsed[key] = parsed[key].map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
      return parsed;
    }
  } catch {}
  return {};
}

function saveMessages(messages: Record<string, Message[]>) {
  localStorage.setItem(STORAGE_KEY + '-messages', JSON.stringify(messages));
}

export function useStore() {
  const [currentUser] = useState<User>({
    id: 'me',
    name: 'Вы',
    username: 'user',
    avatar: '',
    status: 'online',
    bio: 'Пользователь Nexus Messenger',
    phone: '+7 (999) 123-45-67',
  });

  const mockData = generateMockData();

  const [users] = useState<User[]>(mockData.users);
  const [chats, setChats] = useState<Chat[]>(mockData.chats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const loaded = loadMessages();
    return Object.keys(loaded).length > 0 ? loaded : mockData.messages;
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [folders] = useState<FolderFilter[]>([
    { id: 'all', name: 'Все чаты', icon: '💬', chatIds: [] },
    { id: 'personal', name: 'Личные', icon: '👤', chatIds: [] },
    { id: 'groups', name: 'Группы', icon: '👥', chatIds: [] },
    { id: 'channels', name: 'Каналы', icon: '📢', chatIds: [] },
    { id: 'unread', name: 'Непрочитанные', icon: '🔔', chatIds: [] },
  ]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveSettings(settings);
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const setSettings = useCallback((update: Partial<AppSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...update }));
  }, []);

  const sendMessage = useCallback(
    (chatId: string, text: string, attachments?: Message['attachments']) => {
      const newMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        chatId,
        senderId: 'me',
        text,
        timestamp: new Date(),
        status: 'sent',
        attachments,
        replyTo: undefined,
      };

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg],
      }));

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, lastMessage: newMsg, draft: undefined } : c
        )
      );

      // Simulate delivery
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m
          ),
        }));
      }, 1000);

      // Simulate read
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: 'read' as const } : m
          ),
        }));
      }, 2500);

      // Simulate auto-reply for private chats
      const chat = chats.find((c) => c.id === chatId);
      if (chat && chat.type === 'private') {
        const otherUserId = chat.members.find((id) => id !== 'me');
        const otherUser = users.find((u) => u.id === otherUserId);
        if (otherUser && !otherUser.isBot) {
          setTimeout(() => {
            const replies = [
              'Интересно! Расскажи подробнее 🤔',
              'Понял, спасибо! 👍',
              'Ок, давай обсудим позже',
              'Хорошо, согласен! 😊',
              'Отличная идея!',
              'Ладно, подумаю над этим',
              'Конечно, без проблем 👌',
              'Спасибо за информацию!',
              'Да, я тоже так думаю',
              'Хм, нужно подумать...',
            ];
            const replyMsg: Message = {
              id: `msg-${Date.now()}-reply`,
              chatId,
              senderId: otherUserId || '',
              text: replies[Math.floor(Math.random() * replies.length)],
              timestamp: new Date(),
              status: 'read',
            };
            setMessages((prev) => ({
              ...prev,
              [chatId]: [...(prev[chatId] || []), replyMsg],
            }));
            setChats((prev) =>
              prev.map((c) =>
                c.id === chatId
                  ? { ...c, lastMessage: replyMsg, unreadCount: c.unreadCount + 1 }
                  : c
              )
            );
          }, 2000 + Math.random() * 3000);
        }
      }
    },
    [chats, users]
  );

  const deleteMessage = useCallback((chatId: string, messageId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter((m) => m.id !== messageId),
    }));
  }, []);

  const editMessage = useCallback(
    (chatId: string, messageId: string, newText: string) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, text: newText, edited: true } : m
        ),
      }));
      setEditingMessage(null);
    },
    []
  );

  const togglePin = useCallback((chatId: string, messageId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      ),
    }));
  }, []);

  const addReaction = useCallback(
    (chatId: string, messageId: string, emoji: string) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          const existing = reactions.find(
            (r) => r.emoji === emoji && r.userId === 'me'
          );
          if (existing) {
            return {
              ...m,
              reactions: reactions.filter(
                (r) => !(r.emoji === emoji && r.userId === 'me')
              ),
            };
          }
          return {
            ...m,
            reactions: [
              ...reactions,
              { emoji, userId: 'me', animated: true },
            ],
          };
        }),
      }));
    },
    []
  );

  const togglePinChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, isPinned: !c.isPinned } : c
      )
    );
  }, []);

  const toggleMuteChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, isMuted: !c.isMuted } : c
      )
    );
  }, []);

  const archiveChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, isArchived: !c.isArchived } : c
      )
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessages((prev) => {
      const copy = { ...prev };
      delete copy[chatId];
      return copy;
    });
    if (activeChatId === chatId) setActiveChatId(null);
  }, [activeChatId]);

  const markAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  const createChat = useCallback(
    (userId: string) => {
      const existing = chats.find(
        (c) => c.type === 'private' && c.members.includes(userId)
      );
      if (existing) {
        setActiveChatId(existing.id);
        setShowNewChat(false);
        return;
      }
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        type: 'private',
        name: user.name,
        avatar: user.avatar,
        members: ['me', userId],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setShowNewChat(false);
    },
    [chats, users]
  );

  const filteredChats = chats.filter((chat) => {
    if (chat.isArchived) return false;
    if (searchQuery) {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    switch (activeFolder) {
      case 'personal':
        return chat.type === 'private';
      case 'groups':
        return chat.type === 'group';
      case 'channels':
        return chat.type === 'channel';
      case 'unread':
        return chat.unreadCount > 0;
      default:
        return true;
    }
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const aTime = a.lastMessage?.timestamp?.getTime() || a.createdAt.getTime();
    const bTime = b.lastMessage?.timestamp?.getTime() || b.createdAt.getTime();
    return bTime - aTime;
  });

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeChatMessages = activeChatId ? messages[activeChatId] || [] : [];

  return {
    currentUser,
    users,
    chats: sortedChats,
    allChats: chats,
    messages,
    activeChatMessages,
    activeChat,
    activeChatId,
    settings,
    searchQuery,
    showSettings,
    showProfile,
    showNewChat,
    selectedUserId,
    replyToMessage,
    editingMessage,
    activeFolder,
    folders,
    showEmojiPicker,
    setActiveChatId,
    setSettings,
    setSearchQuery,
    setShowSettings,
    setShowProfile,
    setShowNewChat,
    setSelectedUserId,
    setReplyToMessage,
    setEditingMessage,
    setActiveFolder,
    setShowEmojiPicker,
    sendMessage,
    deleteMessage,
    editMessage,
    togglePin,
    addReaction,
    togglePinChat,
    toggleMuteChat,
    archiveChat,
    deleteChat,
    markAsRead,
    createChat,
  };
}
