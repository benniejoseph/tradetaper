// src/components/auth/LogoutButton.tsx
"use client";
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { logout } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Logout
    </button>
  );
}