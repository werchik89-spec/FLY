import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsPanel from './components/SettingsPanel';
import NewChatModal from './components/NewChatModal';
import ProfilePanel from './components/ProfilePanel';

const App: React.FC = () => {
  const store = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.settings.theme);
    document.documentElement.setAttribute('data-font-size', store.settings.fontSize);
  }, [store.settings.theme, store.settings.fontSize]);

  return (
    <div className="app-container">
      {store.settings.focusMode && (
        <div className="focus-banner">
          <span>🎯 Режим Фокус активен — уведомления отключены</span>
          <button onClick={() => store.setSettings({ focusMode: false })}>
            Выключить
          </button>
        </div>
      )}

      <Sidebar store={store} />

      <ChatArea store={store} />

      {store.showProfile && store.activeChat && (
        <ProfilePanel store={store} />
      )}

      {store.showSettings && <SettingsPanel store={store} />}

      {store.showNewChat && <NewChatModal store={store} />}
    </div>
  );
};

export default App;
