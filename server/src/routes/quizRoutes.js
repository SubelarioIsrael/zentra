import { Router } from 'express';
import {
  dashboardSummary,
  finishQuiz,
  profileStats,
  reviewItems,
  startQuiz,
  submitAnswer,
} from '../controllers/quizController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/quiz/start', requireAuth, startQuiz);
router.post('/quiz/:attemptId/answer', requireAuth, submitAnswer);
router.post('/quiz/:attemptId/finish', requireAuth, finishQuiz);

router.get('/dashboard/summary', requireAuth, dashboardSummary);
router.get('/review', requireAuth, reviewItems);
router.get('/profile', requireAuth, profileStats);

export default router;
