import { requireData, supabase } from '../db/supabase.js';

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

async function getQuestionMaps(questionIds) {
  if (!questionIds.length) {
    return { questionMap: new Map(), topicMap: new Map(), subjectMap: new Map() };
  }

  const questionsResult = await supabase
    .from('questions')
    .select('id, topic_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation')
    .in('id', questionIds);
  const questions = requireData(questionsResult, 'Failed to fetch questions');

  const topicIds = [...new Set(questions.map((question) => question.topic_id))];
  const topicsResult = topicIds.length
    ? await supabase.from('topics').select('id, name, subject_id').in('id', topicIds)
    : { data: [], error: null };
  const topics = requireData(topicsResult, 'Failed to fetch topics');

  const subjectIds = [...new Set(topics.map((topic) => topic.subject_id))];
  const subjectsResult = subjectIds.length
    ? await supabase.from('subjects').select('id, name').in('id', subjectIds)
    : { data: [], error: null };
  const subjects = requireData(subjectsResult, 'Failed to fetch subjects');

  return {
    questionMap: new Map(questions.map((question) => [question.id, question])),
    topicMap: new Map(topics.map((topic) => [topic.id, topic])),
    subjectMap: new Map(subjects.map((subject) => [subject.id, subject])),
  };
}

export async function createAttempt({ userId, mode, durationSeconds, questionIds }) {
  const attemptResult = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      mode,
      duration_seconds: durationSeconds || null,
      total_questions: questionIds.length,
      score: 0,
    })
    .select('id')
    .single();

  const attempt = requireData(attemptResult, 'Failed to create attempt');

  const itemRows = questionIds.map((questionId) => ({
    attempt_id: attempt.id,
    question_id: questionId,
  }));

  const itemInsertResult = await supabase.from('quiz_attempt_items').insert(itemRows);
  requireData(itemInsertResult, 'Failed to create attempt items');

  return attempt.id;
}

export async function getQuestionsForAttempt(attemptId) {
  const itemResult = await supabase
    .from('quiz_attempt_items')
    .select('question_id')
    .eq('attempt_id', attemptId);
  const items = requireData(itemResult, 'Failed to fetch attempt items');

  const questionIds = items.map((item) => item.question_id);
  const { questionMap, topicMap, subjectMap } = await getQuestionMaps(questionIds);

  return questionIds
    .map((questionId) => {
      const question = questionMap.get(questionId);
      if (!question) {
        return null;
      }
      const topic = topicMap.get(question.topic_id);
      const subject = topic ? subjectMap.get(topic.subject_id) : null;
      return {
        id: question.id,
        prompt: question.prompt,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        explanation: question.explanation,
        topic_name: topic?.name || 'Unknown',
        subject_name: subject?.name || 'Unknown',
      };
    })
    .filter(Boolean);
}

export async function getQuestionAttemptItem(attemptId, questionId) {
  const itemResult = await supabase
    .from('quiz_attempt_items')
    .select('id, attempt_id, question_id, user_answer, is_correct, time_spent_seconds')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .maybeSingle();
  const item = requireData(itemResult, 'Failed to fetch attempt item');

  if (!item) {
    return null;
  }

  const questionResult = await supabase
    .from('questions')
    .select('correct_option, explanation')
    .eq('id', questionId)
    .maybeSingle();
  const question = requireData(questionResult, 'Failed to fetch answer key');

  if (!question) {
    return null;
  }

  return {
    ...item,
    correct_option: question.correct_option,
    explanation: question.explanation,
  };
}

export async function answerQuestion({ attemptId, questionId, answer, timeSpentSeconds }) {
  const item = await getQuestionAttemptItem(attemptId, questionId);
  if (!item) {
    return null;
  }

  const isCorrect = item.correct_option === answer;

  const updateResult = await supabase
    .from('quiz_attempt_items')
    .update({
      user_answer: answer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds || null,
    })
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId);
  requireData(updateResult, 'Failed to save answer');

  return {
    correct: isCorrect,
    correctOption: item.correct_option,
    explanation: item.explanation,
  };
}

