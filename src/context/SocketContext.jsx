import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { alertSound, AudioAlertManager } from '../utils/audio';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUrgentAlert, setActiveUrgentAlert] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(alertSound.isMuted);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef(new Set());

  // Register listener for real-time feed updates
  const addSocketListener = (callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  };

  const notifyListeners = (data) => {
    listenersRef.current.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error('Error in socket listener:', err);
      }
    });
  };

  const connectSocket = () => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev Vite proxy routes /ws to backend:8000
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/notices${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[NoticePulse WS] Connected to Push Alert stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'URGENT_NOTICE_ALERT') {
            console.log('[NoticePulse WS] URGENT PUSH ALERT RECEIVED:', data);
            setActiveUrgentAlert(data.notice);
            // Play synthesized acoustic chime
            alertSound.playUrgentPing();
            // Trigger desktop notification
            AudioAlertManager.showDesktopNotification(
              data.notice.title,
              `${data.notice.department_tag} • ${data.notice.content.substring(0, 100)}...`
            );
          }

          // Relay all events to active views
          notifyListeners(data);
        } catch (err) {
          console.warn('[NoticePulse WS] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Exponential backoff reconnect
        reconnectTimeoutRef.current = setTimeout(connectSocket, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[NoticePulse WS] Connection error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[NoticePulse WS] Setup error:', err);
      reconnectTimeoutRef.current = setTimeout(connectSocket, 5000);
    }
  };

  useEffect(() => {
    connectSocket();

    // Heartbeat ping every 25s
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [token]);

  const toggleMute = () => {
    const muted = alertSound.toggleMute();
    setIsAudioMuted(muted);
    return muted;
  };

  const testAudioPing = () => {
    alertSound.playUrgentPing();
  };

  const dismissAlert = () => {
    setActiveUrgentAlert(null);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        activeUrgentAlert,
        dismissAlert,
        isAudioMuted,
        toggleMute,
        testAudioPing,
        addSocketListener
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
