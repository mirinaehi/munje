import { randomUUID } from 'node:crypto';
import { findQuestionsByIds } from '../repositories/questionRepository.js';
import { findQuestionSetById } from '../repositories/questionSetRepository.js';
import { findAllSubmissions, saveSubmission } from '../repositories/submissionRepository.js';
import { isCorrectAnswer } from './questionService.js';

function getCorrectAnswer(question) {
  if (question.type === 'fill-blank') {
    return Object.fromEntries(question.blanks.map((blank) => [blank.id, blank.answers[0]]));
  }

  return question.answer;
}

function gradeAnswer(question, answer) {
  const correct = isCorrectAnswer(question, answer);

  return {
    questionId: question.id,
    answer,
    correct,
    score: correct ? question.score : 0,
    maxScore: question.score,
    correctAnswer: getCorrectAnswer(question),
    explanation: question.explanation,
  };
}

function getAttemptNumber(submissions, userId, questionSetId) {
  return submissions.filter((submission) => (
    submission.userId === userId && submission.questionSetId === questionSetId
  )).length + 1;
}

export async function createSubmission({ userId = 'student-minseo', questionSetId, answers }) {
  if (!questionSetId) {
    return { error: { status: 400, message: '문제 세트 ID가 필요합니다.' } };
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return { error: { status: 400, message: '제출할 답안이 필요합니다.' } };
  }

  const questionSet = await findQuestionSetById(questionSetId);

  if (!questionSet || !questionSet.isPublished) {
    return { error: { status: 404, message: '문제 세트를 찾을 수 없습니다.' } };
  }

  const questions = await findQuestionsByIds(questionSet.questions);
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
  const gradedAnswers = questionSet.questions.map((questionId) => {
    const question = questionMap.get(questionId);
    return gradeAnswer(question, answerMap.get(questionId));
  });
  const missingQuestionIds = gradedAnswers
    .filter((answer) => answer.answer === undefined || answer.answer === null || answer.answer === '')
    .map((answer) => answer.questionId);

  if (missingQuestionIds.length > 0) {
    return {
      error: {
        status: 400,
        message: '모든 문제의 답안을 제출해야 합니다.',
      },
    };
  }

  const submissions = await findAllSubmissions();
  const totalScore = gradedAnswers.reduce((sum, answer) => sum + answer.maxScore, 0);
  const score = gradedAnswers.reduce((sum, answer) => sum + answer.score, 0);
  const submittedAt = new Date().toISOString();
  const submission = {
    id: `submission-${randomUUID()}`,
    userId,
    questionSetId,
    attempt: getAttemptNumber(submissions, userId, questionSetId),
    status: 'submitted',
    submittedAt,
    score,
    totalScore,
    answers: gradedAnswers,
  };

  return { submission: await saveSubmission(submission) };
}
