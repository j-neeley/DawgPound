import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import wsService from '../services/websocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socket = wsService.getSocket();

  useEffect(() => {
    if (user?.id) {
      wsService.connect(user.id);
    }

    return () => {
      if (!user) {
        wsService.disconnect();
      }
    };
  }, [user]);

  return (
    <WebSocketContext.Provider
      value={{
        socket: wsService.getSocket(),
        isConnected: socket?.connected || false,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
