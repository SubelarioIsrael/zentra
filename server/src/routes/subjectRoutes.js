import { Router } from 'express';
import {
  createQuestionHandler,
  createSubjectHandler,
  createTopicHandler,
  deleteQuestionHandler,
  deleteSubjectHandler,
  deleteTopicHandler,
  listQuestions,
  listSubjects,
  listTopics,
  updateQuestionHandler,
  updateSubjectHandler,
  updateTopicHandler,
  uploadQuestionImageHandler,
} from '../controllers/subjectController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validate.js';

const router = Router();

router.get('/subjects', requireAuth, listSubjects);
router.post('/subjects', requireAuth, validateRequired(['name']), createSubjectHandler);
router.put('/subjects/:id', requireAuth, validateRequired(['name']), updateSubjectHandler);
router.delete('/subjects/:id', requireAuth, deleteSubjectHandler);

router.get('/subjects/:subjectId/topics', requireAuth, listTopics);
router.post('/subjects/:subjectId/topics', requireAuth, validateRequired(['name']), createTopicHandler);
router.put('/topics/:id', requireAuth, validateRequired(['name']), updateTopicHandler);
router.delete('/topics/:id', requireAuth, deleteTopicHandler);

router.get('/topics/:topicId/questions', requireAuth, listQuestions);
router.post('/topics/:topicId/questions', requireAuth, validateRequired(['prompt', 'options', 'correctOption']), createQuestionHandler);
router.put('/questions/:id', requireAuth, validateRequired(['prompt', 'options', 'correctOption']), updateQuestionHandler);
router.delete('/questions/:id', requireAuth, deleteQuestionHandler);

router.post('/upload/question-image', requireAuth, uploadQuestionImageHandler);

export default router;
