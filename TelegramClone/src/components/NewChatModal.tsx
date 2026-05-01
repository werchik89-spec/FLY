import React, { useState } from 'react';
import { X } from 'lucide-react';
import Avatar from './Avatar';

interface NewChatModalProps {
  store: ReturnType<typeof import('../store/useStore').useStore>;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ store }) => {
  const [search, setSearch] = useState('');

  const filteredUsers = store.users.filter(
    (u) =>
      u.id !== 'me' &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={() => store.setShowNewChat(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Новый чат</h3>
          <button
            className="back-btn"
            onClick={() => store.setShowNewChat(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Поиск контактов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="contact-item"
              onClick={() => store.createChat(user.id)}
            >
              <Avatar
                name={user.name}
                color={user.avatar}
                size={44}
                online={user.status === 'online'}
              />
              <div className="contact-info">
                <div className="contact-name">{user.name}</div>
                <div
                  className={`contact-status ${user.status === 'online' ? 'online' : ''}`}
                >
                  {user.status === 'online'
                    ? 'в сети'
                    : user.status === 'recently'
                    ? 'был(а) недавно'
                    : 'не в сети'}
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              Контакты не найдены
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
