import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { HelperAlert } from '../components/HelperAlert';

type MistakeItem = {
  id: number;
  questionId: number;
  userAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  status: 'open' | 'mastered';
  retryCount: number;
  updatedAt: string;
  prompt: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  imageUrls?: string[];
  explanation: string;
  topicName: string;
  subjectName: string;
};

export function ReviewPage() {
  const [mode, setMode] = useState<'open' | 'mastered' | 'all'>('open');
  const [items, setItems] = useState<MistakeItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function loadItems(selectedMode: 'open' | 'mastered' | 'all') {
    const data = await apiRequest<{ items: MistakeItem[] }>(`/mistakes?status=${selectedMode}`);
    setItems(data.items);
  }

  useEffect(() => {
    setError('');
    loadItems(mode)
      .catch((err) => setError(err.message));
  }, [mode]);

  async function retryItem(item: MistakeItem) {
    const answer = selectedAnswers[item.id];
    if (!answer) {
      setError('Select an answer before retrying.');
      return;
    }

    setError('');
    setBusyItemId(item.id);

    try {
      const result = await apiRequest<{ correct: boolean; status: 'open' | 'mastered'; retryCount: number }>(
        `/mistakes/${item.id}/retry`,
        'POST',
        { answer },
      );

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                userAnswer: answer,
                status: result.status,
                retryCount: result.retryCount,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function markMastered(itemId: number) {
    setError('');
    setBusyItemId(itemId);
    try {
      await apiRequest(`/mistakes/${itemId}`, 'PUT', { status: 'mastered' });
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                status: 'mastered',
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mistake Notebook</h1>
        <p className="ui-subtitle mt-1">Retry weak questions, then mark them mastered when ready.</p>
      </div>
      <HelperAlert>Stay on Open to focus only on unresolved mistakes.</HelperAlert>
      <div className="flex gap-2">
        <button
          className={`ui-btn ${mode === 'open' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          onClick={() => setMode('open')}
        >
          Open
        </button>
        <button
          className={`ui-btn ${mode === 'mastered' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          onClick={() => setMode('mastered')}
        >
          Mastered
        </button>
        <button
          className={`ui-btn ${mode === 'all' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          onClick={() => setMode('all')}
        >
          All
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="ui-card">
            <p className="text-xs text-muted">
              {item.subjectName} • {item.topicName}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-1 ${item.status === 'mastered' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}
              >
                {item.status === 'mastered' ? 'Mastered' : 'Open'}
              </span>
              <span className="text-muted">Retries: {item.retryCount}</span>
            </div>
            <h2 className="mt-1 font-semibold">{item.prompt}</h2>
            {!!item.imageUrls?.length && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {item.imageUrls.map((imageUrl) => (
                  <img key={imageUrl} src={imageUrl} alt="Question" className="h-36 w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
            <p className="mt-2 text-sm text-muted">
              Your answer: {item.userAnswer || '-'} | Correct: {item.correctOption}
            </p>
            <p className="mt-2 text-sm">{item.explanation}</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const isSelected = selectedAnswers[item.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAnswers((prev) => ({ ...prev, [item.id]: key }))}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500' : 'border-slate-300 dark:border-slate-700'}`}
                  >
                    <span className="font-medium">{key}.</span> {item.options[key]}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => retryItem(item)}
                disabled={busyItemId === item.id || item.status === 'mastered'}
                className="ui-btn-primary disabled:opacity-60"
              >
                Retry
              </button>
              <button
                onClick={() => markMastered(item.id)}
                disabled={busyItemId === item.id || item.status === 'mastered'}
                className="ui-btn-secondary disabled:opacity-60"
              >
                Mark Mastered
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="text-muted">No mistake notebook items yet.</p>}
      </div>
    </div>
  );
}
