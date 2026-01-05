"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UseWebSocketOptions {
  autoConnect?: boolean;
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
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    socket: null,
    error: null,
  });
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(WEBSOCKET_URL, {
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
  }, [autoConnect, onConnect, onDisconnect, onError]);

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
