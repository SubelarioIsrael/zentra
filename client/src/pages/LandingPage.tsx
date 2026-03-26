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
    <div className="min-h-screen bg-gradient-to-br from-shell via-indigo-50 to-violet-50 px-4 py-8 dark:from-darkBg dark:via-slate-950 dark:to-slate-900 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <section className="ui-card flex flex-col justify-between overflow-hidden p-6 md:p-8">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent dark:bg-indigo-950/60 dark:text-indigo-300">
              Quiz-first learning platform
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-text dark:text-white md:text-5xl">Zentra</h1>
            <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
              Build knowledge with focused quiz runs, immediate feedback, and a clean routine that keeps your streak alive.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="ui-card-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Format</p>
                <p className="mt-1 text-sm font-medium text-text dark:text-slate-100">Short rounds</p>
              </div>
              <div className="ui-card-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Focus</p>
                <p className="mt-1 text-sm font-medium text-text dark:text-slate-100">Weak topics first</p>
              </div>
              <div className="ui-card-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Momentum</p>
                <p className="mt-1 text-sm font-medium text-text dark:text-slate-100">Daily streak habits</p>
              </div>
            </div>
          </div>

          <div className="mt-8 ui-card-soft p-5">
            <p className="text-sm font-semibold text-text dark:text-slate-100">Why this works</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>⚡ Fast sessions with visible progress</li>
              <li>🎯 Feedback loop built around weak areas</li>
              <li>🔥 Daily consistency without burnout</li>
            </ul>
          </div>
        </section>

        <section className="ui-card flex h-full flex-col p-6 md:p-8">
          <div className="mb-5">
            <p className="text-sm font-semibold text-text dark:text-slate-100">Welcome</p>
            <p className="mt-1 text-sm text-muted">
              {mode === 'login' ? 'Continue your progress and jump back in.' : 'Create your account to start learning with quizzes.'}
            </p>
          </div>

          <HelperAlert>New here? Register, then head to Subjects to add content before starting quiz runs.</HelperAlert>

          <div className="mb-5 mt-5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setMode('login')}
                className={`ui-btn w-full ${mode === 'login' ? 'bg-accent text-white' : 'bg-transparent text-slate-700 dark:text-slate-200'}`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('register')}
                className={`ui-btn w-full ${mode === 'register' ? 'bg-accent text-white' : 'bg-transparent text-slate-700 dark:text-slate-200'}`}
              >
                Register
              </button>
            </div>
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
              className="ui-btn-primary mt-1 w-full justify-center disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
