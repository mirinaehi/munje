import { Router } from 'express';
import { submitQuestionSet } from '../controllers/submissionController.js';

export const submissionsRouter = Router();

submissionsRouter.post('/', submitQuestionSet);
