import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { HelperAlert } from '../components/HelperAlert';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-shell via-indigo-50 to-violet-50 px-4 py-10 dark:from-darkBg dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl">
        <section className="ui-card mb-8 overflow-hidden">
          <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent dark:bg-indigo-950/60 dark:text-indigo-300">
                Quiz game mode learning
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-text dark:text-white md:text-4xl">Zentra</h1>
              <p className="mt-3 max-w-2xl text-muted">
                Learn faster with short quiz runs, instant feedback, and streak-based momentum.
              </p>
            </div>

            <div className="ui-card-soft">
              <p className="text-sm font-semibold text-text dark:text-slate-100">Why it feels fun</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>⚡ Quick rounds with clear progress</li>
                <li>🎯 Focus weak topics first</li>
                <li>🔥 Keep your daily streak alive</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="ui-card max-w-xl">
          <HelperAlert>New here? Register, then head to Subjects to add content before starting quiz runs.</HelperAlert>
          <div className="mb-4 mt-4 flex gap-2">
            <button
              onClick={() => setMode('login')}
              className={`ui-btn ${mode === 'login' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`ui-btn ${mode === 'register' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            {mode === 'register' && (
              <input
                className="ui-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            )}
            <input
              type="email"
              className="ui-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              className="ui-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={submitting}
              className="ui-btn-primary disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
