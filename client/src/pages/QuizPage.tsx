import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import type { Subject, Topic } from '../types';

type QuizQuestion = {
  id: number;
  prompt: string;
  topicName: string;
  subjectName: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
};

type Feedback = {
  correct: boolean;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

export function QuizPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [mode, setMode] = useState<'timed' | 'untimed'>('untimed');
  const [durationSeconds, setDurationSeconds] = useState(600);
  const [limit, setLimit] = useState(10);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, Feedback>>({});
  const [result, setResult] = useState<{ score: number; total: number; percent: number } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const subjectsData = await apiRequest<{ subjects: Subject[] }>('/subjects');

      const topicFetches = subjectsData.subjects.map((subject) =>
        apiRequest<{ topics: Topic[] }>(`/subjects/${subject.id}/topics`),
      );
      const allTopics = (await Promise.all(topicFetches)).flatMap((entry) => entry.topics);
      setTopics(allTopics);
      setSelectedTopicIds(allTopics.map((topic) => topic.id));
    })().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!attemptId || mode !== 'timed' || !remaining) return;

    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (!value) return 0;
        if (value <= 1) {
          window.clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attemptId, mode, remaining]);

  const currentQuestion = useMemo(() => questions[index], [questions, index]);

  async function startQuiz() {
    setError('');
    setResult(null);
    const data = await apiRequest<{ attemptId: number; questions: QuizQuestion[] }>('/quiz/start', 'POST', {
      mode,
      durationSeconds,
      topicIds: selectedTopicIds,
      questionLimit: limit,
    });

    setAttemptId(data.attemptId);
    setQuestions(data.questions);
    setIndex(0);
    setFeedbackMap({});
    setRemaining(mode === 'timed' ? durationSeconds : null);
  }

  async function answer(option: 'A' | 'B' | 'C' | 'D') {
    if (!attemptId || !currentQuestion || feedbackMap[currentQuestion.id]) return;

    const data = await apiRequest<Feedback>(`/quiz/${attemptId}/answer`, 'POST', {
      questionId: currentQuestion.id,
      answer: option,
      timeSpentSeconds: 0,
    });

    setFeedbackMap((prev) => ({ ...prev, [currentQuestion.id]: data }));
  }

  async function finishQuiz() {
    if (!attemptId) return;
    const data = await apiRequest<{ score: number; total: number; percent: number }>(`/quiz/${attemptId}/finish`, 'POST');
    setResult(data);
    setAttemptId(null);
  }

  const minutes = remaining !== null ? Math.floor(remaining / 60) : 0;
  const seconds = remaining !== null ? remaining % 60 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quiz</h1>
      {error && <p className="text-red-600">{error}</p>}

      {!attemptId && (
        <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'timed' | 'untimed')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="untimed">Untimed</option>
                <option value="timed">Timed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Duration (seconds)</label>
              <input
                type="number"
                min={60}
                value={durationSeconds}
                disabled={mode === 'untimed'}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Question limit</label>
              <input
                type="number"
                min={1}
                max={25}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">Topics</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <label key={topic.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedTopicIds.includes(topic.id)}
                    onChange={(e) => {
                      setSelectedTopicIds((prev) =>
                        e.target.checked ? [...prev, topic.id] : prev.filter((id) => id !== topic.id),
                      );
                    }}
                  />
                  {topic.name}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="mt-4 rounded-lg bg-accent px-4 py-2 font-medium text-white"
          >
            Start Quiz
          </button>
        </section>
      )}

      {attemptId && currentQuestion && (
        <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <p>
              Question {index + 1} / {questions.length}
            </p>
            {mode === 'timed' && (
              <p>
                Time: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            )}
          </div>

          <h2 className="text-lg font-semibold">{currentQuestion.prompt}</h2>
          <p className="mt-1 text-sm text-muted">
            {currentQuestion.subjectName} • {currentQuestion.topicName}
          </p>

          <div className="mt-4 grid gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <button
                key={key}
                disabled={Boolean(feedbackMap[currentQuestion.id])}
                onClick={() => answer(key)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="font-medium">{key}.</span> {currentQuestion.options[key]}
              </button>
            ))}
          </div>

          {feedbackMap[currentQuestion.id] && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p className={feedbackMap[currentQuestion.id].correct ? 'text-green-600' : 'text-red-600'}>
                {feedbackMap[currentQuestion.id].correct ? 'Correct' : 'Incorrect'}
              </p>
              <p className="mt-1 text-muted">Correct answer: {feedbackMap[currentQuestion.id].correctOption}</p>
              <p className="mt-1">{feedbackMap[currentQuestion.id].explanation}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={index === 0}
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-60 dark:border-slate-700"
            >
              Previous
            </button>
            <button
              onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
              disabled={index >= questions.length - 1}
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-60 dark:border-slate-700"
            >
              Next
            </button>
            <button onClick={finishQuiz} className="ml-auto rounded-lg bg-accent px-3 py-2 text-white">
              Finish
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="rounded-xl bg-panel p-4 shadow-panel dark:bg-darkPanel">
          <h2 className="text-lg font-semibold">Quiz Result</h2>
          <p className="mt-2 text-muted">
            Score: {result.score}/{result.total} ({result.percent}%)
          </p>
        </section>
      )}
    </div>
  );
}
