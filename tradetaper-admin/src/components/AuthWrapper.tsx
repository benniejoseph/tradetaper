'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminToken } from '@/lib/api';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side route guard: redirects to /login when no admin token is
 * present. Authorization is ultimately enforced server-side by the
 * backend AdminGuard - this only prevents rendering a broken UI.
 */
export default function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/login') {
      setReady(true);
      return;
    }
    if (!getAdminToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;

  return <>{children}</>;
}
