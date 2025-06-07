/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/layout/Sidebar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavItems, userNavItems, settingsNavItems } from '@/config/navigation';
import { 
  FaSignOutAlt, FaUserCircle, FaTimes, FaChartLine, FaChevronLeft, 
  FaChevronRight, FaBars, FaCog, FaExpand, FaCompress
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { logout } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';

// Define props for Sidebar
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, toggleSidebar, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Expandable sidebar state
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleLinkClick = () => {
    if (isOpen) {
      toggleSidebar();
    }
  };

  // Expandable sidebar handlers
  const handleMouseEnter = () => {
    if (!isMobile && !isExpanded) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      const timeout = setTimeout(() => {
        setIsExpanded(true);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && isExpanded && hoverTimeout) {
      clearTimeout(hoverTimeout);
      const timeout = setTimeout(() => {
        setIsExpanded(false);
      }, 500);
      setHoverTimeout(timeout);
    }
  };

  const toggleExpanded = () => {
    if (!isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(true);
    }
  }, [isMobile]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${isExpanded ? 'w-72' : 'w-20'} flex flex-col min-h-screen 
                        bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
                        border-r border-gray-200/50 dark:border-gray-700/50
                        fixed top-0 left-0 z-50 h-screen 
                        transition-all duration-500 ease-out md:translate-x-0
                        shadow-2xl dark:shadow-2xl group
                        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                        ${isMobile ? 'w-72' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        
        {/* Header with Logo */}
        <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" 
                  className="flex items-center space-x-3 group focus:outline-none"
                  onClick={handleLinkClick}>
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
              </div>
              <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent whitespace-nowrap">
                  TradeTaper
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Trading Journal</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-2">
              {!isMobile && (
                <button 
                  onClick={toggleExpanded}
                  className="p-2 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
                  aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}>
                  {isExpanded ? <FaChevronLeft className="h-4 w-4" /> : <FaChevronRight className="h-4 w-4" />}
                </button>
              )}
              
              {isMobile && (
                <button 
                  onClick={toggleSidebar} 
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200"
                  aria-label="Close sidebar">
                  <FaTimes className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-grow p-3 sm:p-4 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <h2 className={`text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3 transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
              Main Menu
            </h2>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <div key={item.label} className="relative group/tooltip">
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`group flex items-center ${isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                        }`}>
                      
                      {/* Background gradient for active state */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 opacity-100"></div>
                      )}
                      
                      {/* Hover background */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      )}
                      
                      <div className={`relative z-10 flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                        {item.icon && (
                          <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110
                            ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500'}`} />
                        )}
                        <span className={`relative transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'} whitespace-nowrap`}>
                          {item.label}
                        </span>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && isExpanded && (
                        <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                      )}
                    </Link>
                    
                    {/* Tooltip for collapsed state */}
                    {!isExpanded && (
                      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Navigation */}
          <div className="mb-6">
            <h2 className={`text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3 transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
              Account
            </h2>
            <div className="space-y-1">
              {userNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <div key={item.label}>
                    <div className="relative group/tooltip">
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`group flex items-center ${isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden
                          ${isActive 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                          }`}>
                        
                        {!isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        )}
                        
                        <div className={`relative z-10 flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                          {item.icon && (
                            <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110
                              ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-500'}`} />
                          )}
                          <span className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'} whitespace-nowrap`}>
                            {item.label}
                          </span>
                        </div>
                      </Link>
                      
                      {/* Tooltip for collapsed state */}
                      {!isExpanded && (
                        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                          {item.label}
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Settings Subnav - only show when expanded */}
                    {isExpanded && item.href === '/settings' && pathname.startsWith('/settings') && (
                      <div className="mt-2 ml-4 space-y-1 border-l-2 border-gradient-to-b from-purple-500 to-pink-500 pl-4">
                        {settingsNavItems.map(subItem => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                          return (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              onClick={handleLinkClick}
                              className={`group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${isSubActive 
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                                  : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}>
                              {subItem.icon && (
                                <subItem.icon className="h-4 w-4" />
                              )}
                              <span>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white">
                <FaUserCircle className="w-5 h-5" />
              </div>
              <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            
            {/* Logout button - position based on expanded state */}
            <div className={`${isExpanded ? '' : 'absolute bottom-6 left-1/2 transform -translate-x-1/2'}`}>
              <div className="relative group/tooltip">
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Logout">
                  <FaSignOutAlt className="w-5 h-5" />
                </button>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    Logout
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Theme Toggle - positioned at bottom for collapsed state */}
          {!isExpanded && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="relative group/tooltip">
                <ThemeToggleButton />
                <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                  Toggle Theme
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}