'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Terminal,
  HardDrive,
  Server,
  Wallet,
  CreditCard,
  Sun,
  Moon,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/api';
import { getAdminCapabilities } from '@/lib/admin-access';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuSections = [
  {
    section: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',     href: '/' },
      { icon: Activity,        label: 'Live Activity', href: '/activity' },
    ],
  },
  {
    section: 'Data',
    items: [
      { icon: Users,     label: 'Users',       href: '/users' },
      { icon: BarChart3, label: 'Trades',      href: '/trades' },
      { icon: Wallet,    label: 'Accounts',    href: '/accounts' },
      { icon: CreditCard,label: 'Memberships', href: '/memberships' },
      { icon: DollarSign,label: 'Billing',     href: '/billing' },
    ],
  },
  {
    section: 'System',
    items: [
      { icon: Database,  label: 'Database', href: '/database' },
      { icon: Terminal,  label: 'Logs',     href: '/logs' },
      { icon: Server,    label: 'System',   href: '/system' },
      { icon: HardDrive, label: 'Status',   href: '/status' },
    ],
  },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { theme, setTheme } = useTheme();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { data: adminSession } = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => adminApi.getAdminSession(),
    staleTime: 60_000,
    retry: false,
  });
  const capabilities = adminSession
    ? getAdminCapabilities(adminSession.adminRole)
    : {
        canViewBilling: true,
        canViewDatabase: true,
        canRunSql: false,
      };

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    toast.success('Logged out');
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const W = isCollapsed ? 72 : 236;

  return (
    <aside
      style={{
        width: W,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        transition: 'width 260ms cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* ── Brand ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isCollapsed ? '18px 12px' : '18px 16px 18px 14px',
          borderBottom: '1px solid var(--sidebar-border)',
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* Square logo icon */}
          <span
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#047857,#10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp style={{ width: 18, height: 18, color: '#fff' }} />
          </span>

          {!isCollapsed && (
            <span style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                TradeTaper
              </p>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#10B981',
                  textTransform: 'uppercase',
                }}
              >
                <ShieldCheck style={{ width: 10, height: 10 }} />
                Admin
              </span>
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginLeft: 4,
          }}
        >
          {isCollapsed
            ? <ChevronRight style={{ width: 16, height: 16 }} />
            : <ChevronLeft  style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 0',
          scrollbarWidth: 'none',
        }}
      >
        {menuSections.map((section, si) => (
          <div key={section.section} style={{ marginBottom: 4 }}>
            {/* Section label */}
            {!isCollapsed ? (
              <p
                style={{
                  padding: '12px 16px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {section.section}
              </p>
            ) : si > 0 ? (
              <div
                style={{
                  margin: '8px 12px',
                  height: 1,
                  background: 'var(--sidebar-border)',
                }}
              />
            ) : null}

            {/* Items */}
            {section.items.map((item) => {
              if (item.href === '/billing' && !capabilities.canViewBilling) {
                return null;
              }
              if (item.href === '/database' && !capabilities.canViewDatabase) {
                return null;
              }
              const active = isActive(item.href);
              return (
                <div
                  key={item.href}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => isCollapsed && setTooltip(item.href)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: isCollapsed ? '10px 0' : '10px 14px 10px 16px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      margin: '1px 6px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      position: 'relative',
                      color: active ? '#10B981' : 'var(--sidebar-text)',
                      background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
                      fontWeight: active ? 600 : 400,
                      fontSize: 13.5,
                      letterSpacing: active ? '-0.01em' : 'normal',
                      transition: 'background 120ms, color 120ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Active left border bar */}
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          left: -6,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: '60%',
                          borderRadius: '0 3px 3px 0',
                          background: '#10B981',
                        }}
                      />
                    )}

                    <item.icon
                      style={{
                        width: 17,
                        height: 17,
                        flexShrink: 0,
                        color: active ? '#10B981' : 'var(--text-muted)',
                      }}
                    />
                    {!isCollapsed && (
                      <span style={{ lineHeight: 1 }}>{item.label}</span>
                    )}
                  </Link>

                  {/* Collapsed tooltip */}
                  {isCollapsed && tooltip === item.href && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 64,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '5px 10px',
                        borderRadius: 7,
                        whiteSpace: 'nowrap',
                        zIndex: 60,
                        boxShadow: 'var(--shadow-lg)',
                        pointerEvents: 'none',
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom Controls ───────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--sidebar-border)',
          padding: '6px 6px 8px',
        }}
      >
        {/* Light / Dark toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: isCollapsed ? '10px 0' : '10px 10px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--sidebar-text)',
            fontSize: 13.5,
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'background 120ms',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {theme === 'dark'
            ? <Sun  style={{ width: 17, height: 17, flexShrink: 0, color: 'var(--text-muted)' }} />
            : <Moon style={{ width: 17, height: 17, flexShrink: 0, color: 'var(--text-muted)' }} />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign out"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: isCollapsed ? '10px 0' : '10px 10px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--sidebar-text)',
            fontSize: 13.5,
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'background 120ms, color 120ms',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)';
            (e.currentTarget as HTMLElement).style.color = '#F87171';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text)';
          }}
        >
          <LogOut style={{ width: 17, height: 17, flexShrink: 0, color: 'var(--text-muted)' }} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
