/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/layout/Sidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavItems, userNavItems, settingsNavItems } from '@/config/navigation';
import { FaSignOutAlt, FaUserCircle, FaTimes, FaChartLine } from 'react-icons/fa';
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
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 flex flex-col min-h-screen 
                        bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
                        border-r border-gray-200/50 dark:border-gray-700/50
                        fixed top-0 left-0 z-50 h-screen 
                        transition-all duration-300 ease-out md:translate-x-0
                        shadow-2xl dark:shadow-2xl
                        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header with Logo */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" 
                  className="flex items-center space-x-3 group focus:outline-none"
                  onClick={handleLinkClick}>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <FaChartLine className="w-6 h-6" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  TradeTaper
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Trading Journal</p>
              </div>
            </Link>
            
            <button 
              onClick={toggleSidebar} 
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200"
              aria-label="Close sidebar">
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
              Main Menu
            </h2>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden
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
                    
                    <div className="relative z-10 flex items-center space-x-3">
                      {item.icon && (
                        <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110
                          ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500'}`} />
                      )}
                      <span className="relative">{item.label}</span>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Navigation */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
              Account
            </h2>
            <div className="space-y-1">
              {userNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                        }`}>
                      
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      )}
                      
                      <div className="relative z-10 flex items-center space-x-3">
                        {item.icon && (
                          <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110
                            ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-500'}`} />
                        )}
                        <span>{item.label}</span>
                      </div>
                    </Link>
                    
                    {/* Settings Subnav */}
                    {item.href === '/settings' && pathname.startsWith('/settings') && (
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
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 mt-auto space-y-4">
          {/* Theme Toggle */}
          <div className="flex justify-center">
            <div className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm">
              <ThemeToggleButton />
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.firstName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-transparent shadow-sm hover:shadow-lg">
            <FaSignOutAlt className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}