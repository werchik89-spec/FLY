import React, { useState } from 'react';
import {
  Search, Menu, Pin, VolumeX, MessageSquarePlus,
} from 'lucide-react';
import Avatar from './Avatar';
import { formatChatTime, truncateText } from '../utils/helpers';
import { Chat } from '../types';
import ContextMenu from './ContextMenu';

interface SidebarProps {
  store: ReturnType<typeof import('../store/useStore').useStore>;
}

const Sidebar: React.FC<SidebarProps> = ({ store }) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    chat: Chat;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chat });
  };

  const closeContextMenu = () => setContextMenu(null);

  const getStatusForChat = (chat: Chat): boolean => {
    if (chat.type !== 'private') return false;
    const otherUserId = chat.members.find((id) => id !== 'me');
    const user = store.users.find((u) => u.id === otherUserId);
    return user?.status === 'online';
  };

  const getLastMessagePreview = (chat: Chat): React.ReactNode => {
    if (!chat.lastMessage) return <span className="chat-preview">Нет сообщений</span>;
    const msg = chat.lastMessage;
    const isMe = msg.senderId === 'me';
    const sender = isMe
      ? null
      : store.users.find((u) => u.id === msg.senderId);

    return (
      <span className="chat-preview">
        {chat.type === 'group' && !isMe && sender && (
          <span className="chat-sender">{sender.name.split(' ')[0]}: </span>
        )}
        {isMe && chat.type === 'group' && (
          <span className="chat-sender">Вы: </span>
        )}
        {truncateText(msg.text, 40)}
      </span>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button
          className="menu-btn"
          onClick={() => store.setShowSettings(true)}
          title="Меню"
        >
          <Menu size={22} />
        </button>

        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Поиск..."
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className="menu-btn"
          onClick={() => store.setShowNewChat(true)}
          title="Новый чат"
        >
          <MessageSquarePlus size={22} />
        </button>
      </div>

      <div className="folder-tabs">
        {store.folders.map((folder) => (
          <button
            key={folder.id}
            className={`folder-tab ${store.activeFolder === folder.id ? 'active' : ''}`}
            onClick={() => store.setActiveFolder(folder.id)}
          >
            {folder.icon} {folder.name}
          </button>
        ))}
      </div>

      <div className="chat-list">
        {store.chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${store.activeChatId === chat.id ? 'active' : ''}`}
            onClick={() => {
              store.setActiveChatId(chat.id);
              store.markAsRead(chat.id);
            }}
            onContextMenu={(e) => handleContextMenu(e, chat)}
          >
            <Avatar
              name={chat.name}
              color={chat.avatar}
              size={50}
              online={getStatusForChat(chat)}
            />

            <div className="chat-info">
              <div className="chat-info-top">
                <span className="chat-name">{chat.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {chat.isPinned && (
                    <Pin size={14} className="pin-icon" />
                  )}
                  <span className="chat-time">
                    {chat.lastMessage
                      ? formatChatTime(chat.lastMessage.timestamp)
                      : ''}
                  </span>
                </div>
              </div>
              <div className="chat-info-bottom">
                {getLastMessagePreview(chat)}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {chat.isMuted && (
                    <VolumeX size={14} className="pin-icon" style={{ marginRight: 4 }} />
                  )}
                  {chat.unreadCount > 0 && (
                    <span
                      className={`unread-badge ${chat.isMuted ? 'muted-badge' : ''}`}
                    >
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {store.chats.length === 0 && (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <p>Чатов не найдено</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          items={[
            {
              label: contextMenu.chat.isPinned ? 'Открепить' : 'Закрепить',
              icon: '📌',
              onClick: () => {
                store.togglePinChat(contextMenu.chat.id);
                closeContextMenu();
              },
            },
            {
              label: contextMenu.chat.isMuted ? 'Включить звук' : 'Без звука',
              icon: contextMenu.chat.isMuted ? '🔔' : '🔕',
              onClick: () => {
                store.toggleMuteChat(contextMenu.chat.id);
                closeContextMenu();
              },
            },
            {
              label: 'Архивировать',
              icon: '📥',
              onClick: () => {
                store.archiveChat(contextMenu.chat.id);
                closeContextMenu();
              },
            },
            { separator: true },
            {
              label: 'Удалить чат',
              icon: '🗑️',
              danger: true,
              onClick: () => {
                store.deleteChat(contextMenu.chat.id);
                closeContextMenu();
              },
            },
          ]}
        />
      )}
    </div>
  );
};

export default Sidebar;
