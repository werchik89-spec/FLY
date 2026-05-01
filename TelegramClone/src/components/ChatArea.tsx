import React, { useState, useRef, useEffect } from 'react';
import type { Message, User, Chat, FileAttachment } from '../types';
import { formatTime, formatDate } from '../utils/helpers';

interface ChatAreaProps {
  chat: Chat | undefined;
  messages: Message[];
  currentUser: User;
  isOnline: boolean;
  isTyping: boolean;
  pinnedMessage?: Message;
  chats: Chat[];
  onSendMessage: (text: string, replyTo?: string, file?: FileAttachment, voice?: { url: string; duration: number }) => void;
  onEditMessage: (id: string, text: string) => void;
  onDeleteMessage: (id: string) => void;
  onPinMessage: (id: string) => void;
  onUnpinMessage: () => void;
  onForwardMessage: (messageId: string, toChatId: string) => void;
  onSearchMessages: (query: string) => void;
  searchResults: Message[];
  onMarkAsRead: (chatId: string) => void;
  onStartTyping: (chatId: string) => void;
  onCall: (userId: string, type: 'voice' | 'video') => void;
  onShowProfile: () => void;
  onUploadFile: (file: File) => Promise<FileAttachment>;
}

export default function ChatArea({
  chat,
  messages,
  currentUser,
  isOnline,
  isTyping,
  pinnedMessage,
  chats,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  onForwardMessage,
  onSearchMessages,
  searchResults,
  onMarkAsRead,
  onStartTyping,
  onCall,
  onShowProfile,
  onUploadFile,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!text && !uploading) return;

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await onUploadFile(file);
      onSendMessage('', undefined, attachment);
    } catch {
      alert('Ошибка загрузки файла');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      setRecordingDuration(0);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/upload`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: `voice_${Date.now()}.webm`,
                fileData: base64,
                fileType: 'audio/webm',
              }),
            });
            const data = await res.json();
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
            onSendMessage('', undefined, undefined, {
              url: `${serverUrl}${data.url}`,
              duration: recordingDuration,
            });
          } catch {
            alert('Ошибка отправки голосового сообщения');
          }
        };
        reader.readAsDataURL(blob);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setIsRecording(false);
      };

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
    } catch {
      alert('Нет доступа к микрофону');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearchMessages(query);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusIcon = (status: string, isOwn: boolean) => {
    if (!isOwn) return null;
    if (status === 'sent') return '\u2713';
    if (status === 'delivered') return '\u2713\u2713';
    if (status === 'read') return <span className="message-status read">{'\u2713\u2713'}</span>;
    return null;
  };

  const isImageFile = (file?: FileAttachment) => {
    return file && file.type.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatVoiceDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const chatTitle = chat.isGroup ? chat.groupName : chat.friend.displayName;
  const chatSubtitle = chat.isGroup
    ? `${chat.groupMembers?.length || 0} участников`
    : isTyping ? 'печатает...' : isOnline ? 'в сети' : `был(а) ${formatTime(chat.friend.lastSeen)}`;

  let lastDate = '';

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-info" style={{ cursor: 'pointer' }} onClick={onShowProfile}>
          <div className="chat-header-avatar">
            {chat.isGroup ? (
              <span className="group-avatar">{(chat.groupName || 'G')[0]}</span>
            ) : chat.friend.avatar ? (
              <img src={chat.friend.avatar} alt="" />
            ) : (
              getInitials(chat.friend.displayName)
            )}
          </div>
          <div className="chat-header-details">
            <h3>{chatTitle}</h3>
            <span className={`status ${isOnline ? 'online' : ''}`}>
              {chatSubtitle}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={() => setShowSearch(!showSearch)} title="Поиск">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          {!chat.isGroup && (
            <>
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
            </>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="chat-search-bar">
          <input
            type="text"
            placeholder="Поиск сообщений..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
          />
          {searchResults.length > 0 && <span className="search-count">{searchResults.length} найдено</span>}
          <button className="icon-btn" onClick={() => { setShowSearch(false); setSearchQuery(''); onSearchMessages(''); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {pinnedMessage && (
        <div className="pinned-message-bar" onClick={() => {
          const el = document.getElementById(`msg-${pinnedMessage.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
          </svg>
          <span>{pinnedMessage.text.slice(0, 60)}{pinnedMessage.text.length > 60 ? '...' : ''}</span>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onUnpinMessage(); }} style={{ width: 20, height: 20, marginLeft: 'auto' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      <div className="messages-container">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.id;
          const msgDate = formatDate(msg.timestamp);
          let showDateSep = false;
          if (msgDate !== lastDate) {
            lastDate = msgDate;
            showDateSep = true;
          }

          const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
          const isHighlighted = searchResults.some(r => r.id === msg.id);

          return (
            <React.Fragment key={msg.id}>
              {showDateSep && (
                <div className="date-separator">
                  <span>{msgDate}</span>
                </div>
              )}
              <div
                id={`msg-${msg.id}`}
                className={`message-wrapper ${isOwn ? 'own' : 'other'} ${isHighlighted ? 'highlighted' : ''} ${msg.pinned ? 'pinned' : ''}`}
                onContextMenu={e => handleContextMenu(e, msg)}
              >
                <div className="message-bubble">
                  {msg.forwardedFrom && (
                    <div className="message-forwarded">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
                      </svg>
                      Переслано от {msg.forwardedFrom}
                    </div>
                  )}
                  {replyMsg && (
                    <div className="message-reply">
                      {replyMsg.text.slice(0, 60)}{replyMsg.text.length > 60 ? '...' : ''}
                    </div>
                  )}

                  {msg.file && isImageFile(msg.file) && (
                    <div className="message-image" onClick={() => setPreviewImage(msg.file!.url)}>
                      <img src={msg.file.url} alt={msg.file.name} />
                    </div>
                  )}

                  {msg.file && !isImageFile(msg.file) && (
                    <a className="message-file" href={msg.file.url} download={msg.file.name} target="_blank" rel="noreferrer">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                      <div className="file-info">
                        <span className="file-name">{msg.file.name}</span>
                        <span className="file-size">{formatFileSize(msg.file.size)}</span>
                      </div>
                    </a>
                  )}

                  {msg.voice && (
                    <div className="message-voice">
                      <audio controls src={msg.voice.url} preload="metadata" />
                      <span className="voice-duration">{formatVoiceDuration(msg.voice.duration)}</span>
                    </div>
                  )}

                  {msg.text && <span className="message-text">{msg.text}</span>}

                  <div className="message-actions">
                    <button
                      className="message-action-btn"
                      onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                      title="Ответить"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                    </button>
                    <button
                      className="message-action-btn"
                      onClick={() => setForwardingMessage(msg)}
                      title="Переслать"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
                    </button>
                    {isOwn && (
                      <>
                        <button
                          className="message-action-btn"
                          onClick={() => { setEditingMessage(msg); setInput(msg.text); inputRef.current?.focus(); }}
                          title="Редактировать"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          className="message-action-btn"
                          onClick={() => onDeleteMessage(msg.id)}
                          title="Удалить"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="message-meta">
                  {msg.pinned && <span className="message-pinned-icon" title="Закреплено">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>
                  </span>}
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
          {chat.isGroup ? 'кто-то' : chat.friend.displayName} печатает
        </div>
      )}

      <div className="message-input-container">
        {replyTo && (
          <div className="message-reply-preview">
            <span className="reply-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
              {replyTo.text.slice(0, 50)}
            </span>
            <button className="icon-btn" onClick={() => setReplyTo(null)} style={{ width: 24, height: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        {editingMessage && (
          <div className="message-reply-preview">
            <span className="reply-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {editingMessage.text.slice(0, 50)}
            </span>
            <button className="icon-btn" onClick={() => { setEditingMessage(null); setInput(''); }} style={{ width: 24, height: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <div className="message-input-row">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.mp3,.mp4"
          />
          <button
            className="icon-btn attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить файл"
            disabled={uploading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder={uploading ? 'Загрузка файла...' : 'Напишите сообщение...'}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={uploading}
          />
          {input.trim() ? (
            <button className="send-btn" onClick={handleSend}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          ) : (
            <button
              className={`send-btn voice-btn ${isRecording ? 'recording' : ''}`}
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onMouseLeave={stopVoiceRecording}
              title={isRecording ? `Запись... ${formatVoiceDuration(recordingDuration)}` : 'Голосовое сообщение'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button className="context-menu-item" onClick={() => { setReplyTo(contextMenu.message); setContextMenu(null); inputRef.current?.focus(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            Ответить
          </button>
          <button className="context-menu-item" onClick={() => { setForwardingMessage(contextMenu.message); setContextMenu(null); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
            Переслать
          </button>
          <button className="context-menu-item" onClick={() => { onPinMessage(contextMenu.message.id); setContextMenu(null); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>
            Закрепить
          </button>
          <button className="context-menu-item" onClick={() => { navigator.clipboard.writeText(contextMenu.message.text); setContextMenu(null); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Копировать
          </button>
          {contextMenu.message.senderId === currentUser.id && (
            <>
              <button className="context-menu-item" onClick={() => { setEditingMessage(contextMenu.message); setInput(contextMenu.message.text); setContextMenu(null); inputRef.current?.focus(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Редактировать
              </button>
              <button className="context-menu-item danger" onClick={() => { onDeleteMessage(contextMenu.message.id); setContextMenu(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Удалить
              </button>
            </>
          )}
        </div>
      )}

      {forwardingMessage && (
        <div className="forward-modal-overlay" onClick={() => setForwardingMessage(null)}>
          <div className="forward-modal" onClick={e => e.stopPropagation()}>
            <h3>Переслать сообщение</h3>
            <p className="forward-preview">"{forwardingMessage.text.slice(0, 80)}{forwardingMessage.text.length > 80 ? '...' : ''}"</p>
            <div className="forward-chat-list">
              {chats.filter(c => c.id !== chat.id).map(c => (
                <button
                  key={c.id}
                  className="forward-chat-item"
                  onClick={() => {
                    onForwardMessage(forwardingMessage.id, c.id);
                    setForwardingMessage(null);
                  }}
                >
                  <div className="chat-header-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                    {c.isGroup ? (c.groupName || 'G')[0] : getInitials(c.friend.displayName)}
                  </div>
                  <span>{c.isGroup ? c.groupName : c.friend.displayName}</span>
                </button>
              ))}
              {chats.filter(c => c.id !== chat.id).length === 0 && (
                <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>Нет доступных чатов</p>
              )}
            </div>
            <button className="forward-cancel" onClick={() => setForwardingMessage(null)}>Отмена</button>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="" className="image-preview-full" />
          <button className="image-preview-close" onClick={() => setPreviewImage(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
