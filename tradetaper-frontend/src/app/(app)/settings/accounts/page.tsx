"use client";

import React from 'react';
import ManageAccounts from '@/components/settings/ManageAccounts';

export default function AccountSettingsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-100 dark:bg-dark-primary">
      <div className="container mx-auto">
        <ManageAccounts />
      </div>
    </div>
  );
} 