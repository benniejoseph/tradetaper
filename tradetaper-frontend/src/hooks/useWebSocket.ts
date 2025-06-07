import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppDispatch } from '@/store/store';
import { addTrade, updateTradeRealtime, removeTrade, setTrades } from '@/store/features/tradesSlice';
import { Trade } from '@/types/trade';

interface UseWebSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { enabled = true, onConnect, onDisconnect, onError } = options;
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const backendUrl = 'https://tradetaper-backend-production.up.railway.app';
    // Convert HTTPS to WSS for WebSocket connections
    const websocketUrl = backendUrl.replace(/^http/, 'ws');
    
    socketRef.current = io(`${websocketUrl}/trades`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to trades WebSocket');
      onConnect?.();
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from trades WebSocket:', reason);
      onDisconnect?.();
      
      // Attempt to reconnect after a delay if still enabled
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to WebSocket...');
          connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      onError?.(error as Error);
    });

    socket.on('connection', (data) => {
      console.log('📡 WebSocket connection established:', data.message);
    });

    // Trade event handlers
    socket.on('trade:created', (trade: Trade) => {
      console.log('📈 New trade created:', trade);
      dispatch(addTrade(trade));
    });

    socket.on('trade:updated', (trade: Trade) => {
      console.log('📊 Trade updated:', trade);
      dispatch(updateTradeRealtime(trade));
    });

    socket.on('trade:deleted', (data: { id: string }) => {
      console.log('🗑️ Trade deleted:', data.id);
      dispatch(removeTrade(data.id));
    });

    socket.on('trades:bulk', (data: { operation: string; count: number; trades?: Trade[] }) => {
      console.log(`📦 Bulk operation: ${data.operation} (${data.count} trades)`);
      if (data.operation === 'import' && data.trades) {
        // Handle bulk import
        dispatch(setTrades(data.trades));
      }
      // Add more bulk operation handlers as needed
    });

  }, [dispatch, enabled, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    socket: socketRef.current,
  };
}; 