import {
  answerQuestion,
  completeAttempt,
  createAttempt,
  getDashboardSummary,
  getQuestionsForAttempt,
  getRandomQuestions,
  getRecentAttempts,
  getReviewItems,
} from '../models/quizModel.js';
import { findUserById, updateUserStreak } from '../models/userModel.js';

export async function startQuiz(req, res) {
  const { mode = 'untimed', durationSeconds = null, topicIds = [], questionLimit = 10 } = req.body;

  if (!['timed', 'untimed'].includes(mode)) {
    return res.status(400).json({ message: 'Mode must be timed or untimed.' });
  }

  const questionIds = await getRandomQuestions({
    topicIds: Array.isArray(topicIds) ? topicIds.map(Number) : [],
    limit: Math.max(1, Math.min(25, Number(questionLimit) || 10)),
  });

  if (!questionIds.length) {
    return res.status(400).json({ message: 'No questions available for selected topics.' });
  }

  const attemptId = await createAttempt({
    userId: req.user.id,
    mode,
    durationSeconds: mode === 'timed' ? Number(durationSeconds) || 600 : null,
    questionIds,
  });

  const questions = (await getQuestionsForAttempt(attemptId)).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    topicName: q.topic_name,
    subjectName: q.subject_name,
    imageUrls: [q.image_url_1, q.image_url_2].filter(Boolean),
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d,
    },
  }));

  return res.status(201).json({
    attemptId,
    mode,
    durationSeconds: mode === 'timed' ? Number(durationSeconds) || 600 : null,
    questions,
  });
}

export async function submitAnswer(req, res) {
  const attemptId = Number(req.params.attemptId);
  const { questionId, answer, timeSpentSeconds } = req.body;

  if (!['A', 'B', 'C', 'D'].includes(answer)) {
    return res.status(400).json({ message: 'Answer must be one of A/B/C/D.' });
  }

  const result = await answerQuestion({
    attemptId,
    questionId: Number(questionId),
    answer,
    timeSpentSeconds: Number(timeSpentSeconds) || null,
  });

  if (!result) {
    return res.status(404).json({ message: 'Question/attempt not found.' });
  }

  return res.json(result);
}

export async function finishQuiz(req, res) {
  const attemptId = Number(req.params.attemptId);
  const summary = await completeAttempt(attemptId);
  await updateUserStreak(req.user.id);

  return res.json({
    score: summary.score,
    total: summary.total,
    percent: summary.total ? Number(((summary.score / summary.total) * 100).toFixed(2)) : 0,
  });
}

export async function dashboardSummary(req, res) {
  const user = await findUserById(req.user.id);
  const summary = await getDashboardSummary(req.user.id);

  return res.json({
    ...summary,
    streakCount: user?.streak_count || 0,
  });
}

export async function reviewItems(req, res) {
  const mode = req.query.mode === 'all' ? 'all' : 'incorrect';
  const items = await getReviewItems(req.user.id, mode);
  return res.json({ items });
}

export async function profileStats(req, res) {
  const user = await findUserById(req.user.id);
  const summary = await getDashboardSummary(req.user.id);
  const recentAttempts = await getRecentAttempts(req.user.id);

  return res.json({
    user,
    summary,
    recentAttempts,
  });
}
