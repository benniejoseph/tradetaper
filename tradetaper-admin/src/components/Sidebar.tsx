'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [isVeryNarrowViewport, setIsVeryNarrowViewport] = useState(false);

  useEffect(() => {
    const narrowMedia = window.matchMedia('(max-width: 1023px)');
    const veryNarrowMedia = window.matchMedia('(max-width: 480px)');
    const syncViewport = () => {
      setIsNarrowViewport(narrowMedia.matches);
      setIsVeryNarrowViewport(veryNarrowMedia.matches);
    };

    syncViewport();
    narrowMedia.addEventListener('change', syncViewport);
    veryNarrowMedia.addEventListener('change', syncViewport);
    return () => {
      narrowMedia.removeEventListener('change', syncViewport);
      veryNarrowMedia.removeEventListener('change', syncViewport);
    };
  }, []);

  const handleLogout = async () => {
    let loggedOut = true;
    try {
      await adminApi.logout();
    } catch {
      loggedOut = false;
      toast.error('Logout request failed. Please clear your session and sign in again.');
    }
    if (loggedOut) {
      toast.success('Logged out');
    }
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const effectiveCollapsed = isNarrowViewport ? true : isCollapsed;
  const collapsedWidth = isVeryNarrowViewport ? 56 : (isNarrowViewport ? 68 : 84);
  const W = effectiveCollapsed ? collapsedWidth : 212;

  return (
    <aside
      className="sidebar-shell"
      data-collapsed={effectiveCollapsed ? 'true' : 'false'}
      style={{ width: W }}
    >
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="sidebar-brand">
        <Link href="/" className="sidebar-brand-link">
          {/* Square logo icon */}
          <span className="sidebar-logo">
            <TrendingUp className="sidebar-logo-icon" />
          </span>

          {!effectiveCollapsed && (
            <span className="sidebar-brand-copy">
              <p className="sidebar-brand-title">TradeTaper</p>
              <span className="sidebar-brand-badge">
                <ShieldCheck className="sidebar-brand-badge-icon" />
                Admin
              </span>
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="sidebar-collapse-btn"
        >
          {effectiveCollapsed
            ? <ChevronRight className="sidebar-collapse-icon" />
            : <ChevronLeft className="sidebar-collapse-icon" />}
        </button>
      </div>

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav className="sidebar-nav">
        {menuSections.map((section, si) => (
          <div key={section.section} className="sidebar-section">
            {/* Section label */}
            {!effectiveCollapsed ? (
              <p className="sidebar-section-label">{section.section}</p>
            ) : si > 0 ? (
              <div className="sidebar-section-divider" />
            ) : null}

            {/* Items */}
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <div
                  key={item.href}
                  className="sidebar-item-wrap"
                  onMouseEnter={() => effectiveCollapsed && setTooltip(item.href)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
                  >
                    {/* Active left border bar */}
                    {active && (
                      <span className="sidebar-active-rail" />
                    )}

                    <item.icon
                      className={`sidebar-item-icon ${active ? 'sidebar-item-icon-active' : ''}`}
                    />
                    {!effectiveCollapsed && (
                      <span className="sidebar-item-text">{item.label}</span>
                    )}
                  </Link>

                  {/* Collapsed tooltip */}
                  {effectiveCollapsed && tooltip === item.href && (
                    <div
                      className="sidebar-tooltip"
                      style={{ left: collapsedWidth + 8 }}
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
      <div className="sidebar-footer">
        {/* Light / Dark toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="sidebar-action-btn"
        >
          {theme === 'dark'
            ? <Sun className="sidebar-action-icon" />
            : <Moon className="sidebar-action-icon" />}
          {!effectiveCollapsed && <span className="sidebar-action-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign out"
          className="sidebar-action-btn sidebar-action-btn-danger"
        >
          <LogOut className="sidebar-action-icon" />
          {!effectiveCollapsed && <span className="sidebar-action-label">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
