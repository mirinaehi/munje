import { Router } from 'express';
import { listTeacherAssignments, updateAssignment } from '../controllers/teacherAssignmentController.js';

export const teacherAssignmentsRouter = Router();

teacherAssignmentsRouter.get('/', listTeacherAssignments);
teacherAssignmentsRouter.put('/:studentId', updateAssignment);
