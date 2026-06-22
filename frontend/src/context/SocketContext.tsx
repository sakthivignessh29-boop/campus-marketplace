import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { Message, Notification } from '../types';
import api, { API_BASE_URL } from '../services/api';

interface SocketContextType {
  isConnected: boolean;
  messages: Message[];
  notifications: Notification[];
  sendMessage: (receiverId: number, content: string, productId?: number, imageUrl?: string) => void;
  clearMessages: () => void;
  markNotificationsAsRead: (type: 'ALL_NON_MESSAGES' | 'NEW_MESSAGE') => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const response = await api.get('/api/notifications');
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to load notifications history', err);
      }
    };
    loadNotifications();
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) {
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = `${API_BASE_URL}/ws`;
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // Debug logger
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      setIsConnected(true);
      console.log('Connected to Stomp Broker!');

      client.subscribe('/user/queue/messages', (msg) => {
        if (msg.body) {
          const newMsg: Message = JSON.parse(msg.body);
          setMessages((prev) => [...prev, newMsg]);
        }
      });

      client.subscribe('/user/queue/notifications', (notification) => {
        if (notification.body) {
          const newNotification: Notification = JSON.parse(notification.body);
          setNotifications((prev) => [newNotification, ...prev]);
        }
      });
    };

    client.onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from Stomp Broker!');
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [user, token]);

  const sendMessage = (receiverId: number, content: string, productId?: number, imageUrl?: string) => {
    if (stompClient && isConnected) {
      const payload = {
        receiverId,
        content,
        productId,
        imageUrl,
      };
      stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload),
      });
    } else {
      console.warn('STOMP client is not connected!');
    }
  };

  const markNotificationsAsRead = async (type: 'ALL_NON_MESSAGES' | 'NEW_MESSAGE') => {
    try {
      if (type === 'ALL_NON_MESSAGES') {
        await api.post('/api/notifications/read-non-messages');
        setNotifications((prev) =>
          prev.map((n) => (n.type !== 'NEW_MESSAGE' ? { ...n, isRead: true } : n))
        );
      } else {
        await api.post('/api/notifications/read-type/NEW_MESSAGE');
        setNotifications((prev) =>
          prev.map((n) => (n.type === 'NEW_MESSAGE' ? { ...n, isRead: true } : n))
        );
      }
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <SocketContext.Provider value={{
      isConnected,
      messages,
      notifications,
      sendMessage,
      clearMessages,
      markNotificationsAsRead,
    }}>
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
