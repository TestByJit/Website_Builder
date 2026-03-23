'use client';

import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { useAuthStore } from '@/lib/authStore';
// import { Layout, FolderOpen, Settings, LogOut, User } from 'lucide-react';

// const navItems = [
//   { href: '/builder/templates', label: 'Templates', icon: Layout },
//   { href: '/dashboard', label: 'My Sites', icon: FolderOpen },
//   { href: '/settings', label: 'Settings', icon: Settings },
// ];

const Header = () => {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { isAuthenticated, logout, user } = useAuthStore();

//   const handleLogout = () => {
//     logout();
//     router.push('/login');
//   };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#141416] border-b border-[#2A2A2E] z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-lg font-semibold text-white">Realty Builder</span>
        </Link>

        {/* {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#1C1C1F] text-white' 
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )} */}

        {/* <div className="flex items-center gap-2">
          {isAuthenticated ? (
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
          ) : (
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
          )}
        </div> */}
      </div>
    </header>
  );
};

export default Header;
