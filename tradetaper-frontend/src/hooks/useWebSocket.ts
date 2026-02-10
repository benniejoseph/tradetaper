"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Derive WebSocket URL from API URL (remove /api/v1 suffix if present)
// Force cache bust: 2026-02-10T05:08:00Z
const getWebSocketURL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  // Remove /api/v1 suffix and replace http with ws
  const wsUrl = apiUrl.replace('/api/v1', '').replace('https://', 'wss://').replace('http://', 'ws://');
  return wsUrl;
};

const WEBSOCKET_URL = getWebSocketURL();

interface UseWebSocketOptions {
  autoConnect?: boolean;
  namespace?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketState {
  isConnected: boolean;
  socket: Socket | null;
  error: Error | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, namespace, onConnect, onDisconnect, onError } = options;
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    socket: null,
    error: null,
  });
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Add namespace to URL if provided
    const socketUrl = namespace ? `${WEBSOCKET_URL}${namespace}` : WEBSOCKET_URL;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket.id);
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setState((prev) => ({ ...prev, isConnected: false }));
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      setState((prev) => ({ ...prev, error, isConnected: false }));
      onError?.(error);
    });

    setState((prev) => ({ ...prev, socket }));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, namespace, onConnect, onDisconnect, onError]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    }
    return () => {};
  }, []);

  return {
    ...state,
    emit,
    subscribe,
    connect: () => socketRef.current?.connect(),
    disconnect: () => socketRef.current?.disconnect(),
  };
}

// Hook specifically for ICT real-time data
export function useICTRealtime(symbol: string = 'XAUUSD') {
  const { isConnected, subscribe, emit } = useWebSocket();
  const [killZonesData, setKillZonesData] = useState<unknown>(null);
  const [premiumDiscountData, setPremiumDiscountData] = useState<unknown>(null);
  const [powerOfThreeData, setPowerOfThreeData] = useState<unknown>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to ICT data channels
    const unsubKillZones = subscribe('ict:killzones', (data) => {
      setKillZonesData(data);
      setLastUpdate(new Date());
    });

    const unsubPremiumDiscount = subscribe('ict:premium-discount', (data) => {
      setPremiumDiscountData(data);
      setLastUpdate(new Date());
    });

    const unsubPowerOfThree = subscribe('ict:power-of-three', (data) => {
      setPowerOfThreeData(data);
      setLastUpdate(new Date());
    });

    // Subscribe to symbol
    emit('ict:subscribe', { symbol });

    return () => {
      unsubKillZones();
      unsubPremiumDiscount();
      unsubPowerOfThree();
      emit('ict:unsubscribe', { symbol });
    };
  }, [isConnected, symbol, subscribe, emit]);

  return {
    isConnected,
    killZonesData,
    premiumDiscountData,
    powerOfThreeData,
    lastUpdate,
  };
}
