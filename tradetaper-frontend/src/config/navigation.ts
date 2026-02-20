/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog, FaBook, FaCalendarAlt, FaChartPie, FaBalanceScale, FaUsers, FaCreditCard, FaDollarSign, FaBullseye, FaStickyNote, FaChartLine, FaFlask, FaBell, FaBolt, FaServer, FaUserCircle, FaDesktop } from 'react-icons/fa';

export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Analytics', href: '/analytics', icon: FaChartBar },
  { label: 'Journal', href: '/journal', icon: FaBook }, 
  { label: 'Strategies', href: '/strategies', icon: FaBullseye }, 
  { label: 'Trader Mind', href: '/trader-mind', icon: FaBolt },
  { label: 'Community', href: '/community', icon: FaUsers },
  { label: 'Backtesting', href: '/backtesting', icon: FaFlask }, // Backtesting visible in main nav
  { label: 'Notes', href: '/notes', icon: FaStickyNote }, 
  { label: 'Market Intelligence', href: '/market-intelligence', icon: FaChartLine },
];

export const userNavItems: NavItem[] = [
    { label: 'Profile', href: '/profile', icon: FaUserCircle }, // Added Profile
    { label: 'Notifications', href: '/notifications', icon: FaBell },
    { label: 'Settings', href: '/settings', icon: FaCog },
];

export const settingsNavItems: NavItem[] = [
  { label: 'Manual Account / Import', href: '/settings/accounts', icon: FaUsers },
  { label: 'Cloud MT5 (MetaApi)', href: '/settings/mt5-accounts', icon: FaServer }, 
  { label: 'Local MT5 Sync', href: '/settings/local-mt5', icon: FaDesktop },
  { label: 'Billing', href: '/billing', icon: FaCreditCard }, // Moved Billing here
];

// Add pricing to footer navigation
export const footerNavItems: NavItem[] = [
  { label: 'Pricing', href: '/pricing', icon: FaDollarSign },
];
