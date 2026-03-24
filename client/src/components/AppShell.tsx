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
    <div className="min-h-screen bg-shell text-text transition-colors dark:bg-darkBg dark:text-slate-100">
      <header className="border-b border-slate-200 bg-panel/90 backdrop-blur dark:border-slate-700 dark:bg-darkPanel/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/dashboard" className="text-xl font-semibold text-accent">
            Zentra
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? 'bg-accent text-white' : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode((value) => !value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-muted hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <span className="hidden text-sm text-muted sm:block">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
