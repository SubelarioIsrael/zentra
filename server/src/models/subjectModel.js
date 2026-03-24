import { requireData, supabase } from '../db/supabase.js';

export async function getSubjectsWithTopicCount() {
  const subjectsResult = await supabase
    .from('subjects')
    .select('id, name, description, created_at')
    .order('name', { ascending: true });
  const subjects = requireData(subjectsResult, 'Failed to fetch subjects');

  const topicRefsResult = await supabase.from('topics').select('subject_id');
  const topicRefs = requireData(topicRefsResult, 'Failed to fetch topic refs');

  const countBySubject = topicRefs.reduce((acc, row) => {
    acc[row.subject_id] = (acc[row.subject_id] || 0) + 1;
    return acc;
  }, {});

  return subjects.map((subject) => ({
    ...subject,
    topic_count: countBySubject[subject.id] || 0,
  }));
}

export async function getTopicsBySubject(subjectId) {
  const topicsResult = await supabase
    .from('topics')
    .select('id, subject_id, name, description, created_at')
    .eq('subject_id', subjectId)
    .order('name', { ascending: true });
  const topics = requireData(topicsResult, 'Failed to fetch topics');

  if (!topics.length) {
    return [];
  }

  const topicIds = topics.map((topic) => topic.id);
  const questionRefsResult = await supabase.from('questions').select('topic_id').in('topic_id', topicIds);
  const questionRefs = requireData(questionRefsResult, 'Failed to fetch question refs');

  const countByTopic = questionRefs.reduce((acc, row) => {
    acc[row.topic_id] = (acc[row.topic_id] || 0) + 1;
    return acc;
  }, {});

  return topics.map((topic) => ({
    ...topic,
    question_count: countByTopic[topic.id] || 0,
  }));
}

export async function createSubject({ name, description }) {
  const result = await supabase
    .from('subjects')
    .insert({ name, description: description || null })
    .select('*')
    .single();
  return requireData(result, 'Failed to create subject');
}

export async function updateSubject(id, { name, description }) {
  const result = await supabase
    .from('subjects')
    .update({ name, description: description || null })
    .eq('id', id)
    .select('*')
    .single();
  return requireData(result, 'Failed to update subject');
}

export async function deleteSubject(id) {
  const result = await supabase.from('subjects').delete().eq('id', id);
  requireData(result, 'Failed to delete subject');
}

export async function createTopic({ subjectId, name, description }) {
  const result = await supabase
    .from('topics')
    .insert({ subject_id: subjectId, name, description: description || null })
    .select('*')
    .single();
  return requireData(result, 'Failed to create topic');
}

export async function updateTopic(id, { name, description }) {
  const result = await supabase
    .from('topics')
    .update({ name, description: description || null })
    .eq('id', id)
    .select('*')
    .single();
  return requireData(result, 'Failed to update topic');
}

export async function deleteTopic(id) {
  const result = await supabase.from('topics').delete().eq('id', id);
  requireData(result, 'Failed to delete topic');
}

export async function createQuestion({ topicId, prompt, options, correctOption, explanation, hint, questionImages = [] }) {
  const images = Array.isArray(questionImages)
    ? questionImages.map((image) => String(image || '').trim()).filter(Boolean).slice(0, 2)
    : [];

  const result = await supabase
    .from('questions')
    .insert({
      topic_id: topicId,
      prompt,
      option_a: options.A,
      option_b: options.B,
      option_c: options.C,
      option_d: options.D,
      correct_option: correctOption,
      image_url_1: images[0] || null,
      image_url_2: images[1] || null,
      explanation: explanation || null,
      hint: hint || null,
    })
    .select('*')
    .single();

  return requireData(result, 'Failed to create question');
}

export async function updateQuestion(id, { prompt, options, correctOption, explanation, hint, questionImages = [] }) {
  const images = Array.isArray(questionImages)
    ? questionImages.map((image) => String(image || '').trim()).filter(Boolean).slice(0, 2)
    : [];

  const result = await supabase
    .from('questions')
    .update({
      prompt,
      option_a: options.A,
      option_b: options.B,
      option_c: options.C,
      option_d: options.D,
      correct_option: correctOption,
      image_url_1: images[0] || null,
      image_url_2: images[1] || null,
      explanation: explanation || null,
      hint: hint || null,
    })
    .eq('id', id)
    .select('*')
    .single();

  return requireData(result, 'Failed to update question');
}

export async function deleteQuestion(id) {
  const result = await supabase.from('questions').delete().eq('id', id);
  requireData(result, 'Failed to delete question');
}

export async function getQuestionsByTopic(topicId) {
  const result = await supabase
    .from('questions')
    .select('id, topic_id, prompt, option_a, option_b, option_c, option_d, correct_option, image_url_1, image_url_2, explanation, hint')
    .eq('topic_id', topicId)
    .order('id', { ascending: false });

  return requireData(result, 'Failed to fetch questions');
}
