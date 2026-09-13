import { findAssignmentByUserId } from '../repositories/assignmentRepository.js';

export async function getAssignedQuestionSetIds(userId) {
  const assignment = await findAssignmentByUserId(userId);
  return assignment?.questionSetIds ?? [];
}
