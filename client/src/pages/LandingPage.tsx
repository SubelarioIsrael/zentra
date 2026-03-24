import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-shell px-4 py-10 dark:bg-darkBg">
      <div className="mx-auto max-w-4xl">
        <section className="mb-8 rounded-2xl bg-panel p-8 shadow-panel dark:bg-darkPanel">
          <h1 className="text-3xl font-bold text-text dark:text-white">Zentra</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Fast, focused exam review. Study by topic, take timed or untimed quizzes, and track weak areas over time.
          </p>
        </section>

        <section className="rounded-2xl bg-panel p-6 shadow-panel dark:bg-darkPanel">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode('login')}
              className={`rounded-lg px-4 py-2 text-sm ${mode === 'login' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-lg px-4 py-2 text-sm ${mode === 'register' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            {mode === 'register' && (
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            )}
            <input
              type="email"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={submitting}
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
