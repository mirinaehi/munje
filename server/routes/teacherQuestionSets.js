import { Router } from 'express';
import {
  createQuestionSet,
  deleteQuestionSet,
  listTeacherQuestionSets,
  updateQuestionSet,
} from '../controllers/teacherQuestionSetController.js';

export const teacherQuestionSetsRouter = Router();

teacherQuestionSetsRouter.get('/', listTeacherQuestionSets);
teacherQuestionSetsRouter.post('/', createQuestionSet);
teacherQuestionSetsRouter.put('/:id', updateQuestionSet);
teacherQuestionSetsRouter.delete('/:id', deleteQuestionSet);
