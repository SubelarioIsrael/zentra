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
