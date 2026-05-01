import React, { useState, useRef, useEffect } from 'react';
import type { Message, User, Chat } from '../types';
import { formatTime, formatDate } from '../utils/helpers';

interface ChatAreaProps {
  chat: Chat | undefined;
  messages: Message[];
  currentUser: User;
  isOnline: boolean;
  isTyping: boolean;
  onSendMessage: (text: string, replyTo?: string) => void;
  onEditMessage: (id: string, text: string) => void;
  onDeleteMessage: (id: string) => void;
  onMarkAsRead: (chatId: string) => void;
  onStartTyping: (chatId: string) => void;
  onCall: (userId: string, type: 'voice' | 'video') => void;
  onShowProfile: () => void;
}

export default function ChatArea({
  chat,
  messages,
  currentUser,
  isOnline,
  isTyping,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onMarkAsRead,
  onStartTyping,
  onCall,
  onShowProfile,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chat) {
      onMarkAsRead(chat.id);
    }
  }, [chat?.id, messages.length]);

  useEffect(() => {
    setContextMenu(null);
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  if (!chat) {
    return (
      <div className="chat-area">
        <div className="chat-area-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Выберите чат для начала общения</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    if (editingMessage) {
      onEditMessage(editingMessage.id, text);
      setEditingMessage(null);
    } else {
      onSendMessage(text, replyTo?.id);
      setReplyTo(null);
    }
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    onStartTyping(chat.id);
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusIcon = (status: string, isOwn: boolean) => {
    if (!isOwn) return null;
    if (status === 'sent') return '✓';
    if (status === 'delivered') return '✓✓';
    if (status === 'read') return <span className="message-status read">✓✓</span>;
    return null;
  };

  // Group messages by date
  let lastDate = '';

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info" style={{ cursor: 'pointer' }} onClick={onShowProfile}>
          <div className="chat-header-avatar">
            {chat.friend.avatar ? (
              <img src={chat.friend.avatar} alt="" />
            ) : (
              getInitials(chat.friend.displayName)
            )}
          </div>
          <div className="chat-header-details">
            <h3>{chat.friend.displayName}</h3>
            <span className={`status ${isOnline ? 'online' : ''}`}>
              {isTyping ? 'печатает...' : isOnline ? 'в сети' : `был(а) ${formatTime(chat.friend.lastSeen)}`}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={() => onCall(chat.friend.id, 'voice')} title="Голосовой звонок">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={() => onCall(chat.friend.id, 'video')} title="Видеозвонок">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.id;
          const msgDate = formatDate(msg.timestamp);
          let showDate = false;
          if (msgDate !== lastDate) {
            lastDate = msgDate;
            showDate = true;
          }

          const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="date-separator">
                  <span>{msgDate}</span>
                </div>
              )}
              <div
                className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                onContextMenu={e => handleContextMenu(e, msg)}
              >
                <div className="message-bubble">
                  {replyMsg && (
                    <div className="message-reply">
                      {replyMsg.text.slice(0, 60)}{replyMsg.text.length > 60 ? '...' : ''}
                    </div>
                  )}
                  {msg.text}
                  <div className="message-actions">
                    <button
                      className="message-action-btn"
                      onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                      title="Ответить"
                    >
                      ↩
                    </button>
                    {isOwn && (
                      <>
                        <button
                          className="message-action-btn"
                          onClick={() => { setEditingMessage(msg); setInput(msg.text); inputRef.current?.focus(); }}
                          title="Редактировать"
                        >
                          ✏
                        </button>
                        <button
                          className="message-action-btn"
                          onClick={() => onDeleteMessage(msg.id)}
                          title="Удалить"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="message-meta">
                  {msg.edited && <span className="message-edited">ред.</span>}
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                  {isOwn && <span className="message-status">{getStatusIcon(msg.status, isOwn)}</span>}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isTyping && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span /><span /><span />
          </div>
          {chat.friend.displayName} печатает
        </div>
      )}

      <div className="message-input-container">
        {replyTo && (
          <div className="message-reply-preview">
            <span className="reply-text">↩ {replyTo.text.slice(0, 50)}</span>
            <button className="icon-btn" onClick={() => setReplyTo(null)} style={{ width: 24, height: 24 }}>
              ✕
            </button>
          </div>
        )}
        {editingMessage && (
          <div className="message-reply-preview">
            <span className="reply-text">✏ Редактирование: {editingMessage.text.slice(0, 50)}</span>
            <button className="icon-btn" onClick={() => { setEditingMessage(null); setInput(''); }} style={{ width: 24, height: 24 }}>
              ✕
            </button>
          </div>
        )}
        <div className="message-input-row">
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder="Напишите сообщение..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              setReplyTo(contextMenu.message);
              setContextMenu(null);
              inputRef.current?.focus();
            }}
          >
            ↩ Ответить
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.message.text);
              setContextMenu(null);
            }}
          >
            📋 Копировать
          </button>
          {contextMenu.message.senderId === currentUser.id && (
            <>
              <button
                className="context-menu-item"
                onClick={() => {
                  setEditingMessage(contextMenu.message);
                  setInput(contextMenu.message.text);
                  setContextMenu(null);
                  inputRef.current?.focus();
                }}
              >
                ✏ Редактировать
              </button>
              <button
                className="context-menu-item danger"
                onClick={() => {
                  onDeleteMessage(contextMenu.message.id);
                  setContextMenu(null);
                }}
              >
                🗑 Удалить
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
