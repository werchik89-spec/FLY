import { useState } from 'react';
import { useStore } from './store/useStore';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import CallScreen from './components/CallScreen';

type View = 'chat' | 'settings' | 'profile';

export default function App() {
  const store = useStore();
  const [rightPanel, setRightPanel] = useState<'none' | 'profile'>('none');
  const [view, setView] = useState<View>('chat');

  if (!store.currentUser) {
    return (
      <AuthScreen
        onLogin={store.login}
        onRegister={store.register}
      />
    );
  }

  const activeChat = store.chats.find(c => c.id === store.activeChat);
  const chatMessages = store.activeChat
    ? (store.messages.get(store.activeChat) || [])
    : [];

  const handleSelectChat = (chatId: string) => {
    store.setActiveChat(chatId);
    setView('chat');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app">
      <Sidebar
        chats={store.chats}
        activeChat={store.activeChat}
        onSelectChat={handleSelectChat}
        onlineUsers={store.onlineUsers}
        currentUser={store.currentUser}
        friendRequests={store.friendRequests}
        onAcceptRequest={store.acceptFriendRequest}
        onRejectRequest={store.rejectFriendRequest}
        onSearchUsers={store.searchUsers}
        onSendFriendRequest={store.sendFriendRequest}
        onShowSettings={() => setView(view === 'settings' ? 'chat' : 'settings')}
        onShowProfile={() => setView(view === 'profile' ? 'chat' : 'profile')}
        onCreateGroup={store.createGroup}
      />

      {view === 'settings' ? (
        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-details">
                <h3>Настройки</h3>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setView('chat')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            <div className="my-profile">
              <div className="my-profile-avatar">
                {store.currentUser.avatar ? (
                  <img src={store.currentUser.avatar} alt="" />
                ) : (
                  getInitials(store.currentUser.displayName)
                )}
              </div>
              <div className="profile-form">
                <div>
                  <label>Имя</label>
                  <input type="text" value={store.currentUser.displayName} readOnly />
                </div>
                <div>
                  <label>Логин</label>
                  <input type="text" value={`@${store.currentUser.username}`} readOnly />
                </div>
                <div>
                  <label>О себе</label>
                  <textarea placeholder="Напишите о себе..." defaultValue={store.currentUser.bio} readOnly />
                </div>
                <div className="settings-section">
                  <label>Уведомления</label>
                  <button
                    className={`toggle-btn ${store.notifications ? 'active' : ''}`}
                    onClick={store.toggleNotifications}
                  >
                    {store.notifications ? 'Включены' : 'Выключены'}
                  </button>
                </div>
                <button className="btn-logout" onClick={store.logout}>
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : view === 'profile' ? (
        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-details">
                <h3>Мой профиль</h3>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setView('chat')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            <div className="my-profile">
              <div className="my-profile-avatar">
                {store.currentUser.avatar ? (
                  <img src={store.currentUser.avatar} alt="" />
                ) : (
                  getInitials(store.currentUser.displayName)
                )}
              </div>
              <div className="profile-form">
                <div>
                  <label>Имя</label>
                  <input type="text" value={store.currentUser.displayName} readOnly />
                </div>
                <div>
                  <label>Логин</label>
                  <input type="text" value={`@${store.currentUser.username}`} readOnly />
                </div>
                <div>
                  <label>ID</label>
                  <input type="text" value={store.currentUser.id} readOnly />
                </div>
                <div>
                  <label>Дата регистрации</label>
                  <input type="text" value={new Date(store.currentUser.createdAt).toLocaleDateString('ru-RU')} readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ChatArea
            chat={activeChat}
            messages={chatMessages}
            currentUser={store.currentUser}
            isOnline={activeChat ? store.onlineUsers.has(activeChat.friend.id) : false}
            isTyping={activeChat ? (store.typingUsers.get(activeChat.id) || false) : false}
            pinnedMessage={activeChat ? store.pinnedMessages.get(activeChat.id) : undefined}
            chats={store.chats}
            onSendMessage={store.sendMessage}
            onEditMessage={store.editMessage}
            onDeleteMessage={store.deleteMessage}
            onPinMessage={store.pinMessage}
            onUnpinMessage={store.unpinMessage}
            onForwardMessage={store.forwardMessage}
            onSearchMessages={store.searchMessages}
            searchResults={store.searchResults}
            onMarkAsRead={store.markAsRead}
            onStartTyping={store.startTyping}
            onCall={store.initiateCall}
            onShowProfile={() => setRightPanel(rightPanel === 'profile' ? 'none' : 'profile')}
            onUploadFile={store.uploadFile}
          />

          {rightPanel === 'profile' && activeChat && (
            <div className="profile-panel">
              <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="icon-btn" onClick={() => setRightPanel('none')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="profile-header">
                <div className="profile-avatar">
                  {activeChat.isGroup ? (
                    <span style={{ fontSize: 28 }}>{(activeChat.groupName || 'G')[0]}</span>
                  ) : activeChat.friend.avatar ? (
                    <img src={activeChat.friend.avatar} alt="" />
                  ) : (
                    getInitials(activeChat.friend.displayName)
                  )}
                </div>
                <div className="profile-name">
                  {activeChat.isGroup ? activeChat.groupName : activeChat.friend.displayName}
                </div>
                {!activeChat.isGroup && (
                  <div className="profile-username">@{activeChat.friend.username}</div>
                )}
                <div className={`profile-status ${!activeChat.isGroup && store.onlineUsers.has(activeChat.friend.id) ? 'online' : ''}`}>
                  {activeChat.isGroup
                    ? `${activeChat.groupMembers?.length || 0} участников`
                    : store.onlineUsers.has(activeChat.friend.id) ? 'В сети' : 'Не в сети'}
                </div>
              </div>
              {activeChat.isGroup && activeChat.groupMembers && (
                <div className="profile-section">
                  <div className="profile-section-title">Участники</div>
                  {activeChat.groupMembers.map(m => (
                    <div key={m.id} className="group-member-item">
                      <div className="member-avatar">{getInitials(m.displayName)}</div>
                      <span>{m.displayName}</span>
                      {store.onlineUsers.has(m.id) && <span className="member-online" />}
                    </div>
                  ))}
                </div>
              )}
              {!activeChat.isGroup && activeChat.friend.bio && (
                <div className="profile-section">
                  <div className="profile-section-title">О себе</div>
                  <div className="profile-bio">{activeChat.friend.bio}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CallScreen
        activeCall={store.activeCall}
        incomingCall={store.incomingCall}
        onAccept={store.acceptCall}
        onReject={store.rejectCall}
        onEnd={store.endCall}
        onToggleScreenShare={store.toggleScreenShare}
      />
    </div>
  );
}
