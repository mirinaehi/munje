import { findContextsByIds } from '../repositories/contextRepository.js';
import { findQuestionsByIds } from '../repositories/questionRepository.js';
import { findAllQuestionSets, findQuestionSetById } from '../repositories/questionSetRepository.js';
import { getAssignedQuestionSetIds } from './assignmentService.js';
import { toPublicQuestion } from './questionService.js';
import { getRequiredUser } from './userService.js';

function toQuestionSetSummary(questionSet) {
  return {
    id: questionSet.id,
    title: questionSet.title,
    description: questionSet.description,
    questionCount: questionSet.questions.length,
    isPublished: questionSet.isPublished,
  };
}

async function filterQuestionSetsForUser(questionSets, userId) {
  if (!userId) return questionSets;

  const user = await getRequiredUser(userId);

  if (!user || user.role !== 'student') return questionSets;

  const assignedQuestionSetIds = await getAssignedQuestionSetIds(user.id);
  return questionSets.filter((questionSet) => assignedQuestionSetIds.includes(questionSet.id));
}

export async function getQuestionSets(userId) {
  const questionSets = await findAllQuestionSets();
  const publishedQuestionSets = questionSets.filter((questionSet) => questionSet.isPublished);
  const visibleQuestionSets = await filterQuestionSetsForUser(publishedQuestionSets, userId);

  return visibleQuestionSets.map(toQuestionSetSummary);
}

export async function getQuestionSet(id, userId) {
  const questionSet = await findQuestionSetById(id);

  if (!questionSet || !questionSet.isPublished) return null;

  const visibleQuestionSets = await filterQuestionSetsForUser([questionSet], userId);
  if (visibleQuestionSets.length === 0) return null;

  const questions = await findQuestionsByIds(questionSet.questions);
  const publicQuestions = questions.map(toPublicQuestion);
  const contextIds = [...new Set(publicQuestions.map((question) => question.contextId).filter(Boolean))];
  const contexts = await findContextsByIds(contextIds);

  return {
    ...toQuestionSetSummary(questionSet),
    totalScore: publicQuestions.reduce((sum, question) => sum + question.score, 0),
    contexts,
    questions: publicQuestions,
  };
}
