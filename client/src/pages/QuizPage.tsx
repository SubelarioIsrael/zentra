import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { HelperAlert } from '../components/HelperAlert';
import type { Subject, Topic } from '../types';

type QuizQuestion = {
  id: number;
  prompt: string;
  topicName: string;
  subjectName: string;
  imageUrls?: string[];
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
  const [selectedOptionMap, setSelectedOptionMap] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
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
    setSelectedOptionMap({});
    setRemaining(mode === 'timed' ? durationSeconds : null);
  }

  async function answer(option: 'A' | 'B' | 'C' | 'D') {
    if (!attemptId || !currentQuestion || feedbackMap[currentQuestion.id]) return;

    const data = await apiRequest<Feedback>(`/quiz/${attemptId}/answer`, 'POST', {
      questionId: currentQuestion.id,
      answer: option,
      timeSpentSeconds: 0,
    });

    setSelectedOptionMap((prev) => ({ ...prev, [currentQuestion.id]: option }));
    setFeedbackMap((prev) => ({ ...prev, [currentQuestion.id]: data }));
  }

  async function confirmAnswer() {
    if (!currentQuestion) return;
    const selectedOption = selectedOptionMap[currentQuestion.id];
    if (!selectedOption) {
      setError('Pick an option first, then click Confirm answer.');
      return;
    }
    setError('');
    await answer(selectedOption);
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
      <div>
        <h1 className="text-2xl font-semibold">Quiz</h1>
        <p className="ui-subtitle mt-1">Short, focused rounds with instant feedback.</p>
      </div>
      <HelperAlert>During quiz: click an option to select it, then press Confirm answer.</HelperAlert>
      {error && <p className="text-red-600">{error}</p>}

      {!attemptId && (
        <section className="ui-card">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'timed' | 'untimed')}
                className="ui-input"
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
                className="ui-input"
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
                className="ui-input"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">Topics</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <label key={topic.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700">
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

          <button onClick={startQuiz} className="ui-btn-primary mt-4">
            Start Quiz
          </button>
        </section>
      )}

      {attemptId && currentQuestion && (
        <section className="ui-card">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <p>
              Question {index + 1} / {questions.length}
            </p>
            {mode === 'timed' && (
              <p className="rounded-full bg-accentSoft px-3 py-1 font-medium text-accent dark:bg-indigo-950/60 dark:text-indigo-300">
                Time: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            )}
          </div>

          <h2 className="text-lg font-semibold">{currentQuestion.prompt}</h2>
          <p className="mt-1 text-sm text-muted">
            {currentQuestion.subjectName} • {currentQuestion.topicName}
          </p>

          {Boolean(currentQuestion.imageUrls?.length) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {currentQuestion.imageUrls?.map((imageUrl) => (
                <img key={imageUrl} src={imageUrl} alt="Question" className="h-40 w-full rounded-xl object-cover" />
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((key) => {
              const questionFeedback = feedbackMap[currentQuestion.id];
              const selectedOption = selectedOptionMap[currentQuestion.id];

              let optionClassName =
                'rounded-xl border border-slate-300 px-3 py-2 text-left transition dark:border-slate-700';

              if (!questionFeedback && selectedOption === key) {
                optionClassName += ' border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30';
              } else if (!questionFeedback) {
                optionClassName += ' hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20';
              } else if (questionFeedback.correctOption === key) {
                optionClassName += ' border-green-500 bg-green-50 dark:bg-green-900/20';
              } else if (selectedOption === key && !questionFeedback.correct) {
                optionClassName += ' border-red-500 bg-red-50 dark:bg-red-900/20';
              }

              return (
                <button
                  key={key}
                  type="button"
                  disabled={Boolean(questionFeedback)}
                  onClick={() =>
                    setSelectedOptionMap((prev) => ({
                      ...prev,
                      [currentQuestion.id]: key,
                    }))
                  }
                  className={optionClassName}
                >
                  <span className="font-medium">{key}.</span> {currentQuestion.options[key]}
                </button>
              );
            })}
          </div>

          {feedbackMap[currentQuestion.id] && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70">
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
              className="ui-btn-secondary disabled:opacity-60"
            >
              Previous
            </button>
            <button
              onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
              disabled={index >= questions.length - 1}
              className="ui-btn-secondary disabled:opacity-60"
            >
              Next
            </button>
            <button
              onClick={confirmAnswer}
              disabled={Boolean(feedbackMap[currentQuestion.id])}
              className="ui-btn-primary"
            >
              Confirm answer
            </button>
            <button onClick={finishQuiz} className="ui-btn-primary ml-auto">
              Finish
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="ui-card">
          <h2 className="text-lg font-semibold">Quiz Result</h2>
          <p className="mt-2 text-muted">
            Score: {result.score}/{result.total} ({result.percent}%)
          </p>
        </section>
      )}
    </div>
  );
}
