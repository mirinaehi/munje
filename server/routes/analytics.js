import { Router } from 'express';
import { showLearningAnalytics, showStudentLearningAnalytics } from '../controllers/analyticsController.js';

export const analyticsRouter = Router();

analyticsRouter.get('/', showLearningAnalytics);
analyticsRouter.get('/student', showStudentLearningAnalytics);
