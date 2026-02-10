/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/layout/Sidebar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavItems, userNavItems, settingsNavItems } from '@/config/navigation';
import { 
  FaSignOutAlt, FaUserCircle, FaTimes, FaChartLine, FaChevronLeft, 
  FaChevronRight, FaBars, FaCog, FaExpand, FaCompress, FaCrown
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { logout } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/common/ThemeToggle';

// Define props for Sidebar
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export default function Sidebar({ isOpen, toggleSidebar, isMobile, onExpandChange }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Expandable sidebar state - collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Expandable sidebar handlers - only button click, no hover
  const toggleExpanded = () => {
    if (!isMobile) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onExpandChange?.(newExpanded);
    }
  };

  // Auto-expand on mobile (always expanded on mobile)
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(true);
      onExpandChange?.(true);
    } else {
      // Reset to collapsed on desktop
      setIsExpanded(false);
      onExpandChange?.(false);
    }
  }, [isMobile, onExpandChange]);

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
        className={`${isExpanded ? 'w-72' : 'w-20'} flex flex-col h-screen 
                        bg-white/90 dark:bg-black backdrop-blur-xls
                        border-r border-gray-200/50 dark:border-gray-700/50
                        fixed top-0 left-0 z-50 
                        transition-all duration-500 ease-out md:translate-x-0
                        shadow-2xl dark:shadow-2xl
                        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                        ${isMobile ? 'w-72' : ''}`}>
        
        {/* Header with Logo */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" 
                  className="flex items-center space-x-3 group focus:outline-none"
                  onClick={handleLinkClick}>
              <div className="relative -ml-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg dark:shadow-emerald-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
              </div>
              <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent whitespace-nowrap">
                  TradeTaper
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Trading Journal</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-2 mt-5">
              {!isMobile && (
                <button 
                  onClick={toggleExpanded}
                  className="p-2 ml-2 rounded-lg bg-gray-100/80 dark:bg-[#141414] hover:bg-emerald-500 dark:hover:bg-emerald-600 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
                  aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}>
                  {isExpanded ? <FaChevronLeft className="h-4 w-4" /> : <FaChevronRight className="h-4 w-4" />}
                </button>
              )}
              
              {isMobile && (
                <button 
                  onClick={toggleSidebar} 
                  className="p-2 rounded-lg bg-gray-100 dark:bg-[#141414] hover:bg-gray-200 dark:hover:bg-[#0A0A0A] text-gray-600 dark:text-gray-400 transition-colors duration-200"
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
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg dark:shadow-emerald-md' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-[#0A0A0A]'
                        }`}>
                      
                      {/* Background gradient for active state */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-100"></div>
                      )}
                      
                      {/* Hover background */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      )}
                      
                      <div className={`relative z-10 flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                        {item.icon && (
                            <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110
                            ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-500'}`} />
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
        </nav>

        {/* User Navigation - Moved outside scrolling nav to allow tooltips to overflow */}
        <div className="p-3 sm:p-4 space-y-2 flex-shrink-0">
          <div className="mb-2">
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
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg dark:shadow-emerald-md' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-[#0A0A0A]'
                          }`}>
                        
                        {!isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        )}
                        
                        <div className={`relative z-10 flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
                          {item.icon && (
                            <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110
                              ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-500'}`} />
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
                  
                  {/* Settings Subnav - Show even when collapsed if active */}
                  {item.href === '/settings' && pathname.startsWith('/settings') && (
                    <div className={`${isExpanded ? 'mt-2 ml-4 space-y-1 border-l-2 border-gradient-to-b from-purple-500 to-pink-500 pl-4' : 'mt-2 space-y-2 flex flex-col items-center'}`}>
                      {settingsNavItems.map(subItem => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                        return (
                          <div key={subItem.label} className="relative group/subtooltip">
                            <Link
                              href={subItem.href}
                              onClick={handleLinkClick}
                              className={`group flex items-center ${isExpanded ? 'space-x-3 px-3 py-2' : 'justify-center p-2'} rounded-lg text-sm font-medium transition-all duration-200
                                ${isSubActive 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' 
                                  : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-[#0A0A0A]/50'
                                }`}>
                              {subItem.icon && (
                                <subItem.icon className={`${isExpanded ? 'h-4 w-4' : 'h-4 w-4'}`} />
                              )}
                              {isExpanded && <span>{subItem.label}</span>}
                            </Link>

                            {/* Sub-item Tooltip for collapsed state */}
                            {!isExpanded && (
                              <div className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1.5 rounded shadow-lg opacity-0 group-hover/subtooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                {subItem.label}
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            {/* User info - show account icon only on mobile */}
            <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
              {/* Account icon - only show on mobile */}
              {isMobile && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                  <FaUserCircle className="w-5 h-5" />
                </div>
              )}
              <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </p>
                  {user?.subscription?.plan === 'premium' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm flex items-center gap-1">
                      <FaCrown className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                   {user?.subscription?.plan === 'essential' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-sm">
                      PLUS
                    </span>
                  )}
                </div>
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
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-[#0A0A0A] transition-colors duration-200"
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
          
          {/* Theme Toggle */}
          <div className={`mt-4 flex ${isExpanded ? 'justify-between' : 'justify-center'} items-center`}>
             <ThemeToggle 
               showLabel={isExpanded} 
               variant={isExpanded ? 'button' : 'icon'} 
               className={isExpanded ? 'w-full justify-center' : ''} 
             />
          </div>
        </div>
      </aside>
    </>
  );
}