import React from 'react';
import {
  ArrowLeft, Moon, Bell, Globe, Type, Keyboard,
  Shield, Palette, Eye, Clock, Languages,
} from 'lucide-react';
import Avatar from './Avatar';
import { Theme } from '../types';

interface SettingsPanelProps {
  store: ReturnType<typeof import('../store/useStore').useStore>;
}

const themes: { id: Theme; label: string; color: string; emoji: string }[] = [
  { id: 'light', label: 'Светлая', color: '#ffffff', emoji: '☀️' },
  { id: 'dark', label: 'Тёмная', color: '#17212b', emoji: '🌙' },
  { id: 'midnight', label: 'Полночь', color: '#1a1a2e', emoji: '🌌' },
  { id: 'emerald', label: 'Изумруд', color: '#1a2e1a', emoji: '🌿' },
  { id: 'sunset', label: 'Закат', color: '#2e1a1a', emoji: '🌅' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ store }) => {
  return (
    <div className="settings-overlay">
      <div
        className="settings-backdrop"
        onClick={() => store.setShowSettings(false)}
      />
      <div className="settings-panel">
        <div className="settings-header">
          <button
            className="back-btn"
            onClick={() => store.setShowSettings(false)}
          >
            <ArrowLeft size={22} />
          </button>
          <h2>Настройки</h2>
        </div>

        <div className="settings-profile">
          <Avatar
            name={store.currentUser.name}
            color="#3390ec"
            size={80}
            fontSize={32}
          />
          <div className="settings-user-name">{store.currentUser.name}</div>
          <div className="settings-username">@{store.currentUser.username}</div>
          {store.currentUser.phone && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {store.currentUser.phone}
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="settings-section">
          <div className="settings-section-title">Оформление</div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Palette size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Тема оформления</div>
            </div>
          </div>

          <div className="theme-options">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-option ${store.settings.theme === theme.id ? 'active' : ''}`}
                style={{ background: theme.color }}
                onClick={() => store.setSettings({ theme: theme.id })}
                title={theme.label}
              >
                {theme.emoji}
              </button>
            ))}
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Type size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Размер шрифта</div>
              <div className="settings-item-desc">
                {store.settings.fontSize === 'small'
                  ? 'Маленький'
                  : store.settings.fontSize === 'large'
                  ? 'Большой'
                  : 'Средний'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => store.setSettings({ fontSize: size })}
                  style={{
                    padding: '4px 10px',
                    border: `1px solid ${store.settings.fontSize === size ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                    background:
                      store.settings.fontSize === size
                        ? 'var(--accent-light)'
                        : 'transparent',
                    color:
                      store.settings.fontSize === size
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
                  }}
                >
                  А
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-title">Уведомления</div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Bell size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Уведомления</div>
              <div className="settings-item-desc">
                {store.settings.notifications ? 'Включены' : 'Выключены'}
              </div>
            </div>
            <button
              className={`toggle-switch ${store.settings.notifications ? 'active' : ''}`}
              onClick={() =>
                store.setSettings({
                  notifications: !store.settings.notifications,
                })
              }
            />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <span style={{ fontSize: 18 }}>🔊</span>
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Звуки</div>
              <div className="settings-item-desc">
                {store.settings.soundEnabled ? 'Включены' : 'Выключены'}
              </div>
            </div>
            <button
              className={`toggle-switch ${store.settings.soundEnabled ? 'active' : ''}`}
              onClick={() =>
                store.setSettings({
                  soundEnabled: !store.settings.soundEnabled,
                })
              }
            />
          </div>
        </div>

        {/* Features */}
        <div className="settings-section">
          <div className="settings-section-title">Функции</div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Languages size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Автоперевод сообщений</div>
              <div className="settings-item-desc">
                Автоматически переводить входящие сообщения
              </div>
            </div>
            <button
              className={`toggle-switch ${store.settings.autoTranslate ? 'active' : ''}`}
              onClick={() =>
                store.setSettings({
                  autoTranslate: !store.settings.autoTranslate,
                })
              }
            />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Eye size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Режим Фокус</div>
              <div className="settings-item-desc">
                Скрыть уведомления и значки непрочитанных
              </div>
            </div>
            <button
              className={`toggle-switch ${store.settings.focusMode ? 'active' : ''}`}
              onClick={() =>
                store.setSettings({ focusMode: !store.settings.focusMode })
              }
            />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Keyboard size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Отправка по Enter</div>
              <div className="settings-item-desc">
                {store.settings.sendByEnter
                  ? 'Enter отправляет, Shift+Enter — новая строка'
                  : 'Ctrl+Enter отправляет'}
              </div>
            </div>
            <button
              className={`toggle-switch ${store.settings.sendByEnter ? 'active' : ''}`}
              onClick={() =>
                store.setSettings({
                  sendByEnter: !store.settings.sendByEnter,
                })
              }
            />
          </div>
        </div>

        {/* Privacy */}
        <div className="settings-section">
          <div className="settings-section-title">Конфиденциальность</div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Shield size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">
                Конфиденциальность и безопасность
              </div>
              <div className="settings-item-desc">
                Номер телефона, последний визит, фото
              </div>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Clock size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-label">Активные сессии</div>
              <div className="settings-item-desc">1 устройство</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="settings-section">
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginBottom: 4,
              }}
            >
              Nexus Messenger v1.0.0
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Создано с ❤️
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
