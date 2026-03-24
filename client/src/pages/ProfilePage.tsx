import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

type ProfileResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    streak_count: number;
    created_at: string;
  };
  summary: {
    totalQuizzes: number;
    averageScore: number;
  };
  recentAttempts: {
    id: number;
    mode: 'timed' | 'untimed';
    score: number;
    total_questions: number;
    completed_at: string;
  }[];
};

export function ProfilePage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<ProfileResponse>('/profile')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-muted">Loading profile...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
        <p className="text-lg font-semibold">{data.user.name}</p>
        <p className="text-sm text-muted">{data.user.email}</p>
        <p className="mt-2 text-sm text-muted">Streak: {data.user.streak_count} day(s)</p>
      </section>

      <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
        <h2 className="mb-3 font-semibold">Stats</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-sm text-muted">Total Quizzes</p>
            <p className="text-xl font-semibold">{data.summary.totalQuizzes}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-sm text-muted">Average Score</p>
            <p className="text-xl font-semibold">{data.summary.averageScore}%</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
        <h2 className="mb-3 font-semibold">Recent Attempts</h2>
        <ul className="space-y-2 text-sm">
          {data.recentAttempts.map((attempt) => (
            <li key={attempt.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {attempt.mode} • {attempt.score}/{attempt.total_questions}
            </li>
          ))}
          {data.recentAttempts.length === 0 && <li className="text-muted">No attempts yet.</li>}
        </ul>
      </section>
    </div>
  );
}
