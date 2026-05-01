import React from 'react';
import {
  X, Phone, AtSign, Info, Bell, BellOff, Trash2, Archive,
} from 'lucide-react';
import Avatar from './Avatar';
import { formatLastSeen } from '../utils/helpers';

interface ProfilePanelProps {
  store: ReturnType<typeof import('../store/useStore').useStore>;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ store }) => {
  const chat = store.activeChat;
  if (!chat) return null;

  const otherUserId = chat.members.find((id) => id !== 'me');
  const user = store.users.find((u) => u.id === otherUserId);

  const displayUser = chat.type === 'private' && user ? user : null;
  const isGroup = chat.type === 'group';
  const isChannel = chat.type === 'channel';

  return (
    <div className="profile-panel">
      <div className="settings-header">
        <button
          className="back-btn"
          onClick={() => store.setShowProfile(false)}
        >
          <X size={22} />
        </button>
        <h2>
          {isGroup
            ? 'Информация о группе'
            : isChannel
            ? 'Информация о канале'
            : 'Профиль'}
        </h2>
      </div>

      <div
        className="profile-header-bg"
        style={{
          background: `linear-gradient(135deg, ${chat.avatar}, ${chat.avatar}88)`,
        }}
      >
        <div
          className="profile-avatar-lg"
          style={{ background: chat.avatar }}
        >
          <Avatar
            name={chat.name}
            color={chat.avatar}
            size={72}
            fontSize={28}
          />
        </div>
      </div>

      <div className="profile-info">
        <h3>{chat.name}</h3>
        {displayUser && (
          <>
            <div className="username">@{displayUser.username}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {displayUser.status === 'online' ? (
                <span style={{ color: 'var(--green)' }}>в сети</span>
              ) : displayUser.lastSeen ? (
                formatLastSeen(displayUser.lastSeen)
              ) : (
                displayUser.status === 'recently'
                  ? 'был(а) недавно'
                  : 'не в сети'
              )}
            </div>
          </>
        )}
        {isGroup && (
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {chat.members.length} участников
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="profile-section">
        <div className="profile-section-title">Информация</div>

        {displayUser?.bio && (
          <div className="profile-field">
            <Info size={20} className="profile-field-icon" />
            <div className="profile-field-content">
              <div className="profile-field-label">О себе</div>
              <div className="profile-field-value">{displayUser.bio}</div>
            </div>
          </div>
        )}

        {displayUser?.phone && (
          <div className="profile-field">
            <Phone size={20} className="profile-field-icon" />
            <div className="profile-field-content">
              <div className="profile-field-label">Телефон</div>
              <div className="profile-field-value">{displayUser.phone}</div>
            </div>
          </div>
        )}

        {displayUser?.username && (
          <div className="profile-field">
            <AtSign size={20} className="profile-field-icon" />
            <div className="profile-field-content">
              <div className="profile-field-label">Имя пользователя</div>
              <div className="profile-field-value">@{displayUser.username}</div>
            </div>
          </div>
        )}

        {(isGroup || isChannel) && chat.description && (
          <div className="profile-field">
            <Info size={20} className="profile-field-icon" />
            <div className="profile-field-content">
              <div className="profile-field-label">Описание</div>
              <div className="profile-field-value">{chat.description}</div>
            </div>
          </div>
        )}
      </div>

      {/* Group members */}
      {isGroup && (
        <div className="profile-section">
          <div className="profile-section-title">
            Участники ({chat.members.length})
          </div>
          {chat.members.map((memberId) => {
            const member =
              memberId === 'me'
                ? store.currentUser
                : store.users.find((u) => u.id === memberId);
            if (!member) return null;
            const isAdmin = chat.adminIds?.includes(memberId);

            return (
              <div key={memberId} className="contact-item">
                <Avatar
                  name={member.name}
                  color={
                    memberId === 'me' ? '#3390ec' : (member as any).avatar || '#999'
                  }
                  size={40}
                  online={member.status === 'online'}
                />
                <div className="contact-info">
                  <div className="contact-name">
                    {member.name}
                    {isAdmin && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--accent)',
                          marginLeft: 8,
                          fontWeight: 500,
                        }}
                      >
                        админ
                      </span>
                    )}
                  </div>
                  <div
                    className={`contact-status ${member.status === 'online' ? 'online' : ''}`}
                  >
                    {member.status === 'online' ? 'в сети' : 'не в сети'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="profile-section">
        <div
          className="settings-item"
          onClick={() => store.toggleMuteChat(chat.id)}
        >
          <div className="settings-item-icon">
            {chat.isMuted ? <Bell size={20} /> : <BellOff size={20} />}
          </div>
          <div className="settings-item-content">
            <div className="settings-item-label">
              {chat.isMuted ? 'Включить уведомления' : 'Отключить уведомления'}
            </div>
          </div>
        </div>

        <div
          className="settings-item"
          onClick={() => store.archiveChat(chat.id)}
        >
          <div className="settings-item-icon">
            <Archive size={20} />
          </div>
          <div className="settings-item-content">
            <div className="settings-item-label">Архивировать</div>
          </div>
        </div>

        <div
          className="settings-item"
          onClick={() => {
            store.deleteChat(chat.id);
            store.setShowProfile(false);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="settings-item-icon" style={{ color: 'var(--red)' }}>
            <Trash2 size={20} />
          </div>
          <div className="settings-item-content">
            <div className="settings-item-label" style={{ color: 'var(--red)' }}>
              Удалить чат
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;
