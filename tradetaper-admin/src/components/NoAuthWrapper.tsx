'use client';

import React from 'react';

interface NoAuthWrapperProps {
  children: React.ReactNode;
}

// Simple wrapper that bypasses all authentication - directly renders children
export default function NoAuthWrapper({ children }: NoAuthWrapperProps) {
  return <>{children}</>;
}