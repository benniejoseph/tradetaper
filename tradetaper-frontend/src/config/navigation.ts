/* eslint-disable @typescript-eslint/no-unused-vars */
// src/config/navigation.ts
import { IconType } from 'react-icons';
import { FaTachometerAlt, FaListAlt, FaChartBar, FaPenSquare, FaCog } from 'react-icons/fa'; // Example icons
export interface NavItem {
  label: string;
  href: string;
  icon?: IconType; // Optional icon component
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: FaTachometerAlt },
  { label: 'Trades', href: '/trades', icon: FaListAlt },
  { label: 'Add Trade', href: '/trades/new', icon: FaPenSquare },
  { label: 'Analytics', href: '/analytics', icon: FaChartBar },
  // { label: 'Settings', href: '/settings', icon: FaCog }, // Placeholder for future
];

export const userNavItems: NavItem[] = [
    // { label: 'Profile', href: '/profile', icon: FaUserCircle }, // Placeholder
    // { label: 'Settings', href: '/settings', icon: FaCog },
];