import {
  createQuestionReport,
  createQuestion,
  createQuestionsBulk,
  createSubject,
  createTopic,
  deleteQuestion,
  deleteSubject,
  deleteTopic,
  getQuestionsByTopic,
  getSubjectsWithTopicCount,
  getTopicsBySubject,
  updateQuestion,
  updateSubject,
  updateTopic,
} from '../models/subjectModel.js';
import { supabase } from '../db/supabase.js';

export async function listSubjects(_req, res) {
  return res.json({ subjects: await getSubjectsWithTopicCount() });
}

export async function listTopics(req, res) {
  const subjectId = Number(req.params.subjectId);
  return res.json({ topics: await getTopicsBySubject(subjectId) });
}

export async function listQuestions(req, res) {
  const topicId = Number(req.params.topicId);
  return res.json({ questions: await getQuestionsByTopic(topicId) });
}

export async function createSubjectHandler(req, res) {
  const subject = await createSubject(req.body);
  return res.status(201).json({ subject });
}

export async function updateSubjectHandler(req, res) {
  const id = Number(req.params.id);
  const subject = await updateSubject(id, req.body);
  return res.json({ subject });
}

export async function deleteSubjectHandler(req, res) {
  const id = Number(req.params.id);
  await deleteSubject(id);
  return res.status(204).send();
}

export async function createTopicHandler(req, res) {
  const topic = await createTopic({
    subjectId: Number(req.params.subjectId),
    ...req.body,
  });
  return res.status(201).json({ topic });
}

export async function updateTopicHandler(req, res) {
  const id = Number(req.params.id);
  const topic = await updateTopic(id, req.body);
  return res.json({ topic });
}

export async function deleteTopicHandler(req, res) {
  const id = Number(req.params.id);
  await deleteTopic(id);
  return res.status(204).send();
}

export async function createQuestionHandler(req, res) {
  const topicId = Number(req.params.topicId);
  const question = await createQuestion({ topicId, ...req.body });
  return res.status(201).json({ question });
}

export async function importQuestionsHandler(req, res) {
  const topicId = Number(req.params.topicId);
  const { questions } = req.body;

  if (!Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ message: 'questions must be a non-empty array.' });
  }

  if (questions.length > 300) {
    return res.status(400).json({ message: 'Maximum 300 questions per import.' });
  }

  const allowedOptions = new Set(['A', 'B', 'C', 'D']);

  for (let index = 0; index < questions.length; index += 1) {
    const row = questions[index] || {};
    const options = row.options || {};

    if (!String(row.prompt || '').trim()) {
      return res.status(400).json({ message: `Row ${index + 1}: prompt is required.` });
    }

    if (!String(options.A || '').trim() || !String(options.B || '').trim() || !String(options.C || '').trim() || !String(options.D || '').trim()) {
      return res.status(400).json({ message: `Row ${index + 1}: options A, B, C, and D are required.` });
    }

    if (!allowedOptions.has(String(row.correctOption || '').toUpperCase())) {
      return res.status(400).json({ message: `Row ${index + 1}: correctOption must be A, B, C, or D.` });
    }
  }

  const normalizedQuestions = questions.map((row) => ({
    prompt: String(row.prompt || '').trim(),
    options: {
      A: String(row.options?.A || '').trim(),
      B: String(row.options?.B || '').trim(),
      C: String(row.options?.C || '').trim(),
      D: String(row.options?.D || '').trim(),
    },
    correctOption: String(row.correctOption || '').toUpperCase(),
    explanation: row.explanation ? String(row.explanation).trim() : '',
    hint: row.hint ? String(row.hint).trim() : '',
    questionImages: Array.isArray(row.questionImages) ? row.questionImages : [],
  }));

  const inserted = await createQuestionsBulk({ topicId, questions: normalizedQuestions });
  return res.status(201).json({ importedCount: inserted.length });
}

export async function updateQuestionHandler(req, res) {
  const id = Number(req.params.id);
  const question = await updateQuestion(id, req.body);
  return res.json({ question });
}

export async function deleteQuestionHandler(req, res) {
  const id = Number(req.params.id);
  await deleteQuestion(id);
  return res.status(204).send();
}

export async function reportQuestionHandler(req, res) {
  const questionId = Number(req.params.id);
  const { reason, details } = req.body;

  if (!questionId) {
    return res.status(400).json({ message: 'Valid question id is required.' });
  }

  if (!String(reason || '').trim()) {
    return res.status(400).json({ message: 'Reason is required.' });
  }

  const report = await createQuestionReport({
    questionId,
    userId: req.user.id,
    reason: String(reason).trim(),
    details: details ? String(details).trim() : null,
  });

  if (!report) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  return res.status(201).json({ report });
}

export async function uploadQuestionImageHandler(req, res) {
  try {
    const { fileData, fileName, fileType } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ message: 'fileData and fileName are required.' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    const storagePath = `question-images/${req.user.id}/${Date.now()}-${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('zen-questions')
      .upload(storagePath, buffer, {
        contentType: fileType || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(400).json({ 
        message: `Upload failed: ${error.message}. Make sure the 'zen-questions' bucket exists in Supabase Storage.` 
      });
    }

    if (!data) {
      console.error('No data returned from upload');
      return res.status(400).json({ message: 'Upload succeeded but no data returned' });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('zen-questions')
      .getPublicUrl(storagePath);

    if (!publicUrlData?.publicUrl) {
      return res.status(400).json({ message: 'Could not generate public URL' });
    }

    return res.status(201).json({ imageUrl: publicUrlData.publicUrl });
  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({ message: `File upload error: ${err.message}` });
  }
}
