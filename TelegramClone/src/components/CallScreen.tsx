import { useState, useEffect } from 'react';
import type { User, IncomingCall } from '../types';

interface CallScreenProps {
  activeCall: { callId: string; user: User; callType: string; screenSharing?: boolean } | null;
  incomingCall: IncomingCall | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleScreenShare: () => void;
}

export default function CallScreen({ activeCall, incomingCall, onAccept, onReject, onEnd, onToggleScreenShare }: CallScreenProps) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    if (activeCall) {
      const interval = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
    setDuration(0);
  }, [activeCall?.callId]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (incomingCall) {
    return (
      <div className="call-overlay">
        <div className="call-screen-bg" />
        <div className="call-avatar pulse-ring">
          {incomingCall.caller.avatar ? (
            <img src={incomingCall.caller.avatar} alt="" />
          ) : (
            getInitials(incomingCall.caller.displayName)
          )}
        </div>
        <div className="call-name">{incomingCall.caller.displayName}</div>
        <div className="call-status">
          {incomingCall.callType === 'video' ? 'Видеозвонок' : 'Голосовой звонок'}
        </div>
        <div className="call-actions">
          <button className="call-btn reject" onClick={onReject} title="Отклонить">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button className="call-btn accept" onClick={onAccept} title="Принять">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (activeCall) {
    return (
      <div className="call-overlay">
        <div className="call-screen-bg" />
        {activeCall.screenSharing && (
          <div className="screen-share-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Демонстрация экрана
          </div>
        )}
        <div className="call-avatar">
          {activeCall.user.avatar ? (
            <img src={activeCall.user.avatar} alt="" />
          ) : (
            getInitials(activeCall.user.displayName)
          )}
        </div>
        <div className="call-name">{activeCall.user.displayName}</div>
        <div className="call-timer">{formatDuration(duration)}</div>
        <div className="call-type-label">
          {activeCall.callType === 'video' ? 'Видеозвонок' : 'Голосовой звонок'}
        </div>
        <div className="call-actions">
          <button className={`call-btn secondary ${muted ? 'active' : ''}`} onClick={() => setMuted(!muted)} title={muted ? 'Включить микрофон' : 'Выключить микрофон'}>
            {muted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          {activeCall.callType === 'video' && (
            <button className={`call-btn secondary ${videoOff ? 'active' : ''}`} onClick={() => setVideoOff(!videoOff)} title={videoOff ? 'Включить камеру' : 'Выключить камеру'}>
              {videoOff ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              )}
            </button>
          )}
          <button className={`call-btn secondary ${activeCall.screenSharing ? 'active' : ''}`} onClick={onToggleScreenShare} title="Демонстрация экрана">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button className="call-btn reject" onClick={onEnd} title="Завершить">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
