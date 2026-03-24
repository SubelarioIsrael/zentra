import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

type Summary = {
  totalQuizzes: number;
  averageScore: number;
  streakCount: number;
  weakTopics: { id: number; name: string; accuracy: number }[];
  topicAccuracy: { id: number; name: string; accuracy: number }[];
};

export function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<Summary>('/dashboard/summary')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-muted">Loading dashboard...</p>;
  }

  const cards = [
    { label: 'Total Quizzes', value: data.totalQuizzes },
    { label: 'Average Score', value: `${data.averageScore}%` },
    { label: 'Current Streak', value: `${data.streakCount} day(s)` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
        <h2 className="mb-3 text-lg font-semibold">Weak Topics</h2>
        {data.weakTopics.length === 0 ? (
          <p className="text-sm text-muted">No weak topics detected yet. Keep practicing.</p>
        ) : (
          <ul className="space-y-2">
            {data.weakTopics.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{topic.name}</span>
                <span className="text-sm text-red-500">{topic.accuracy}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
        <h2 className="mb-3 text-lg font-semibold">Topic Accuracy</h2>
        <div className="space-y-3">
          {data.topicAccuracy.map((topic) => (
            <div key={topic.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{topic.name}</span>
                <span>{topic.accuracy}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(0, Math.min(100, topic.accuracy))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
