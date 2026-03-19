'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Landmark, ShieldAlert } from 'lucide-react';

export default function GeographicPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="admin-card max-w-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-warning-subtle)' }}>
            <Landmark className="w-7 h-7" style={{ color: 'var(--accent-warning)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Markets Module Not Enabled
          </h1>
          <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            This route is intentionally disabled because the backend does not expose production geographic analytics endpoints.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--accent-warning-subtle)', color: 'var(--accent-warning)' }}>
            <ShieldAlert className="w-4 h-4" />
            Enable only after backend route support is implemented.
          </div>
        </div>
      </main>
    </div>
  );
}
