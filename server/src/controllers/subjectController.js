import {
  createQuestion,
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
      return res.status(400).json({ message: `Upload failed: ${error.message}` });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('zen-questions')
      .getPublicUrl(storagePath);

    return res.status(201).json({ imageUrl: publicUrlData.publicUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'File upload error' });
  }
}
