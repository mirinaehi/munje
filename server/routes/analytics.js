import { Router } from 'express';
import { showLearningAnalytics } from '../controllers/analyticsController.js';

export const analyticsRouter = Router();

analyticsRouter.get('/', showLearningAnalytics);
