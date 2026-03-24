import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'FRONT_DESK' | 'DRINKS_SELLER';

const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ['SUPER_ADMIN', 'ADMIN', 'FRONT_DESK'],
  '/rooms': ['SUPER_ADMIN', 'ADMIN', 'FRONT_DESK'],
  '/bookings': ['SUPER_ADMIN', 'ADMIN', 'FRONT_DESK'],
  '/inventory': ['SUPER_ADMIN', 'ADMIN', 'FRONT_DESK', 'DRINKS_SELLER'],
  '/reports': ['SUPER_ADMIN', 'ADMIN'],
  '/users': ['SUPER_ADMIN', 'ADMIN'],
  '/settings': ['SUPER_ADMIN', 'ADMIN', 'FRONT_DESK', 'DRINKS_SELLER'],
};

function canSee(role: string | undefined, path: string): boolean {
  if (!role) return false;
  return (ROUTE_ROLES[path] ?? []).includes(role as UserRole);
}

function NavItem({
  to,
  label,
  icon,
  isActive,
  isCollapsed,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
        ${
          isActive
            ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${isCollapsed ? 'justify-center' : ''}`}
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      {!isCollapsed && label}
    </Link>
  );
}

function BottomNavItem({
  to,
  label,
  icon,
  isActive,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 py-2 px-3 flex-1 transition-colors ${
        isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

const Icons = {
  Dashboard: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Rooms: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  Bookings: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Inventory: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Reports: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  Users: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Settings: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Sun: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Bell: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Logout: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Person: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Plus: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  ChevronLeft: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronDown: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Menu: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  More: (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const role = user?.role;
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U';
  const userAvatarUrl = user?.avatarUrl ?? null;

  const notifications = useMemo(
    () => [
      {
        id: '1',
        title: 'Quick booking available',
        description: 'Tap "Quick Booking" to create a reservation instantly.',
        time: 'Now',
        isNew: true,
      },
      {
        id: '2',
        title: 'System update complete',
        description: 'All modules are synced and running.',
        time: '5 mins ago',
        isNew: true,
      },
      {
        id: '3',
        title: 'Security reminder',
        description: 'Review account settings regularly.',
        time: '1 day ago',
        isNew: false,
      },
    ],
    []
  );

  const unreadCount = notifications.filter((n) => n.isNew).length;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const AvatarBubble = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const cls = size === 'md' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs';
    return (
      <div
        className={`${cls} rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}
      >
        {userAvatarUrl ? (
          <img src={userAvatarUrl} alt={user?.name ?? 'avatar'} className="w-full h-full object-cover" />
        ) : (
          userInitial
        )}
      </div>
    );
  };

  const pageTitle = location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard';

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={`p-4 flex items-center gap-3 ${!mobile && isCollapsed ? 'justify-center px-2' : ''}`}>
        <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0">
          <span className="w-5 h-5">{Icons.Rooms}</span>
        </div>
        {(mobile || !isCollapsed) && (
          <div>
            <p className="text-gray-900 dark:text-white text-sm font-black leading-none">Silver HOCH</p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">Hotel Management</p>
          </div>
        )}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="w-5 h-5">{Icons.Close}</span>
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 mt-2 overflow-y-auto">
        {canSee(role, '/dashboard') && (
          <NavItem
            to="/dashboard"
            label="Dashboard"
            icon={Icons.Dashboard}
            isActive={isActive('/dashboard')}
            isCollapsed={!mobile && isCollapsed}
          />
        )}
        {canSee(role, '/rooms') && (
          <NavItem to="/rooms" label="Rooms" icon={Icons.Rooms} isActive={isActive('/rooms')} isCollapsed={!mobile && isCollapsed} />
        )}
        {canSee(role, '/bookings') && (
          <NavItem
            to="/bookings"
            label="Bookings"
            icon={Icons.Bookings}
            isActive={isActive('/bookings')}
            isCollapsed={!mobile && isCollapsed}
          />
        )}
        {canSee(role, '/inventory') && (
          <NavItem
            to="/inventory"
            label="Inventory"
            icon={Icons.Inventory}
            isActive={isActive('/inventory')}
            isCollapsed={!mobile && isCollapsed}
          />
        )}
        {canSee(role, '/reports') && (
          <NavItem
            to="/reports"
            label="Reports"
            icon={Icons.Reports}
            isActive={isActive('/reports')}
            isCollapsed={!mobile && isCollapsed}
          />
        )}
        {canSee(role, '/users') && (
          <NavItem to="/users" label="Users" icon={Icons.Users} isActive={isActive('/users')} isCollapsed={!mobile && isCollapsed} />
        )}
        {canSee(role, '/settings') && (
          <NavItem
            to="/settings"
            label="Settings"
            icon={Icons.Settings}
            isActive={isActive('/settings')}
            isCollapsed={!mobile && isCollapsed}
          />
        )}
      </nav>

      <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
        <Link
          to="/profile"
          className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${
            isActive('/profile')
              ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${!mobile && isCollapsed ? 'justify-center' : ''}`}
        >
          <AvatarBubble />
          {(mobile || !isCollapsed) && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm ${
            !mobile && isCollapsed ? 'justify-center' : ''
          }`}
        >
          <span className="w-5 h-5 shrink-0">{Icons.Logout}</span>
          {(mobile || !isCollapsed) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117]">
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-16' : 'w-52'
        } border-r border-gray-200 dark:border-gray-800 flex-col h-screen bg-white dark:bg-[#101622] transition-all duration-300 ease-in-out fixed left-0 top-0 z-40`}
      >
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-[#1a2130] border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-colors shadow-md z-10"
        >
          <span className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            {Icons.ChevronLeft}
          </span>
        </button>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-[#101622] flex flex-col shadow-2xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      <div className={`md:${isCollapsed ? 'ml-16' : 'ml-52'} transition-all duration-300 ease-in-out flex flex-col min-h-screen`}>
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#101622]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="w-5 h-5">{Icons.Menu}</span>
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white capitalize truncate">{pageTitle}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="w-4 h-4">{theme === 'dark' ? Icons.Sun : Icons.Moon}</span>
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-5 h-5">{Icons.Bell}</span>
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161d2b] shadow-xl z-50">
                  <p className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">
                    Notifications
                  </p>
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1">{n.title}</p>
                        {n.isNew && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{n.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="h-9 pl-1 pr-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <AvatarBubble size="sm" />
                <span
                  className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                >
                  {Icons.ChevronDown}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161d2b] shadow-xl z-50 p-1">
                  <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <span className="w-4 h-4 text-gray-400 shrink-0">{Icons.Person}</span>My Profile
                  </button>
                  {canSee(role, '/settings') && (
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="w-4 h-4 text-gray-400 shrink-0">{Icons.Settings}</span>Settings
                    </button>
                  )}
                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <span className="w-4 h-4 shrink-0">{Icons.Logout}</span>Logout
                  </button>
                </div>
              )}
            </div>

            {canSee(role, '/bookings') && (
              <button
                onClick={() => navigate('/bookings?quick=1')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="w-3.5 h-3.5">{Icons.Plus}</span>
                <span className="hidden lg:inline">Quick </span>Booking
              </button>
            )}
          </div>
        </header>

        <main className="p-3 sm:p-4 flex-1 pb-20 md:pb-4">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#101622] border-t border-gray-200 dark:border-gray-800 flex items-center safe-area-bottom">
        {canSee(role, '/dashboard') && (
          <BottomNavItem to="/dashboard" label="Home" icon={Icons.Dashboard} isActive={isActive('/dashboard')} />
        )}
        {canSee(role, '/rooms') && <BottomNavItem to="/rooms" label="Rooms" icon={Icons.Rooms} isActive={isActive('/rooms')} />}
        {canSee(role, '/bookings') && (
          <BottomNavItem to="/bookings" label="Bookings" icon={Icons.Bookings} isActive={isActive('/bookings')} />
        )}
        {canSee(role, '/inventory') && (
          <BottomNavItem
            to="/inventory"
            label="Inventory"
            icon={Icons.Inventory}
            isActive={isActive('/inventory')}
          />
        )}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 py-2 px-3 flex-1 transition-colors text-gray-500 dark:text-gray-400"
        >
          <span className="w-5 h-5">{Icons.More}</span>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