export async function completeAttempt(attemptId) {
  const itemsResult = await supabase
    .from('quiz_attempt_items')
    .select('is_correct')
    .eq('attempt_id', attemptId);
  const items = requireData(itemsResult, 'Failed to summarize attempt');

  const total = items.length;
  const score = items.reduce((acc, item) => acc + (item.is_correct ? 1 : 0), 0);

  const updateResult = await supabase
    .from('quiz_attempts')
    .update({
      score,
      total_questions: total,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId);
  requireData(updateResult, 'Failed to complete attempt');

  return { score, total };
}

export async function getRandomQuestions({ topicIds = [], limit = 10 }) {
  const baseQuery = supabase.from('questions').select('id');
  const result = topicIds.length ? await baseQuery.in('topic_id', topicIds) : await baseQuery;
  const rows = requireData(result, 'Failed to fetch random question pool');

  const ids = rows.map((row) => row.id);
  return shuffle(ids).slice(0, limit);
}

export async function getDashboardSummary(userId) {
  const attemptsResult = await supabase
    .from('quiz_attempts')
    .select('id, score, total_questions')
    .eq('user_id', userId)
    .not('completed_at', 'is', null);
  const attempts = requireData(attemptsResult, 'Failed to fetch attempts');

  const totalQuizzes = attempts.length;
  const averageScore = totalQuizzes
    ? Number(
        (
          attempts.reduce((acc, attempt) => {
            const percent = attempt.total_questions ? (attempt.score * 100) / attempt.total_questions : 0;
            return acc + percent;
          }, 0) / totalQuizzes
        ).toFixed(2),
      )
    : 0;

  if (!attempts.length) {
    return {
      totalQuizzes,
      averageScore,
      weakTopics: [],
      topicAccuracy: [],
    };
  }

  const attemptIds = attempts.map((attempt) => attempt.id);
  const itemsResult = await supabase
    .from('quiz_attempt_items')
    .select('question_id, is_correct, user_answer')
    .in('attempt_id', attemptIds)
    .not('user_answer', 'is', null);
  const items = requireData(itemsResult, 'Failed to fetch attempt item analytics');

  if (!items.length) {
    return {
      totalQuizzes,
      averageScore,
      weakTopics: [],
      topicAccuracy: [],
    };
  }

  const questionIds = [...new Set(items.map((item) => item.question_id))];
  const { questionMap, topicMap } = await getQuestionMaps(questionIds);

  const statsByTopic = {};
  for (const item of items) {
    const question = questionMap.get(item.question_id);
    if (!question) {
      continue;
    }

    const topicId = question.topic_id;
    if (!statsByTopic[topicId]) {
      statsByTopic[topicId] = { total: 0, correct: 0 };
    }
    statsByTopic[topicId].total += 1;
    if (item.is_correct) {
      statsByTopic[topicId].correct += 1;
    }
  }

  const topicAccuracy = Object.entries(statsByTopic)
    .map(([topicId, stats]) => {
      const topic = topicMap.get(Number(topicId));
      const accuracy = stats.total ? Number(((stats.correct / stats.total) * 100).toFixed(2)) : 0;
      return {
        id: Number(topicId),
        name: topic?.name || 'Unknown',
        accuracy,
      };
    })
    .sort((first, second) => second.accuracy - first.accuracy);

  const weakTopics = topicAccuracy.filter((topic) => topic.accuracy < 70).slice(0, 5);

  return {
    totalQuizzes,
    averageScore,
    weakTopics,
    topicAccuracy,
  };
}

export async function getReviewItems(userId, mode = 'incorrect') {
  const attemptsResult = await supabase
    .from('quiz_attempts')
    .select('id, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null);
  const attempts = requireData(attemptsResult, 'Failed to fetch completed attempts');

  if (!attempts.length) {
    return [];
  }

  const completedAtByAttempt = new Map(attempts.map((attempt) => [attempt.id, attempt.completed_at]));
  const attemptIds = attempts.map((attempt) => attempt.id);

  let itemQuery = supabase
    .from('quiz_attempt_items')
    .select('id, attempt_id, question_id, user_answer, is_correct')
    .in('attempt_id', attemptIds)
    .not('user_answer', 'is', null);

  if (mode === 'incorrect') {
    itemQuery = itemQuery.eq('is_correct', false);
  }

  const itemsResult = await itemQuery;
  const items = requireData(itemsResult, 'Failed to fetch review items');
  if (!items.length) {
    return [];
  }

  const questionIds = [...new Set(items.map((item) => item.question_id))];
  const { questionMap, topicMap, subjectMap } = await getQuestionMaps(questionIds);

  return items
    .map((item) => {
      const question = questionMap.get(item.question_id);
      if (!question) {
        return null;
      }
      const topic = topicMap.get(question.topic_id);
      const subject = topic ? subjectMap.get(topic.subject_id) : null;
      return {
        id: item.id,
        user_answer: item.user_answer,
        is_correct: item.is_correct,
        prompt: question.prompt,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_option: question.correct_option,
        explanation: question.explanation,
        topic_name: topic?.name || 'Unknown',
        subject_name: subject?.name || 'Unknown',
        completed_at: completedAtByAttempt.get(item.attempt_id),
      };
    })
    .filter(Boolean)
    .sort((first, second) => new Date(second.completed_at).getTime() - new Date(first.completed_at).getTime());
}

export async function getRecentAttempts(userId) {
  const result = await supabase
    .from('quiz_attempts')
    .select('id, mode, score, total_questions, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10);

  return requireData(result, 'Failed to fetch recent attempts');
}
