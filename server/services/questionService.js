import { findAllQuestions, findQuestionById } from '../repositories/questionRepository.js';

export function toPublicQuestion(question) {
  const { answer, explanation, ...publicQuestion } = question;
  return publicQuestion;
}

export function isCorrectAnswer(question, answer) {
  return Number.isInteger(answer) && answer === question.answer;
}

export async function getQuestions() {
  const questions = await findAllQuestions();
  return questions.map(toPublicQuestion);
}

export async function checkQuestionAnswer(id, answer) {
  const question = await findQuestionById(id);

  if (!question) return null;

  return {
    questionId: question.id,
    correct: isCorrectAnswer(question, answer),
    submittedAnswer: answer,
    correctAnswer: question.answer,
    explanation: question.explanation,
    score: question.score,
  };
}
