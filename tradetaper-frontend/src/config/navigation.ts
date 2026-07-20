/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog, FaBook, FaCalendarAlt, FaChartPie, FaBalanceScale, FaUsers, FaCreditCard, FaDollarSign, FaBullseye, FaStickyNote, FaChartLine, FaFlask, FaBell, FaBolt, FaUserCircle, FaComments, FaLayerGroup, FaFileAlt } from 'react-icons/fa';

export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Journal', href: '/journal', icon: FaBook }, 
  { label: 'Analytics', href: '/analytics', icon: FaChartBar },
  { label: 'Reports', href: '/reports', icon: FaFileAlt },
  { label: 'Strategies', href: '/strategies', icon: FaBullseye }, 
  { label: 'Backtesting', href: '/backtesting', icon: FaFlask }, // Backtesting visible in main nav
  { label: 'Market Intelligence', href: '/market-intelligence', icon: FaChartLine },
  { label: 'AI Coach', href: '/ai-coach', icon: FaComments },
  { label: 'Trader Mind', href: '/trader-mind', icon: FaBolt },
  { label: 'Notes', href: '/notes', icon: FaStickyNote }, 
  { label: 'Community', href: '/community', icon: FaUsers },
];

export const userNavItems: NavItem[] = [
    { label: 'Profile', href: '/profile', icon: FaUserCircle }, // Added Profile
    { label: 'Notifications', href: '/notifications', icon: FaBell },
    { label: 'Settings', href: '/settings', icon: FaCog },
];

export const settingsNavItems: NavItem[] = [
  { label: 'Accounts Hub', href: '/settings/accounts-hub', icon: FaLayerGroup },
  { label: 'Billing', href: '/billing', icon: FaCreditCard }, // Moved Billing here
];

// Add pricing to footer navigation
export const footerNavItems: NavItem[] = [
  { label: 'Pricing', href: '/pricing', icon: FaDollarSign },
];
