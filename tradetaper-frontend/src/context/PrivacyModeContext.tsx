'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface PrivacyModeValue {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyModeContext = createContext<PrivacyModeValue>({
  privacyMode: false,
  togglePrivacyMode: () => {},
});

const STORAGE_KEY = 'tt_privacy_mode';

/**
 * Privacy mode hides monetary values (P&L, balances) across the app.
 * Useful when screen-sharing, trading in public, or for tilt-prone
 * traders who want to focus on process metrics instead of money.
 *
 * Components opt in either via the usePrivacyMode() hook or by putting
 * data-sensitive on an element (blurred globally via CSS).
 */
export function PrivacyModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    setPrivacyMode(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('privacy-mode', privacyMode);
  }, [privacyMode]);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  }, []);

  return (
    <PrivacyModeContext.Provider value={{ privacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  return useContext(PrivacyModeContext);
}

/** Formats a currency amount, masking it when privacy mode is on. */
export function useMaskedCurrency() {
  const { privacyMode } = usePrivacyMode();
  return useCallback(
    (formatted: string) => (privacyMode ? '••••' : formatted),
    [privacyMode],
  );
}
