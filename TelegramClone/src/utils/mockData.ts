import { User, Chat, Message } from '../types';

const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F1948A', '#82E0AA', '#F8C471', '#AED6F1', '#D7BDE2',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function generateMockData() {
  const users: User[] = [
    {
      id: 'user-1',
      name: 'Алексей Петров',
      username: 'alexey_p',
      avatar: getAvatarColor('user-1'),
      status: 'online',
      bio: 'Frontend разработчик | React & TypeScript',
      phone: '+7 (900) 111-22-33',
    },
    {
      id: 'user-2',
      name: 'Мария Иванова',
      username: 'maria_iv',
      avatar: getAvatarColor('user-2'),
      status: 'recently',
      lastSeen: new Date(Date.now() - 1800000),
      bio: 'Дизайнер интерфейсов 🎨',
      phone: '+7 (900) 222-33-44',
    },
    {
      id: 'user-3',
      name: 'Дмитрий Козлов',
      username: 'dima_k',
      avatar: getAvatarColor('user-3'),
      status: 'online',
      bio: 'Full-stack developer',
      phone: '+7 (900) 333-44-55',
    },
    {
      id: 'user-4',
      name: 'Елена Сидорова',
      username: 'elena_s',
      avatar: getAvatarColor('user-4'),
      status: 'offline',
      lastSeen: new Date(Date.now() - 86400000),
      bio: 'Project Manager',
    },
    {
      id: 'user-5',
      name: 'Андрей Волков',
      username: 'andrew_v',
      avatar: getAvatarColor('user-5'),
      status: 'online',
      bio: 'DevOps & Cloud ☁️',
    },
    {
      id: 'user-6',
      name: 'Ольга Новикова',
      username: 'olga_n',
      avatar: getAvatarColor('user-6'),
      status: 'recently',
      lastSeen: new Date(Date.now() - 7200000),
      bio: 'QA Engineer',
    },
    {
      id: 'user-7',
      name: 'Сергей Морозов',
      username: 'sergey_m',
      avatar: getAvatarColor('user-7'),
      status: 'away',
      bio: 'Backend разработчик | Python & Go',
    },
    {
      id: 'user-8',
      name: 'Nexus Bot',
      username: 'nexus_bot',
      avatar: getAvatarColor('user-8'),
      status: 'online',
      bio: 'Ваш умный помощник 🤖',
      isBot: true,
    },
    {
      id: 'user-9',
      name: 'Анна Кузнецова',
      username: 'anna_k',
      avatar: getAvatarColor('user-9'),
      status: 'online',
      bio: 'Data Scientist 📊',
    },
    {
      id: 'user-10',
      name: 'Игорь Лебедев',
      username: 'igor_l',
      avatar: getAvatarColor('user-10'),
      status: 'offline',
      lastSeen: new Date(Date.now() - 172800000),
      bio: 'Mobile Developer | Flutter',
    },
  ];

  const now = new Date();
  const min = (m: number) => new Date(now.getTime() - m * 60000);
  const hr = (h: number) => new Date(now.getTime() - h * 3600000);

  const chats: Chat[] = [
    {
      id: 'chat-1',
      type: 'private',
      name: 'Алексей Петров',
      avatar: getAvatarColor('user-1'),
      members: ['me', 'user-1'],
      unreadCount: 2,
      isPinned: true,
      isMuted: false,
      isArchived: false,
      createdAt: hr(48),
    },
    {
      id: 'chat-2',
      type: 'group',
      name: 'Команда разработки 🚀',
      avatar: getAvatarColor('chat-2'),
      members: ['me', 'user-1', 'user-2', 'user-3', 'user-5', 'user-7'],
      unreadCount: 5,
      isPinned: true,
      isMuted: false,
      isArchived: false,
      createdAt: hr(720),
      description: 'Рабочий чат команды разработки',
      adminIds: ['me', 'user-1'],
    },
    {
      id: 'chat-3',
      type: 'private',
      name: 'Мария Иванова',
      avatar: getAvatarColor('user-2'),
      members: ['me', 'user-2'],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(24),
    },
    {
      id: 'chat-4',
      type: 'channel',
      name: 'Nexus News 📰',
      avatar: getAvatarColor('chat-4'),
      members: ['me', 'user-8'],
      unreadCount: 3,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(1440),
      description: 'Новости и обновления Nexus Messenger',
      adminIds: ['user-8'],
    },
    {
      id: 'chat-5',
      type: 'private',
      name: 'Дмитрий Козлов',
      avatar: getAvatarColor('user-3'),
      members: ['me', 'user-3'],
      unreadCount: 1,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(12),
    },
    {
      id: 'chat-6',
      type: 'group',
      name: 'Друзья 🎉',
      avatar: getAvatarColor('chat-6'),
      members: ['me', 'user-2', 'user-4', 'user-6', 'user-9'],
      unreadCount: 0,
      isPinned: false,
      isMuted: true,
      isArchived: false,
      createdAt: hr(2160),
      description: 'Чат для друзей',
    },
    {
      id: 'chat-7',
      type: 'private',
      name: 'Nexus Bot',
      avatar: getAvatarColor('user-8'),
      members: ['me', 'user-8'],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(1),
    },
    {
      id: 'chat-8',
      type: 'private',
      name: 'Елена Сидорова',
      avatar: getAvatarColor('user-4'),
      members: ['me', 'user-4'],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(72),
    },
    {
      id: 'chat-9',
      type: 'saved',
      name: 'Избранное ⭐',
      avatar: '#FFD700',
      members: ['me'],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(8760),
    },
    {
      id: 'chat-10',
      type: 'private',
      name: 'Андрей Волков',
      avatar: getAvatarColor('user-5'),
      members: ['me', 'user-5'],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: hr(6),
    },
  ];

  const messages: Record<string, Message[]> = {
    'chat-1': [
      { id: 'm1-1', chatId: 'chat-1', senderId: 'user-1', text: 'Привет! Как проект?', timestamp: min(45), status: 'read' },
      { id: 'm1-2', chatId: 'chat-1', senderId: 'me', text: 'Привет! Всё идёт по плану, сегодня закончу фронтенд', timestamp: min(42), status: 'read' },
      { id: 'm1-3', chatId: 'chat-1', senderId: 'user-1', text: 'Отлично! Я тоже почти закончил API', timestamp: min(40), status: 'read' },
      { id: 'm1-4', chatId: 'chat-1', senderId: 'me', text: 'Давай завтра созвонимся и обсудим интеграцию?', timestamp: min(38), status: 'read' },
      { id: 'm1-5', chatId: 'chat-1', senderId: 'user-1', text: 'Да, давай в 11 утра', timestamp: min(35), status: 'read' },
      { id: 'm1-6', chatId: 'chat-1', senderId: 'me', text: '👍 Договорились!', timestamp: min(33), status: 'read' },
      { id: 'm1-7', chatId: 'chat-1', senderId: 'user-1', text: 'Кстати, посмотри новый дизайн — Мария прислала макеты', timestamp: min(10), status: 'delivered' },
      { id: 'm1-8', chatId: 'chat-1', senderId: 'user-1', text: 'Выглядит очень круто! 🔥', timestamp: min(8), status: 'delivered' },
    ],
    'chat-2': [
      { id: 'm2-1', chatId: 'chat-2', senderId: 'user-3', text: 'Всем привет! Обновил зависимости в проекте', timestamp: min(120), status: 'read' },
      { id: 'm2-2', chatId: 'chat-2', senderId: 'user-1', text: 'Супер, проверю', timestamp: min(115), status: 'read' },
      { id: 'm2-3', chatId: 'chat-2', senderId: 'user-5', text: 'Деплой на стейджинг готов', timestamp: min(60), status: 'read' },
      { id: 'm2-4', chatId: 'chat-2', senderId: 'user-2', text: 'Добавила новые иконки в Figma', timestamp: min(30), status: 'read' },
      { id: 'm2-5', chatId: 'chat-2', senderId: 'user-7', text: 'Оптимизировал запросы к БД, теперь на 40% быстрее', timestamp: min(20), status: 'delivered' },
      { id: 'm2-6', chatId: 'chat-2', senderId: 'user-1', text: 'Отличная работа, Сергей! 🎯', timestamp: min(15), status: 'delivered' },
      { id: 'm2-7', chatId: 'chat-2', senderId: 'user-3', text: 'Когда митинг сегодня?', timestamp: min(5), status: 'delivered' },
      { id: 'm2-8', chatId: 'chat-2', senderId: 'user-5', text: 'В 15:00 по Москве', timestamp: min(3), status: 'delivered' },
      { id: 'm2-9', chatId: 'chat-2', senderId: 'user-2', text: 'Я буду чуть позже, минут через 10', timestamp: min(2), status: 'delivered' },
    ],
    'chat-3': [
      { id: 'm3-1', chatId: 'chat-3', senderId: 'me', text: 'Мария, привет! Получила мой файл?', timestamp: hr(2), status: 'read' },
      { id: 'm3-2', chatId: 'chat-3', senderId: 'user-2', text: 'Да, получила! Сейчас смотрю', timestamp: hr(1.5), status: 'read' },
      { id: 'm3-3', chatId: 'chat-3', senderId: 'user-2', text: 'Нужно немного поправить отступы на главной', timestamp: hr(1), status: 'read' },
      { id: 'm3-4', chatId: 'chat-3', senderId: 'me', text: 'Ок, сделаю сегодня', timestamp: min(55), status: 'read' },
    ],
    'chat-4': [
      { id: 'm4-1', chatId: 'chat-4', senderId: 'user-8', text: '🎉 Nexus Messenger v2.0 — Что нового?\n\n• Голосовые сообщения\n• Реакции на сообщения\n• Темы оформления\n• Режим Фокус\n• Встроенный переводчик', timestamp: hr(4), status: 'delivered' },
      { id: 'm4-2', chatId: 'chat-4', senderId: 'user-8', text: '🔒 Безопасность\n\nМы обновили протокол шифрования. Теперь все ваши сообщения защищены end-to-end шифрованием.', timestamp: hr(2), status: 'delivered' },
      { id: 'm4-3', chatId: 'chat-4', senderId: 'user-8', text: '💡 Совет дня\n\nИспользуйте Ctrl+K для быстрого поиска по чатам и сообщениям', timestamp: min(30), status: 'delivered' },
    ],
    'chat-5': [
      { id: 'm5-1', chatId: 'chat-5', senderId: 'user-3', text: 'Привет! Можешь помочь с Git?', timestamp: min(90), status: 'read' },
      { id: 'm5-2', chatId: 'chat-5', senderId: 'me', text: 'Конечно, что случилось?', timestamp: min(85), status: 'read' },
      { id: 'm5-3', chatId: 'chat-5', senderId: 'user-3', text: 'Не могу смерджить ветку, конфликты 😅', timestamp: min(80), status: 'read' },
      { id: 'm5-4', chatId: 'chat-5', senderId: 'me', text: 'Сейчас покажу, это просто', timestamp: min(75), status: 'read' },
      { id: 'm5-5', chatId: 'chat-5', senderId: 'user-3', text: 'Спасибо большое, разобрался! 🙏', timestamp: min(20), status: 'delivered' },
    ],
    'chat-6': [
      { id: 'm6-1', chatId: 'chat-6', senderId: 'user-4', text: 'Идём в субботу на квиз?', timestamp: hr(5), status: 'read' },
      { id: 'm6-2', chatId: 'chat-6', senderId: 'user-9', text: 'Я за! 🎯', timestamp: hr(4.5), status: 'read' },
      { id: 'm6-3', chatId: 'chat-6', senderId: 'user-6', text: 'Тоже буду', timestamp: hr(4), status: 'read' },
      { id: 'm6-4', chatId: 'chat-6', senderId: 'me', text: 'Давайте! Во сколько?', timestamp: hr(3), status: 'read' },
      { id: 'm6-5', chatId: 'chat-6', senderId: 'user-4', text: 'В 19:00, как обычно', timestamp: hr(2.5), status: 'read' },
    ],
    'chat-7': [
      { id: 'm7-1', chatId: 'chat-7', senderId: 'user-8', text: '👋 Привет! Я Nexus Bot — ваш умный помощник.\n\nЯ могу:\n• Переводить текст\n• Напоминать о событиях\n• Отвечать на вопросы\n• Управлять настройками\n\nНапишите /help для списка команд', timestamp: hr(1), status: 'read' },
    ],
    'chat-9': [
      { id: 'm9-1', chatId: 'chat-9', senderId: 'me', text: 'Заметка: обновить документацию по API до пятницы', timestamp: hr(24), status: 'read', isPinned: true },
      { id: 'm9-2', chatId: 'chat-9', senderId: 'me', text: 'Ссылка на дизайн: figma.com/file/nexus-design', timestamp: hr(12), status: 'read' },
    ],
  };

  // Update last messages
  for (const chat of chats) {
    const chatMessages = messages[chat.id];
    if (chatMessages && chatMessages.length > 0) {
      chat.lastMessage = chatMessages[chatMessages.length - 1];
    }
  }

  return { users, chats, messages };
}
