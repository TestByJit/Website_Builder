'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';
import { LogOut } from 'lucide-react';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#141416] border-b border-[#2A2A2E] z-40">
        <div className="h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-semibold text-white">Website Builder</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md text-sm text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#141416] border-b border-[#2A2A2E] z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="text-lg font-semibold text-white">Website Builder</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[#A1A1AA]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
