/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/layout/Sidebar.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavItems, NavItem } from '@/config/navigation'; // Adjust path
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { logout } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // For logo

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors
                  ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                  }`}
    >
      {item.icon && <item.icon className="h-5 w-5" />}
      <span>{item.label}</span>
    </Link>
  );

  return (
    <aside className="w-64 bg-slate-900 text-gray-100 flex flex-col min-h-screen shadow-2xl">
      {/* Logo/Header */}
       <div className="p-6 border-b border-slate-700 flex items-center space-x-3">
        {/* Replace with your actual logo */}
        {/* <Image src="/logo.png" alt="Tradetaper Logo" width={40} height={40} /> */}
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">T</div>
        <h1 className="text-2xl font-semibold text-white">Tradetaper</h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow p-4 space-y-2">
        {mainNavItems.map((item) => (
           <Link
                key={item.label}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors {/* Changed hover color */}
                            ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white'
                            }`}
            >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.label}</span>
            </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        {user && (
          <div className="flex items-center space-x-3 mb-4">
            <FaUserCircle className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-white">
                {user.firstName || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors focus:outline-none"
        >
          <FaSignOutAlt className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}