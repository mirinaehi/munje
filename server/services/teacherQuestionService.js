import { randomUUID } from 'node:crypto';
import { findAllQuestions, saveAllQuestions } from '../repositories/questionRepository.js';
import { getRequiredUser } from './userService.js';

async function requireTeacher(userId) {
  const user = await getRequiredUser(userId);

  if (!user) {
    return { error: { status: 404, message: '사용자를 찾을 수 없습니다.' } };
  }

  if (user.role !== 'teacher') {
    return { error: { status: 403, message: '교사만 문제를 관리할 수 있습니다.' } };
  }

  return { user };
}

function normalizeChoices(choices) {
  if (!Array.isArray(choices)) return [];
  return choices.map((choice) => String(choice).trim()).filter(Boolean);
}

function normalizeQuestionType(type) {
  if (['multiple-choice', 'short-answer', 'sql'].includes(type)) return type;
  return 'multiple-choice';
}

function normalizeQuestionInput(input, teacherId, existingQuestion = {}) {
  const type = normalizeQuestionType(input.type ?? existingQuestion.type);
  const choices = normalizeChoices(input.choices);
  const rawAnswer = input.answer ?? existingQuestion.answer;
  const answer = type === 'multiple-choice'
    ? rawAnswer === null || rawAnswer === undefined || rawAnswer === ''
      ? null
      : Number(rawAnswer)
    : String(rawAnswer ?? '').trim();
  const acceptedAnswers = Array.isArray(input.acceptedAnswers)
    ? input.acceptedAnswers.map((acceptedAnswer) => String(acceptedAnswer).trim()).filter(Boolean)
    : undefined;
  const score = Number(input.score);
  const normalizedQuestion = {
    ...existingQuestion,
    type,
    title: String(input.title ?? existingQuestion.title ?? '').trim(),
    content: String(input.content ?? existingQuestion.content ?? '').trim(),
    answer,
    score: Number.isFinite(score) && score > 0 ? score : 5,
    difficulty: input.difficulty || existingQuestion.difficulty || 'easy',
    unit: String(input.unit ?? existingQuestion.unit ?? '교사용 문제').trim(),
    explanation: String(input.explanation ?? existingQuestion.explanation ?? '').trim(),
    createdBy: existingQuestion.createdBy || teacherId,
    updatedAt: new Date().toISOString(),
  };

  if (type === 'multiple-choice') {
    normalizedQuestion.choices = choices;
  } else {
    delete normalizedQuestion.choices;
  }

  if (acceptedAnswers) {
    normalizedQuestion.acceptedAnswers = acceptedAnswers.length > 0 ? acceptedAnswers : [answer].filter(Boolean);
  } else if (type !== 'multiple-choice') {
    normalizedQuestion.acceptedAnswers = [answer].filter(Boolean);
  } else {
    delete normalizedQuestion.acceptedAnswers;
  }

  return normalizedQuestion;
}

function validateQuestion(question) {
  if (!question.title) return '문제 제목이 필요합니다.';
  if (!question.content) return '문제 내용이 필요합니다.';
  if (question.type === 'multiple-choice') {
    if (question.choices.length < 2) return '객관식 보기는 2개 이상 필요합니다.';
    if (question.answer === null) return '정답이 미정입니다. 정답 번호를 선택하세요.';
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) {
      return '정답 번호가 보기 범위를 벗어났습니다.';
    }
  }
  if (question.type === 'short-answer' || question.type === 'sql') {
    if (!question.answer) return '주관식 또는 SQL 문제는 정답 예시가 필요합니다.';
  }
  if (!question.explanation) return '해설이 필요합니다.';
  return null;
}

export async function getTeacherQuestions(userId) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questions = await findAllQuestions();
  return { questions };
}

export async function createTeacherQuestion(userId, input) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questions = await findAllQuestions();
  const question = {
    id: `q-${randomUUID()}`,
    ...normalizeQuestionInput(input, authorization.user.id),
    createdAt: new Date().toISOString(),
  };
  const validationMessage = validateQuestion(question);

  if (validationMessage) {
    return { error: { status: 400, message: validationMessage } };
  }

  await saveAllQuestions([...questions, question]);
  return { question };
}

export async function updateTeacherQuestion(userId, questionId, input) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questions = await findAllQuestions();
  const questionIndex = questions.findIndex((question) => question.id === questionId);

  if (questionIndex === -1) {
    return { error: { status: 404, message: '문제를 찾을 수 없습니다.' } };
  }

  const question = normalizeQuestionInput(input, authorization.user.id, questions[questionIndex]);
  const validationMessage = validateQuestion(question);

  if (validationMessage) {
    return { error: { status: 400, message: validationMessage } };
  }

  const nextQuestions = questions.map((currentQuestion, index) => (
    index === questionIndex ? question : currentQuestion
  ));
  await saveAllQuestions(nextQuestions);

  return { question };
}

export async function deleteTeacherQuestion(userId, questionId) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const questions = await findAllQuestions();
  const nextQuestions = questions.filter((question) => question.id !== questionId);

  if (nextQuestions.length === questions.length) {
    return { error: { status: 404, message: '문제를 찾을 수 없습니다.' } };
  }

  await saveAllQuestions(nextQuestions);
  return { deletedId: questionId };
}
