import React, { useState } from 'react';
import type { Chat, User, FriendRequest } from '../types';
import { formatTime } from '../utils/helpers';

interface SidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onlineUsers: Set<string>;
  currentUser: User;
  friendRequests: FriendRequest[];
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onSearchUsers: (q: string) => Promise<User[]>;
  onSendFriendRequest: (userId: string) => void;
  onShowSettings: () => void;
  onShowProfile: () => void;
}

export default function Sidebar({
  chats,
  activeChat,
  onSelectChat,
  onlineUsers,
  currentUser,
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
  onSearchUsers,
  onSendFriendRequest,
  onShowSettings,
  onShowProfile,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'chats' | 'requests' | 'search'>('chats');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.trim().length > 0) {
      setTab('search');
      const results = await onSearchUsers(q);
      setSearchResults(results);
    } else {
      setTab('chats');
      setSearchResults([]);
    }
  };

  const handleAddFriend = (userId: string) => {
    onSendFriendRequest(userId);
    setSentRequests(prev => new Set(prev).add(userId));
  };

  const filteredChats = chats.filter(c =>
    c.friend.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.friend.username.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ZenvorMs</h2>
        <div className="sidebar-actions">
          <button className="icon-btn" onClick={onShowProfile} title="Профиль">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <button
            className="icon-btn"
            onClick={() => setTab(tab === 'requests' ? 'chats' : 'requests')}
            title="Запросы в друзья"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            {friendRequests.length > 0 && <span className="badge" />}
          </button>
          <button className="icon-btn" onClick={onShowSettings} title="Настройки">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          placeholder="Поиск пользователей..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${tab === 'chats' ? 'active' : ''}`}
          onClick={() => { setTab('chats'); setSearch(''); setSearchResults([]); }}
        >
          Чаты
        </button>
        <button
          className={`sidebar-tab ${tab === 'requests' ? 'active' : ''}`}
          onClick={() => setTab('requests')}
        >
          Запросы {friendRequests.length > 0 && `(${friendRequests.length})`}
        </button>
      </div>

      <div className="chat-list">
        {tab === 'chats' && (
          filteredChats.length === 0 ? (
            <div className="empty-state">
              <p>Нет чатов</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Найдите друзей через поиск
              </p>
            </div>
          ) : (
            filteredChats.map((chat, i) => (
              <div
                key={chat.id}
                className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="chat-avatar">
                  {chat.friend.avatar ? (
                    <img src={chat.friend.avatar} alt="" />
                  ) : (
                    getInitials(chat.friend.displayName)
                  )}
                  {onlineUsers.has(chat.friend.id) && <div className="online-dot" />}
                </div>
                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-name">{chat.friend.displayName}</span>
                    {chat.lastMessage && (
                      <span className="chat-time">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="chat-preview">
                    <span className="chat-last-msg">
                      {chat.lastMessage
                        ? (chat.lastMessage.senderId === currentUser.id ? 'Вы: ' : '') + chat.lastMessage.text
                        : 'Начните общение'
                      }
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="chat-unread">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {tab === 'requests' && (
          friendRequests.length === 0 ? (
            <div className="empty-state">
              <p>Нет запросов</p>
            </div>
          ) : (
            <div style={{ padding: '8px 16px' }}>
              {friendRequests.map(req => (
                <div key={req.id} className="friend-request-card">
                  <div className="chat-avatar">
                    {req.fromUser.avatar ? (
                      <img src={req.fromUser.avatar} alt="" />
                    ) : (
                      getInitials(req.fromUser.displayName)
                    )}
                  </div>
                  <div className="info">
                    <div className="name">{req.fromUser.displayName}</div>
                    <div className="username">@{req.fromUser.username}</div>
                  </div>
                  <div className="actions">
                    <button className="btn-accept" onClick={() => onAcceptRequest(req.id)}>
                      Принять
                    </button>
                    <button className="btn-reject" onClick={() => onRejectRequest(req.id)}>
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'search' && (
          searchResults.length === 0 ? (
            <div className="empty-state">
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            <div style={{ padding: '4px 8px' }}>
              {searchResults.map(user => (
                <div key={user.id} className="user-search-result">
                  <div className="chat-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" />
                    ) : (
                      getInitials(user.displayName)
                    )}
                    {user.isOnline && <div className="online-dot" />}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.displayName}</div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                  {user.isFriend ? (
                    <span className="btn-add-friend friend">Друг</span>
                  ) : sentRequests.has(user.id) ? (
                    <span className="btn-add-friend sent">Отправлено</span>
                  ) : (
                    <button
                      className="btn-add-friend"
                      onClick={() => handleAddFriend(user.id)}
                    >
                      Добавить
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
