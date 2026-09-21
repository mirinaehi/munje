import { randomUUID } from 'node:crypto';
import { findAllQuestions } from '../repositories/questionRepository.js';
import { findAllQuestionSets, saveAllQuestionSets } from '../repositories/questionSetRepository.js';
import { getRequiredUser } from './userService.js';

async function requireTeacher(userId) {
  const user = await getRequiredUser(userId);

  if (!user) return { error: { status: 404, message: '사용자를 찾을 수 없습니다.' } };
  if (user.role !== 'teacher') return { error: { status: 403, message: '교사만 문제 세트를 관리할 수 있습니다.' } };

  return { user };
}

function normalizeQuestionIds(questionIds) {
  if (!Array.isArray(questionIds)) return [];
  return [...new Set(questionIds.map((questionId) => String(questionId).trim()).filter(Boolean))];
}

async function validateQuestionIds(questionIds) {
  const questions = await findAllQuestions();
  const questionIdSet = new Set(questions.map((question) => question.id));
  const missingQuestionIds = questionIds.filter((questionId) => !questionIdSet.has(questionId));

  if (missingQuestionIds.length > 0) {
    return `존재하지 않는 문제가 포함되어 있습니다: ${missingQuestionIds.join(', ')}`;
  }

  return null;
}

function normalizeQuestionSetInput(input, teacherId, existingQuestionSet = {}) {
  return {
    ...existingQuestionSet,
    title: String(input.title ?? existingQuestionSet.title ?? '').trim(),
    description: String(input.description ?? existingQuestionSet.description ?? '').trim(),
    questions: normalizeQuestionIds(input.questions ?? existingQuestionSet.questions),
    isPublished: Boolean(input.isPublished ?? existingQuestionSet.isPublished ?? false),
    createdBy: existingQuestionSet.createdBy || teacherId,
    updatedAt: new Date().toISOString(),
  };
}

async function validateQuestionSet(questionSet) {
  if (!questionSet.title) return '문제 세트 제목이 필요합니다.';
  if (!questionSet.description) return '문제 세트 설명이 필요합니다.';
  if (questionSet.questions.length === 0) return '문제 세트에는 문제가 1개 이상 필요합니다.';
  return validateQuestionIds(questionSet.questions);
}

export async function getTeacherQuestionSets(userId) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questionSets = await findAllQuestionSets();
  return { questionSets };
}

export async function createTeacherQuestionSet(userId, input) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questionSets = await findAllQuestionSets();
  const questionSet = {
    id: `set-${randomUUID()}`,
    ...normalizeQuestionSetInput(input, authorization.user.id),
    createdAt: new Date().toISOString(),
  };
  const validationMessage = await validateQuestionSet(questionSet);

  if (validationMessage) {
    return { error: { status: 400, message: validationMessage } };
  }

  await saveAllQuestionSets([...questionSets, questionSet]);
  return { questionSet };
}

export async function updateTeacherQuestionSet(userId, questionSetId, input) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questionSets = await findAllQuestionSets();
  const questionSetIndex = questionSets.findIndex((questionSet) => questionSet.id === questionSetId);

  if (questionSetIndex === -1) {
    return { error: { status: 404, message: '문제 세트를 찾을 수 없습니다.' } };
  }

  const questionSet = normalizeQuestionSetInput(input, authorization.user.id, questionSets[questionSetIndex]);
  const validationMessage = await validateQuestionSet(questionSet);

  if (validationMessage) {
    return { error: { status: 400, message: validationMessage } };
  }

  const nextQuestionSets = questionSets.map((currentQuestionSet, index) => (
    index === questionSetIndex ? questionSet : currentQuestionSet
  ));
  await saveAllQuestionSets(nextQuestionSets);

  return { questionSet };
}

export async function deleteTeacherQuestionSet(userId, questionSetId) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questionSets = await findAllQuestionSets();
  const nextQuestionSets = questionSets.filter((questionSet) => questionSet.id !== questionSetId);

  if (nextQuestionSets.length === questionSets.length) {
    return { error: { status: 404, message: '문제 세트를 찾을 수 없습니다.' } };
  }

  await saveAllQuestionSets(nextQuestionSets);
  return { deletedId: questionSetId };
}
