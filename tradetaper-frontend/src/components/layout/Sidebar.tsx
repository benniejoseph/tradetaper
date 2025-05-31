/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/layout/Sidebar.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavItems, userNavItems, settingsNavItems, NavItem } from '@/config/navigation'; // Adjust path
import { FaSignOutAlt, FaUserCircle, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { logout } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
// import Image from 'next/image'; // For logo - keep if you plan to use an actual image

// Define props for Sidebar
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleLinkClick = () => {
    if (isOpen) {
      toggleSidebar(); // Close sidebar on link click on mobile
    }
  };

  const itemBaseClasses = "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-opacity-60";
  // Active items are the same for both themes as they use accent color
  const activeItemClasses = "bg-accent-green text-dark-primary font-semibold shadow-glow-green-sm";
  
  // Inactive items need light and dark versions
  const inactiveItemClasses = `text-[var(--color-text-dark-secondary)] hover:text-[var(--color-text-dark-primary)] hover:bg-[var(--color-light-hover)] 
                             dark:text-text-light-secondary dark:hover:text-text-light-primary dark:hover:bg-dark-primary`;

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside 
        className={`w-64 flex flex-col min-h-screen shadow-lg dark:shadow-2xl 
                  bg-[var(--color-light-primary)] text-[var(--color-text-dark-primary)] 
                  dark:bg-dark-secondary dark:text-text-light-primary 
                  fixed md:sticky top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out md:translate-x-0
                  ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-[var(--color-light-border)] dark:border-dark-primary flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3 group focus:outline-none">
            <div className="w-10 h-10 bg-accent-green rounded-full flex items-center justify-center text-dark-primary font-bold text-xl group-hover:shadow-glow-green-sm transition-shadow duration-150">
              T
            </div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-dark-primary)] group-hover:text-accent-green dark:text-text-light-primary dark:group-hover:text-accent-green transition-colors duration-150">
              Tradetaper
            </h1>
          </Link>
          {/* Close button for mobile */}
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-[var(--color-text-dark-secondary)] hover:text-accent-green dark:text-text-light-secondary dark:hover:text-accent-green p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green"
            aria-label="Close sidebar"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const iconClasses = isActive 
              ? 'text-dark-primary' 
              : 'text-[var(--color-text-dark-secondary)] group-hover:text-[var(--color-text-dark-primary)] dark:text-text-light-secondary dark:group-hover:text-text-light-primary';
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className={`${itemBaseClasses} ${isActive ? activeItemClasses : inactiveItemClasses} group`}
              >
                {item.icon && <item.icon className={`h-5 w-5 ${iconClasses} transition-colors duration-150`} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info, Theme Toggle, Settings & Logout */}
        <div className="p-4 border-t border-[var(--color-light-border)] dark:border-dark-primary mt-auto">
          <div className="mb-4 flex justify-center">
            <ThemeToggleButton />
          </div>

          {/* User Nav Items (e.g., Settings) */}
          <nav className="space-y-1 mb-3">
            {userNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const iconClasses = isActive 
                ? 'text-dark-primary' 
                : 'text-[var(--color-text-dark-secondary)] group-hover:text-[var(--color-text-dark-primary)] dark:text-text-light-secondary dark:group-hover:text-text-light-primary';
              return (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick} // Keep existing behavior for mobile
                    className={`${itemBaseClasses} ${isActive ? activeItemClasses : inactiveItemClasses} group w-full`}
                  >
                    {item.icon && <item.icon className={`h-5 w-5 ${iconClasses} transition-colors duration-150`} />}
                    <span>{item.label}</span>
                  </Link>
                  {/* Render settingsNavItems if Settings is active and it's the /settings path */}
                  {item.href === '/settings' && pathname.startsWith('/settings') && (
                    <div className="pt-1 pb-0 pl-4 mt-1 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                      {settingsNavItems.map(subItem => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                        const subIconClasses = isSubActive
                          ? 'text-dark-primary' 
                          : 'text-[var(--color-text-dark-secondary)] group-hover:text-[var(--color-text-dark-primary)] dark:text-text-light-secondary dark:group-hover:text-text-light-primary';
                        return (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            onClick={handleLinkClick}
                            className={`${itemBaseClasses} ${isSubActive ? activeItemClasses : inactiveItemClasses} group w-full text-sm py-2.5 pl-3 pr-2`}
                          >
                            {subItem.icon && <subItem.icon className={`h-4 w-4 ${subIconClasses} transition-colors duration-150`} />}
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {user && (
            <div className="flex items-center space-x-3 mb-4">
              <FaUserCircle className="h-8 w-8 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary truncate">
                  {user.firstName || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`${itemBaseClasses} w-full text-[var(--color-text-dark-secondary)] hover:text-white hover:bg-accent-red dark:text-text-light-secondary dark:hover:text-white dark:hover:bg-accent-red group`}
          >
            <FaSignOutAlt className={`h-5 w-5 text-[var(--color-text-dark-secondary)] group-hover:text-white dark:text-text-light-secondary dark:group-hover:text-white transition-colors duration-150`} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}