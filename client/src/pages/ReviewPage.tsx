import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { HelperAlert } from '../components/HelperAlert';

type ReviewItem = {
  id: number;
  user_answer: string;
  is_correct: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url_1?: string | null;
  image_url_2?: string | null;
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
      <div>
        <h1 className="text-2xl font-semibold">Review Mode</h1>
        <p className="ui-subtitle mt-1">Replay mistakes, understand answers, and level up weak spots.</p>
      </div>
      <HelperAlert>Switch to “Incorrect Only” when you want quick targeted correction.</HelperAlert>
      <div className="flex gap-2">
        <button
          className={`ui-btn ${mode === 'incorrect' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          onClick={() => setMode('incorrect')}
        >
          Incorrect Only
        </button>
        <button
          className={`ui-btn ${mode === 'all' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          onClick={() => setMode('all')}
        >
          All Answers
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="ui-card">
            <p className="text-xs text-muted">
              {item.subject_name} • {item.topic_name}
            </p>
            <h2 className="mt-1 font-semibold">{item.prompt}</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[item.image_url_1, item.image_url_2]
                .filter((url): url is string => Boolean(url))
                .map((imageUrl) => (
                  <img key={imageUrl} src={imageUrl} alt="Question" className="h-36 w-full rounded-xl object-cover" />
                ))}
            </div>
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
