/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog, FaBook, FaCalendarAlt, FaChartPie, FaBalanceScale, FaInfoCircle, FaUsers, FaCreditCard, FaDollarSign } from 'react-icons/fa';

export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Journal', href: '/journal', icon: FaBook }, // Changed Trades to Journal, new icon
  { label: 'Daily Stats', href: '/daily-stats', icon: FaChartBar }, // New item
  { label: 'Daily Balances', href: '/daily-balances', icon: FaBalanceScale }, // New item
  { label: 'Calendar', href: '/calendar', icon: FaCalendarAlt }, // New item, existing icon from analytics could be PnlCalendar itself
  { label: 'Overview', href: '/overview', icon: FaChartPie }, // New item
  { label: 'Guides', href: '/guides', icon: FaInfoCircle }, // New item
  // Removing old items like 'Add Trade' and 'Analytics' as they are not in the new design.
  // The Analytics functionality might be merged into 'Overview' or 'Daily Stats'.
  // 'Add Trade' is usually a button on the Journal/Trades page.
];

export const userNavItems: NavItem[] = [
    // { label: 'Profile', href: '/profile', icon: FaUserCircle }, // Placeholder
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