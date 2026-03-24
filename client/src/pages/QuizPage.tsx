import { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api/client';
import { HelperAlert } from '../components/HelperAlert';
import type { Subject, Topic } from '../types';

type QuizQuestion = {
  id: number;
  prompt: string;
  topicName: string;
  subjectName: string;
  imageUrls?: string[];
  hint?: string;
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
  const [shuffle, setShuffle] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, Feedback>>({});
  const [selectedOptionMap, setSelectedOptionMap] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [result, setResult] = useState<{ score: number; total: number; percent: number } | null>(null);
  const [questionTimings, setQuestionTimings] = useState<Record<number, number>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const questionStartTime = useRef<number>(0);

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

  const currentQuestion = useMemo(() => questions[index], [questions, index]);

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

  useEffect(() => {
    if (!attemptId || !currentQuestion) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      
      // A, B, C, D keys to select options
      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault();
        const option = key as 'A' | 'B' | 'C' | 'D';
        const questionFeedback = feedbackMap[currentQuestion.id];
        
        // Only allow selection if not already answered
        if (!questionFeedback) {
          setSelectedOptionMap((prev) => ({
            ...prev,
            [currentQuestion.id]: option,
          }));
        }
      }
      
      // Enter key to confirm answer
      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedOption = selectedOptionMap[currentQuestion.id];
        const questionFeedback = feedbackMap[currentQuestion.id];
        
        if (selectedOption && !questionFeedback) {
          answer(selectedOption);
        }
      }
      
      // Arrow keys to navigate
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((value) => Math.max(0, value - 1));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex((value) => Math.min(questions.length - 1, value + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [attemptId, currentQuestion, selectedOptionMap, feedbackMap, questions.length]);

  useEffect(() => {
    if (!attemptId || !currentQuestion) return;
    
    // Record time for previous question when moving to next one
    if (questionStartTime.current > 0) {
      const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
      setQuestionTimings((prev) => ({ ...prev, [currentQuestion.id]: timeSpent }));
    }
    
    // Start timing for new question
    questionStartTime.current = Date.now();
  }, [attemptId, currentQuestion?.id]);

  const incorrectQuestions = useMemo(() => {
    return questions.filter((q) => {
      const feedback = feedbackMap[q.id];
      return feedback && !feedback.correct;
    });
  }, [questions, feedbackMap]);

  const reviewQuestion = useMemo(() => {
    return reviewMode ? incorrectQuestions[reviewIndex] : null;
  }, [reviewMode, incorrectQuestions, reviewIndex]);

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function shuffleQuestions(quizQuestions: QuizQuestion[]): QuizQuestion[] {
    if (!shuffle) return quizQuestions;

    return shuffleArray(quizQuestions).map((question) => {
      const optionKeys = ['A', 'B', 'C', 'D'] as const;
      const optionValues = optionKeys.map((key) => question.options[key]);
      const shuffledValues = shuffleArray(optionValues);

      const newOptions: Record<'A' | 'B' | 'C' | 'D', string> = {
        A: shuffledValues[0],
        B: shuffledValues[1],
        C: shuffledValues[2],
        D: shuffledValues[3],
      };

      return {
        ...question,
        options: newOptions,
      };
    });
  }

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
    setQuestions(shuffleQuestions(data.questions));
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
      <HelperAlert>During quiz: click an option to select it, then press Confirm answer. <span className="text-xs">Or use A/B/C/D keys + Enter, arrow keys to navigate.</span></HelperAlert>
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

          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Shuffle questions & options</span>
            </label>
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
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="Question"
                  onClick={() => setExpandedImage(imageUrl)}
                  className="h-40 w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition"
                />
              ))}
            </div>
          )}

          {currentQuestion.hint && (
            <div className="mt-3">
              {revealedHints.has(currentQuestion.id) ? (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                  <p className="font-medium">Hint</p>
                  <p className="mt-1">{currentQuestion.hint}</p>
                </div>
              ) : (
                <button
                  onClick={() => setRevealedHints((prev) => new Set([...prev, currentQuestion.id]))}
                  className="ui-btn-secondary text-sm"
                >
                  Show Hint
                </button>
              )}
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

      {result && !reviewMode && (
        <section className="ui-card">
          <h2 className="text-lg font-semibold">Quiz Complete!</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
              <p className="text-sm text-muted">Your Score</p>
              <p className="mt-1 text-3xl font-bold text-indigo-600 dark:text-indigo-300">
                {result.score}/{result.total}
              </p>
              <p className="mt-1 text-sm font-medium">{result.percent}% Correct</p>
            </div>

            {Object.keys(questionTimings).length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-medium mb-3">Performance Stats</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted">Fastest</p>
                    <p className="font-semibold">{Math.min(...Object.values(questionTimings))}s</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Slowest</p>
                    <p className="font-semibold">{Math.max(...Object.values(questionTimings))}s</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Average</p>
                    <p className="font-semibold">
                      {Math.round(Object.values(questionTimings).reduce((a, b) => a + b, 0) / Object.values(questionTimings).length)}s
                    </p>
                  </div>
                </div>
              </div>
            )}

            {incorrectQuestions.length > 0 && (
              <div>
                <p className="text-sm text-muted mb-2">
                  {incorrectQuestions.length} question{incorrectQuestions.length !== 1 ? 's' : ''} to review
                </p>
                <button
                  onClick={() => setReviewMode(true)}
                  className="ui-btn-primary"
                >
                  Review Missed Questions
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setResult(null);
                setAttemptId(null);
                setReviewMode(false);
                setReviewIndex(0);
              }}
              className="ui-btn-secondary"
            >
              Start New Quiz
            </button>
          </div>
        </section>
      )}

      {result && reviewMode && reviewQuestion && (
        <section className="ui-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Review: Question {reviewIndex + 1}/{incorrectQuestions.length}</h2>
            <button
              onClick={() => setReviewMode(false)}
              className="text-sm text-accent hover:underline"
            >
              Back to Results
            </button>
          </div>

          <h3 className="text-base font-semibold mt-4">{reviewQuestion.prompt}</h3>
          <p className="mt-1 text-sm text-muted">
            {reviewQuestion.subjectName} • {reviewQuestion.topicName}
          </p>

          {questionTimings[reviewQuestion.id] && (
            <p className="mt-2 text-xs text-muted">Time spent: {questionTimings[reviewQuestion.id]}s</p>
          )}

          {Boolean(reviewQuestion.imageUrls?.length) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {reviewQuestion.imageUrls?.map((imageUrl) => (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="Question"
                  onClick={() => setExpandedImage(imageUrl)}
                  className="h-40 w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition"
                />
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((key) => {
              const feedback = feedbackMap[reviewQuestion.id];
              const selectedOption = selectedOptionMap[reviewQuestion.id];
              const isCorrect = feedback?.correctOption === key;
              const isUserAnswer = selectedOption === key;

              let optionClassName =
                'rounded-xl border px-3 py-2 text-left transition';

              if (isCorrect) {
                optionClassName += ' border-green-500 bg-green-50/30 dark:bg-green-900/20 dark:border-green-600';
              } else if (isUserAnswer && !isCorrect) {
                optionClassName += ' border-red-500 bg-red-50/30 dark:bg-red-900/20 dark:border-red-600';
              } else {
                optionClassName += ' border-slate-300 dark:border-slate-700';
              }

              return (
                <div key={key} className={optionClassName}>
                  <span className="font-medium">{key}.</span> {reviewQuestion.options[key]}
                  {isCorrect && <span className="ml-2 text-green-600 dark:text-green-400">✓</span>}
                  {isUserAnswer && !isCorrect && <span className="ml-2 text-red-600 dark:text-red-400">✗</span>}
                </div>
              );
            })}
          </div>

          {feedbackMap[reviewQuestion.id] && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-sm font-medium text-muted">Explanation</p>
              <p className="mt-2 text-sm">{feedbackMap[reviewQuestion.id].explanation}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
              disabled={reviewIndex === 0}
              className="ui-btn-secondary disabled:opacity-60"
            >
              Previous
            </button>
            <button
              onClick={() => setReviewIndex(Math.min(incorrectQuestions.length - 1, reviewIndex + 1))}
              disabled={reviewIndex >= incorrectQuestions.length - 1}
              className="ui-btn-secondary disabled:opacity-60"
            >
              Next
            </button>
            <button
              onClick={() => setReviewMode(false)}
              className="ui-btn-primary ml-auto"
            >
              Done Reviewing
            </button>
          </div>
        </section>
      )}

      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={expandedImage} alt="Zoomed" className="w-full h-full object-contain rounded-xl" />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
