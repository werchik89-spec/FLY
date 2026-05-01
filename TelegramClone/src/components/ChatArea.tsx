import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Phone, MoreVertical, Send, Smile, Paperclip, Mic,
  Reply, Pencil, Trash2, Pin, SmilePlus, MessageSquare, ArrowLeft,
  Check, CheckCheck, X,
} from 'lucide-react';
import Avatar from './Avatar';
import ContextMenu from './ContextMenu';
import { formatMessageTime, formatDateSeparator, formatLastSeen } from '../utils/helpers';
import { Message } from '../types';

interface ChatAreaProps {
  store: ReturnType<typeof import('../store/useStore').useStore>;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

const ChatArea: React.FC<ChatAreaProps> = ({ store }) => {
  const [text, setText] = useState('');
  const [showQuickReactions, setShowQuickReactions] = useState<string | null>(null);
  const [msgContextMenu, setMsgContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [store.activeChatMessages, scrollToBottom]);

  useEffect(() => {
    if (store.editingMessage) {
      setText(store.editingMessage.text);
      inputRef.current?.focus();
    }
  }, [store.editingMessage]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !store.activeChatId) return;

    if (store.editingMessage) {
      store.editMessage(store.activeChatId, store.editingMessage.id, trimmed);
      setText('');
      return;
    }

    store.sendMessage(store.activeChatId, trimmed);
    setText('');
    store.setReplyToMessage(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (store.settings.sendByEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMsgContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setMsgContextMenu({ x: e.clientX, y: e.clientY, message: msg });
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <span className="message-status" style={{ fontSize: 11 }}>⏳</span>;
      case 'sent':
        return <Check size={14} className="message-status" />;
      case 'delivered':
        return <CheckCheck size={14} className="message-status" />;
      case 'read':
        return <CheckCheck size={14} className="message-status read" />;
      default:
        return null;
    }
  };

  const shouldShowDateSeparator = (messages: Message[], index: number): boolean => {
    if (index === 0) return true;
    const curr = new Date(messages[index].timestamp);
    const prev = new Date(messages[index - 1].timestamp);
    return curr.toDateString() !== prev.toDateString();
  };

  const getUserName = (userId: string): string => {
    if (userId === 'me') return 'Вы';
    const user = store.users.find((u) => u.id === userId);
    return user?.name || 'Неизвестный';
  };

  const getChatStatus = (): React.ReactNode => {
    if (!store.activeChat) return null;
    const chat = store.activeChat;

    if (chat.type === 'group') {
      return `${chat.members.length} участников`;
    }
    if (chat.type === 'channel') {
      return 'канал';
    }
    if (chat.type === 'saved') {
      return 'сохранённые сообщения';
    }

    const otherUserId = chat.members.find((id) => id !== 'me');
    const user = store.users.find((u) => u.id === otherUserId);
    if (!user) return '';

    if (user.status === 'online') {
      return <span className="chat-header-status online">в сети</span>;
    }
    if (user.lastSeen) {
      return formatLastSeen(user.lastSeen);
    }
    return user.status === 'recently' ? 'был(а) недавно' : 'не в сети';
  };

  if (!store.activeChat) {
    return (
      <div className="chat-area-empty">
        <div className="chat-area-empty-icon">
          <MessageSquare size={56} />
        </div>
        <h2>Nexus Messenger</h2>
        <p>Выберите чат, чтобы начать общение, или создайте новый</p>
      </div>
    );
  }

  const pinnedMessages = store.activeChatMessages.filter((m) => m.isPinned);

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        <button
          className="back-btn"
          onClick={() => store.setActiveChatId(null)}
          style={{ display: 'none' }}
        >
          <ArrowLeft size={22} />
        </button>

        <div
          onClick={() => store.setShowProfile(!store.showProfile)}
          style={{ cursor: 'pointer' }}
        >
          <Avatar
            name={store.activeChat.name}
            color={store.activeChat.avatar}
            size={42}
          />
        </div>

        <div
          className="chat-header-info"
          onClick={() => store.setShowProfile(!store.showProfile)}
        >
          <div className="chat-header-name">{store.activeChat.name}</div>
          <div className="chat-header-status">{getChatStatus()}</div>
        </div>

        <div className="chat-header-actions">
          <button className="header-action-btn" title="Поиск">
            <Search size={20} />
          </button>
          <button className="header-action-btn" title="Позвонить">
            <Phone size={20} />
          </button>
          <button className="header-action-btn" title="Ещё">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Pinned message bar */}
      {pinnedMessages.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Pin size={16} color="var(--accent)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              Закреплённое сообщение
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {pinnedMessages[pinnedMessages.length - 1].text}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container" ref={messagesContainerRef}>
        <div className="messages-list">
          {store.activeChatMessages.map((msg, index) => {
            const isOutgoing = msg.senderId === 'me';

            return (
              <React.Fragment key={msg.id}>
                {shouldShowDateSeparator(store.activeChatMessages, index) && (
                  <div className="message-date-separator">
                    <span>{formatDateSeparator(msg.timestamp)}</span>
                  </div>
                )}

                <div
                  className={`message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}
                  onContextMenu={(e) => handleMsgContextMenu(e, msg)}
                >
                  {/* Hover actions */}
                  <div className="message-hover-actions">
                    <button
                      className="msg-action-btn"
                      title="Реакция"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickReactions(
                          showQuickReactions === msg.id ? null : msg.id
                        );
                      }}
                    >
                      <SmilePlus size={16} />
                    </button>
                    <button
                      className="msg-action-btn"
                      title="Ответить"
                      onClick={() => store.setReplyToMessage(msg)}
                    >
                      <Reply size={16} />
                    </button>
                    {isOutgoing && (
                      <button
                        className="msg-action-btn"
                        title="Редактировать"
                        onClick={() => store.setEditingMessage(msg)}
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>

                  {/* Quick reactions popup */}
                  {showQuickReactions === msg.id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -40,
                        [isOutgoing ? 'right' : 'left']: 0,
                        background: 'var(--bg-primary)',
                        borderRadius: 20,
                        padding: '4px 8px',
                        display: 'flex',
                        gap: 2,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 20,
                      }}
                    >
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            store.addReaction(store.activeChatId!, msg.id, emoji);
                            setShowQuickReactions(null);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: 20,
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: 8,
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.transform = 'scale(1.3)';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.transform = 'scale(1)';
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="message-bubble">
                    {msg.isPinned && (
                      <div className="message-pinned-badge">
                        <Pin size={12} /> Закреплено
                      </div>
                    )}

                    {msg.replyTo && (
                      <div
                        style={{
                          padding: '4px 8px',
                          marginBottom: 4,
                          borderLeft: '2px solid var(--accent)',
                          borderRadius: 4,
                          background: 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--accent)',
                            fontWeight: 600,
                          }}
                        >
                          {getUserName(msg.replyTo)}
                        </div>
                      </div>
                    )}

                    {!isOutgoing &&
                      store.activeChat?.type === 'group' && (
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-link)',
                            marginBottom: 2,
                          }}
                        >
                          {getUserName(msg.senderId)}
                        </div>
                      )}

                    {msg.isVoice ? (
                      <div className="voice-message">
                        <button className="voice-play-btn">▶</button>
                        <div className="voice-waveform">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="voice-bar"
                              style={{
                                height: `${4 + Math.random() * 20}px`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="voice-duration">
                          {msg.voiceDuration
                            ? `${Math.floor(msg.voiceDuration / 60)}:${(
                                msg.voiceDuration % 60
                              )
                                .toString()
                                .padStart(2, '0')}`
                            : '0:00'}
                        </span>
                      </div>
                    ) : (
                      <span className="message-text">{msg.text}</span>
                    )}

                    <span className="message-meta">
                      {msg.edited && (
                        <span className="message-edited">ред.</span>
                      )}
                      <span className="message-time">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                      {isOutgoing && getStatusIcon(msg.status)}
                    </span>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="message-reactions">
                        {Object.entries(
                          msg.reactions.reduce(
                            (acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>
                          )
                        ).map(([emoji, count]) => {
                          const isMine = msg.reactions?.some(
                            (r) => r.emoji === emoji && r.userId === 'me'
                          );
                          return (
                            <button
                              key={emoji}
                              className={`reaction-chip ${isMine ? 'mine' : ''}`}
                              onClick={() =>
                                store.addReaction(
                                  store.activeChatId!,
                                  msg.id,
                                  emoji
                                )
                              }
                            >
                              <span>{emoji}</span>
                              {count > 1 && (
                                <span className="reaction-count">{count}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="input-area">
        {(store.replyToMessage || store.editingMessage) && (
          <div className="reply-preview" style={{ maxWidth: 768, margin: '0 auto 8px' }}>
            <div style={{ color: 'var(--accent)' }}>
              {store.editingMessage ? (
                <Pencil size={18} />
              ) : (
                <Reply size={18} />
              )}
            </div>
            <div className="reply-preview-content">
              <div className="reply-preview-name">
                {store.editingMessage
                  ? 'Редактирование'
                  : getUserName(store.replyToMessage!.senderId)}
              </div>
              <div className="reply-preview-text">
                {(store.editingMessage || store.replyToMessage)?.text}
              </div>
            </div>
            <button
              className="reply-close-btn"
              onClick={() => {
                store.setReplyToMessage(null);
                store.setEditingMessage(null);
                setText('');
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="input-container">
          <div className="input-actions">
            <button
              className={`input-btn ${showEmojiPicker ? 'active' : ''}`}
              title="Эмодзи"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={22} />
            </button>
          </div>

          <div className="text-input-wrapper">
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius)',
                    padding: 12,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 4,
                    maxHeight: 300,
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {[
                    '😀','😃','😄','😁','😆','😅','🤣','😂',
                    '🙂','🙃','😉','😊','😇','🥰','😍','🤩',
                    '😘','😗','😚','😙','🥲','😋','😛','😜',
                    '🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐',
                    '🤨','😐','😑','😶','😏','😒','🙄','😬',
                    '😮','😯','😲','😳','🥺','😦','😧','😨',
                    '😰','😥','😢','😭','😱','😖','😣','😞',
                    '😓','😩','😫','🥱','😤','😡','😠','🤬',
                    '👍','👎','👋','✌️','🤞','🤟','🤘','👌',
                    '🤌','🤏','👈','👉','👆','👇','☝️','✊',
                    '👏','🙌','👐','🤲','🤝','🙏','💪','🦾',
                    '❤️','🧡','💛','💚','💙','💜','🖤','🤍',
                    '💯','💥','🔥','⭐','🌟','✨','💫','🎉',
                    '🎊','🎈','🎁','🏆','🥇','🏅','🎯','🎮',
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setText((prev) => prev + emoji);
                        inputRef.current?.focus();
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 24,
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 6,
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              ref={inputRef}
              className="text-input"
              placeholder="Написать сообщение..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
              onClick={() => setShowEmojiPicker(false)}
            />
          </div>

          <div className="input-actions">
            <button className="input-btn" title="Прикрепить файл">
              <Paperclip size={22} />
            </button>
          </div>

          {text.trim() ? (
            <button className="send-btn" onClick={handleSend} title="Отправить">
              <Send size={18} />
            </button>
          ) : (
            <button className="send-btn" title="Голосовое сообщение">
              <Mic size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Message context menu */}
      {msgContextMenu && (
        <ContextMenu
          x={msgContextMenu.x}
          y={msgContextMenu.y}
          onClose={() => setMsgContextMenu(null)}
          items={[
            {
              label: 'Ответить',
              icon: '↩️',
              onClick: () => {
                store.setReplyToMessage(msgContextMenu.message);
                setMsgContextMenu(null);
              },
            },
            ...(msgContextMenu.message.senderId === 'me'
              ? [
                  {
                    label: 'Редактировать',
                    icon: '✏️',
                    onClick: () => {
                      store.setEditingMessage(msgContextMenu.message);
                      setMsgContextMenu(null);
                    },
                  },
                ]
              : []),
            {
              label: msgContextMenu.message.isPinned
                ? 'Открепить'
                : 'Закрепить',
              icon: '📌',
              onClick: () => {
                store.togglePin(
                  store.activeChatId!,
                  msgContextMenu.message.id
                );
                setMsgContextMenu(null);
              },
            },
            {
              label: 'Копировать',
              icon: '📋',
              onClick: () => {
                navigator.clipboard.writeText(msgContextMenu.message.text);
                setMsgContextMenu(null);
              },
            },
            { separator: true },
            {
              label: 'Удалить',
              icon: '🗑️',
              danger: true,
              onClick: () => {
                store.deleteMessage(
                  store.activeChatId!,
                  msgContextMenu.message.id
                );
                setMsgContextMenu(null);
              },
            },
          ]}
        />
      )}
    </div>
  );
};

export default ChatArea;
