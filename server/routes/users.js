import { Router } from 'express';
import { listUsers, showCurrentUser } from '../controllers/userController.js';

export const usersRouter = Router();

usersRouter.get('/', listUsers);
usersRouter.get('/current', showCurrentUser);
