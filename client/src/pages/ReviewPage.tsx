import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

type ReviewItem = {
  id: number;
  user_answer: string;
  is_correct: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  topic_name: string;
  subject_name: string;
  completed_at: string;
};

export function ReviewPage() {
  const [mode, setMode] = useState<'incorrect' | 'all'>('incorrect');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ items: ReviewItem[] }>(`/review?mode=${mode}`)
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));
  }, [mode]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Review Mode</h1>
      <div className="flex gap-2">
        <button
          className={`rounded-lg px-3 py-2 text-sm ${mode === 'incorrect' ? 'bg-accent text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
          onClick={() => setMode('incorrect')}
        >
          Incorrect Only
        </button>
        <button
          className={`rounded-lg px-3 py-2 text-sm ${mode === 'all' ? 'bg-accent text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
          onClick={() => setMode('all')}
        >
          All Answers
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
            <p className="text-xs text-muted">
              {item.subject_name} • {item.topic_name}
            </p>
            <h2 className="mt-1 font-semibold">{item.prompt}</h2>
            <p className="mt-2 text-sm text-muted">
              Your answer: {item.user_answer} | Correct: {item.correct_option}
            </p>
            <p className="mt-2 text-sm">{item.explanation}</p>
          </article>
        ))}
        {items.length === 0 && <p className="text-muted">No review items yet.</p>}
      </div>
    </div>
  );
}
