/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog, FaBook, FaCalendarAlt, FaChartPie, FaBalanceScale, FaUsers, FaCreditCard, FaDollarSign, FaBullseye, FaStickyNote, FaBrain, FaChartLine, FaFlask, FaBell } from 'react-icons/fa';

export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Market Intelligence', href: '/market-intelligence', icon: FaChartLine }, // ICT Analysis & Market Data
  { label: 'Journal', href: '/journal', icon: FaBook }, // Changed Trades to Journal, new icon
  { label: 'Notes', href: '/notes', icon: FaStickyNote }, // New notes feature
  { label: 'Psychology', href: '/psychology', icon: FaBrain },
  { label: 'Strategies', href: '/strategies', icon: FaBullseye }, // New strategies page
  { label: 'Daily Stats', href: '/daily-stats', icon: FaChartBar }, // New item
  { label: 'Daily Balances', href: '/daily-balances', icon: FaBalanceScale }, // New item
  { label: 'Overview', href: '/overview', icon: FaChartPie }, // New item
  // Removing old items like 'Add Trade' and 'Analytics' as they are not in the new design.
  // The Analytics functionality might be merged into 'Overview' or 'Daily Stats'.
  // 'Add Trade' is usually a button on the Journal/Trades page.
];

export const userNavItems: NavItem[] = [
    // { label: 'Profile', href: '/profile', icon: FaUserCircle }, // Placeholder
    { label: 'Notifications', href: '/notifications', icon: FaBell },
    { label: 'Settings', href: '/settings', icon: FaCog }, // Uncommented and href updated
    { label: 'Billing', href: '/billing', icon: FaCreditCard },
];

export const settingsNavItems: NavItem[] = [
  { label: 'Manage Accounts', href: '/settings/accounts', icon: FaUsers },
  // Add other settings links here in the future
];

// Add billing and pricing to footer navigation
export const footerNavItems: NavItem[] = [
  { label: 'Pricing', href: '/pricing', icon: FaDollarSign },
];