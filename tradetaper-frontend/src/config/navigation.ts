/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog, FaBook, FaCalendarAlt, FaChartPie, FaBalanceScale, FaUsers, FaCreditCard, FaDollarSign, FaBullseye, FaStickyNote, FaChartLine, FaFlask, FaBell, FaBolt, FaServer, FaUserCircle, FaDesktop, FaBrain, FaTrophy, FaGraduationCap } from 'react-icons/fa';

export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

// Grouped navigation: every routable feature is reachable from the
// sidebar. Previously /mentor, /psychology and /prop-firm existed as
// pages but had no nav entry at all.
export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Journal', href: '/journal', icon: FaBook },
  { label: 'Analytics', href: '/analytics', icon: FaChartBar },
  { label: 'Strategies', href: '/strategies', icon: FaBullseye },
  { label: 'Notes', href: '/notes', icon: FaStickyNote },
  { label: 'Community', href: '/community', icon: FaUsers },
];

/** AI & psychology features, grouped under a "Mentor" section. */
export const mentorNavItems: NavItem[] = [
  { label: 'Trader Mind', href: '/trader-mind', icon: FaBolt },
  { label: 'AI Mentor', href: '/mentor', icon: FaGraduationCap },
  { label: 'Psychology', href: '/psychology', icon: FaBrain },
];

/** Market research & practice tools, grouped under a "Markets" section. */
export const marketsNavItems: NavItem[] = [
  { label: 'The Desk', href: '/desk', icon: FaBalanceScale },
  { label: 'Market Intelligence', href: '/market-intelligence', icon: FaChartLine },
  { label: 'Backtesting', href: '/backtesting', icon: FaFlask },
  { label: 'Prop Firm Tracker', href: '/prop-firm', icon: FaTrophy },
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
