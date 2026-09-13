import { Router } from 'express';
import { listQuestions, submitQuestionAnswer } from '../controllers/questionController.js';

export const questionsRouter = Router();

questionsRouter.get('/', listQuestions);
questionsRouter.post('/:id/check', submitQuestionAnswer);
