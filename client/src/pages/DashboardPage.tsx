import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { HelperAlert } from '../components/HelperAlert';

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
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="ui-subtitle mt-1">Track momentum, spot weak areas, and keep your streak active.</p>
      </div>
      <HelperAlert>Use Weak Topics first, then jump to Quiz for targeted practice rounds.</HelperAlert>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="ui-card-soft">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-accent dark:text-indigo-300">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="ui-card">
        <h2 className="mb-3 text-lg font-semibold">Weak Topics</h2>
        {data.weakTopics.length === 0 ? (
          <p className="text-sm text-muted">No weak topics detected yet. Keep practicing.</p>
        ) : (
          <ul className="space-y-2">
            {data.weakTopics.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                <span>{topic.name}</span>
                <span className="text-sm text-red-500">{topic.accuracy}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ui-card">
        <h2 className="mb-3 text-lg font-semibold">Topic Accuracy</h2>
        <div className="space-y-3">
          {data.topicAccuracy.map((topic) => (
            <div key={topic.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{topic.name}</span>
                <span>{topic.accuracy}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-400"
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
