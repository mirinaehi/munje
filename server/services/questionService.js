import { findAllQuestions, findQuestionById } from '../repositories/questionRepository.js';

export function toPublicQuestion(question) {
  const { answer, acceptedAnswers, explanation, ...publicQuestion } = question;

  if (publicQuestion.blanks) {
    publicQuestion.blanks = publicQuestion.blanks.map(({ answers, ...blank }) => blank);
  }

  return publicQuestion;
}

function normalizeText(value) {
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeSql(value) {
  return normalizeText(value).replace(/;$/, '');
}

function getAcceptedAnswers(question) {
  return question.acceptedAnswers ?? [question.answer];
}

function isShortAnswerCorrect(question, answer) {
  if (typeof answer !== 'string') return false;

  return getAcceptedAnswers(question).some((acceptedAnswer) => (
    normalizeText(answer) === normalizeText(acceptedAnswer)
  ));
}

function isFillBlankCorrect(question, answer) {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return false;

  return question.blanks.every((blank) => (
    blank.answers.some((acceptedAnswer) => (
      normalizeText(answer[blank.id] ?? '') === normalizeText(acceptedAnswer)
    ))
  ));
}

function isSqlAnswerCorrect(question, answer) {
  if (typeof answer !== 'string') return false;

  return getAcceptedAnswers(question).some((acceptedAnswer) => (
    normalizeSql(answer) === normalizeSql(acceptedAnswer)
  ));
}

export function isCorrectAnswer(question, answer) {
  if (question.type === 'multiple-choice') {
    return Number.isInteger(answer) && answer === question.answer;
  }

  if (question.type === 'short-answer') {
    return isShortAnswerCorrect(question, answer);
  }

  if (question.type === 'fill-blank') {
    return isFillBlankCorrect(question, answer);
  }

  if (question.type === 'sql') {
    return isSqlAnswerCorrect(question, answer);
  }

  return false;
}

function getCorrectAnswer(question) {
  if (question.type === 'fill-blank') {
    return Object.fromEntries(question.blanks.map((blank) => [blank.id, blank.answers[0]]));
  }

  return question.answer;
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
    correctAnswer: getCorrectAnswer(question),
    explanation: question.explanation,
    score: question.score,
  };
}
