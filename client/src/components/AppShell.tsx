import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/review', label: 'Review' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('zentra_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('zentra_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-shell to-indigo-50/50 text-text transition-colors dark:from-darkBg dark:to-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-panel/85 backdrop-blur-xl dark:border-slate-700/70 dark:bg-darkPanel/85">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/dashboard" className="rounded-xl bg-accentSoft px-3 py-2 text-xl font-semibold text-accent dark:bg-indigo-950/60 dark:text-indigo-300">
            Zentra ✨
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-white shadow-soft dark:shadow-none'
                      : 'text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode((value) => !value)}
              className="ui-btn-secondary"
            >
              {darkMode ? 'Light' : 'Dark'} mode
            </button>
            <span className="hidden text-sm text-muted sm:block">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="ui-btn-primary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
