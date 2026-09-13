import { findContextsByIds } from '../repositories/contextRepository.js';
import { findQuestionsByIds } from '../repositories/questionRepository.js';
import { findAllQuestionSets, findQuestionSetById } from '../repositories/questionSetRepository.js';
import { toPublicQuestion } from './questionService.js';

function toQuestionSetSummary(questionSet) {
  return {
    id: questionSet.id,
    title: questionSet.title,
    description: questionSet.description,
    questionCount: questionSet.questions.length,
    isPublished: questionSet.isPublished,
  };
}

export async function getQuestionSets() {
  const questionSets = await findAllQuestionSets();
  return questionSets.filter((questionSet) => questionSet.isPublished).map(toQuestionSetSummary);
}

export async function getQuestionSet(id) {
  const questionSet = await findQuestionSetById(id);

  if (!questionSet || !questionSet.isPublished) return null;

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
