import { Router } from 'express';
import { listQuestionSets, showQuestionSet } from '../controllers/questionSetController.js';

export const questionSetsRouter = Router();

questionSetsRouter.get('/', listQuestionSets);
questionSetsRouter.get('/:id', showQuestionSet);
