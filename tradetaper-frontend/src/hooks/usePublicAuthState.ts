'use client';

import { useEffect, useState } from 'react';
import type { UserResponseDto } from '@/types/user';
import { initializeClientObservability } from '@/lib/observability/client';
import { captureBillingAttributionFromLocation } from '@/lib/billingAttribution';
import {
  markPublicAuthHintAnonymous,
  markPublicAuthHintAuthenticated,
  readPublicAuthHint,
} from '@/lib/publicAuthHint';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1').trim();

type PublicAuthState = {
  isAuthenticated: boolean;
  user: UserResponseDto | null;
  loading: boolean;
};

type PublicAuthFetchMode = 'eager' | 'idle' | 'off';

type UsePublicAuthStateOptions = {
  fetchMode?: PublicAuthFetchMode;
  idleDelayMs?: number;
};

const DEFAULT_STATE: PublicAuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};
const DEFAULT_IDLE_DELAY_MS = 1200;

export function usePublicAuthState(
  options: UsePublicAuthStateOptions = {},
): PublicAuthState {
  const {
    fetchMode = 'eager',
    idleDelayMs = DEFAULT_IDLE_DELAY_MS,
  } = options;
  const [state, setState] = useState<PublicAuthState>({
    ...DEFAULT_STATE,
    loading: fetchMode === 'eager',
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    initializeClientObservability();
    captureBillingAttributionFromLocation();

    const authHint = readPublicAuthHint();
    if (authHint === 'anon') {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    if (fetchMode === 'off') {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    const loadAuthState = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          markPublicAuthHintAnonymous();
          setState({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
          return;
        }

        const user = (await response.json()) as UserResponseDto;
        markPublicAuthHintAuthenticated();
        setState({
          isAuthenticated: true,
          user,
          loading: false,
        });
      } catch {
        if (!isMounted || controller.signal.aborted) {
          return;
        }
        markPublicAuthHintAnonymous();
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    if (fetchMode === 'idle') {
      const win = window as Window & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions,
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
      timeoutId = window.setTimeout(() => {
        if (!isMounted) {
          return;
        }
        if (typeof win.requestIdleCallback === 'function') {
          idleId = win.requestIdleCallback(
            () => {
              void loadAuthState();
            },
            { timeout: 500 },
          );
        } else {
          void loadAuthState();
        }
      }, idleDelayMs);
    } else {
      void loadAuthState();
    }

    return () => {
      isMounted = false;
      controller.abort();
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null) {
        const win = window as Window & {
          cancelIdleCallback?: (handle: number) => void;
        };
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(idleId);
        } else {
          window.clearTimeout(idleId);
        }
      }
    };
  }, [fetchMode, idleDelayMs]);

  return state;
}
