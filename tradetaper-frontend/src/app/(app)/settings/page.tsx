"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/accounts');
  }, [router]);

  // Return null or a loading spinner while redirecting
  // For a client-side redirect like this, often nothing is rendered before redirect happens.
  return null;
} 