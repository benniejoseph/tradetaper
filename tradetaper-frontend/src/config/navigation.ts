/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog, FaBook, FaCalendarAlt, FaChartPie, FaBalanceScale, FaUsers, FaCreditCard, FaDollarSign, FaBullseye, FaStickyNote, FaBrain, FaChartLine, FaFlask, FaBell, FaTrophy, FaServer, FaUserCircle } from 'react-icons/fa';

export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Journal', href: '/journal', icon: FaBook }, 
  { label: 'Strategies', href: '/strategies', icon: FaBullseye }, 
  { label: 'Discipline', href: '/discipline', icon: FaTrophy },
  { label: 'Backtesting', href: '/backtesting', icon: FaFlask }, // Backtesting visible in main nav
  { label: 'Notes', href: '/notes', icon: FaStickyNote }, 
  { label: 'Psychology', href: '/psychology', icon: FaBrain },
  { label: 'Daily Stats', href: '/daily-stats', icon: FaChartBar }, 
  { label: 'Market Intelligence', href: '/market-intelligence', icon: FaChartLine },
];

export const userNavItems: NavItem[] = [
    { label: 'Profile', href: '/profile', icon: FaUserCircle }, // Added Profile
    { label: 'Notifications', href: '/notifications', icon: FaBell },
    { label: 'Settings', href: '/settings', icon: FaCog },
];

export const settingsNavItems: NavItem[] = [
  { label: 'Manage Accounts', href: '/settings/accounts', icon: FaUsers },
  { label: 'Connect MT5', href: '/settings/mt5-accounts', icon: FaServer }, 
  { label: 'Billing', href: '/billing', icon: FaCreditCard }, // Moved Billing here
];

// Add pricing to footer navigation
export const footerNavItems: NavItem[] = [
  { label: 'Pricing', href: '/pricing', icon: FaDollarSign },
];