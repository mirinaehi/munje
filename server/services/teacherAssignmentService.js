import { findAllAssignments, saveAllAssignments } from '../repositories/assignmentRepository.js';
import { findAllQuestionSets } from '../repositories/questionSetRepository.js';
import { findAllUsers, findUserById } from '../repositories/userRepository.js';
import { getRequiredUser } from './userService.js';

async function requireTeacher(userId) {
  const user = await getRequiredUser(userId);

  if (!user) return { error: { status: 404, message: '사용자를 찾을 수 없습니다.' } };
  if (user.role !== 'teacher') return { error: { status: 403, message: '교사만 문제 세트를 배정할 수 있습니다.' } };

  return { user };
}

function normalizeQuestionSetIds(questionSetIds) {
  if (!Array.isArray(questionSetIds)) return [];
  return [...new Set(questionSetIds.map((questionSetId) => String(questionSetId).trim()).filter(Boolean))];
}

async function validateAssignmentTarget(studentId, questionSetIds) {
  const student = await findUserById(studentId);

  if (!student || student.role !== 'student') {
    return '학생 사용자를 찾을 수 없습니다.';
  }

  const questionSets = await findAllQuestionSets();
  const questionSetIdSet = new Set(questionSets.map((questionSet) => questionSet.id));
  const missingQuestionSetIds = questionSetIds.filter((questionSetId) => !questionSetIdSet.has(questionSetId));

  if (missingQuestionSetIds.length > 0) {
    return `존재하지 않는 문제 세트가 포함되어 있습니다: ${missingQuestionSetIds.join(', ')}`;
  }

  return null;
}

export async function getTeacherAssignments(userId) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const users = await findAllUsers();
  const assignments = await findAllAssignments();
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.userId, assignment.questionSetIds]));

  return {
    assignments: users
      .filter((user) => user.role === 'student')
      .map((student) => ({
        userId: student.id,
        name: student.name,
        questionSetIds: assignmentMap.get(student.id) ?? [],
      })),
  };
}

export async function updateTeacherAssignment(userId, studentId, questionSetIds) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const nextQuestionSetIds = normalizeQuestionSetIds(questionSetIds);
  const validationMessage = await validateAssignmentTarget(studentId, nextQuestionSetIds);

  if (validationMessage) {
    return { error: { status: 400, message: validationMessage } };
  }

  const assignments = await findAllAssignments();
  const assignmentIndex = assignments.findIndex((assignment) => assignment.userId === studentId);
  const nextAssignment = { userId: studentId, questionSetIds: nextQuestionSetIds };
  const nextAssignments = assignmentIndex === -1
    ? [...assignments, nextAssignment]
    : assignments.with(assignmentIndex, nextAssignment);

  await saveAllAssignments(nextAssignments);

  return { assignment: nextAssignment };
}
