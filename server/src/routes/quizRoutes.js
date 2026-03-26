import { Router } from 'express';
import {
  dashboardSummary,
  finishQuiz,
  mistakeItems,
  patchMistakeStatus,
  profileStats,
  retryMistakeItem,
  reviewItems,
  saveMistake,
  spacedReviewQueue,
  startQuiz,
  submitAnswer,
} from '../controllers/quizController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/quiz/start', requireAuth, startQuiz);
router.post('/quiz/:attemptId/answer', requireAuth, submitAnswer);
router.post('/quiz/:attemptId/finish', requireAuth, finishQuiz);
router.post('/quiz/:attemptId/mistakes', requireAuth, saveMistake);

router.get('/dashboard/summary', requireAuth, dashboardSummary);
router.get('/review', requireAuth, reviewItems);
router.get('/mistakes', requireAuth, mistakeItems);
router.get('/mistakes/queue', requireAuth, spacedReviewQueue);
router.post('/mistakes/:id/retry', requireAuth, retryMistakeItem);
router.patch('/mistakes/:id', requireAuth, patchMistakeStatus);
router.put('/mistakes/:id', requireAuth, patchMistakeStatus);
router.get('/profile', requireAuth, profileStats);

export default router;
