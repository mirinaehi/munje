import { Router } from 'express';
import {
  createQuestion,
  deleteQuestion,
  listTeacherQuestions,
  updateQuestion,
} from '../controllers/teacherQuestionController.js';

export const teacherQuestionsRouter = Router();

teacherQuestionsRouter.get('/', listTeacherQuestions);
teacherQuestionsRouter.post('/', createQuestion);
teacherQuestionsRouter.put('/:id', updateQuestion);
teacherQuestionsRouter.delete('/:id', deleteQuestion);
