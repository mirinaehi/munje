import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findAllQuestions } from '../repositories/questionRepository.js';
import { findQuestionSetById } from '../repositories/questionSetRepository.js';
import { getQuestionSet, getQuestionSets } from './questionSetService.js';
import { isCorrectAnswer, toPublicQuestion } from './questionService.js';
import { createSubmission } from './submissionService.js';
import { getAssignedQuestionSetIds } from './assignmentService.js';
import { getLearningAnalytics, getStudentLearningAnalytics } from './analyticsService.js';
import {
  getTeacherAssignments,
  updateTeacherAssignment,
} from './teacherAssignmentService.js';
import {
  createTeacherQuestionSet,
  deleteTeacherQuestionSet,
  getTeacherQuestionSets,
  updateTeacherQuestionSet,
} from './teacherQuestionSetService.js';
import {
  createTeacherQuestion,
  deleteTeacherQuestion,
  getTeacherQuestions,
  updateTeacherQuestion,
} from './teacherQuestionService.js';
import { getCurrentUser, getUsers } from './userService.js';

const sampleQuestion = {
  id: 'q001',
  type: 'multiple-choice',
  content: '예시 문제',
  choices: ['보기 1', '보기 2'],
  answer: 1,
  explanation: '보기 2가 정답입니다.',
};

test('공개 문제에서 정답과 해설을 제거한다', () => {
  const publicQuestion = toPublicQuestion(sampleQuestion);

  assert.equal('answer' in publicQuestion, false);
  assert.equal('explanation' in publicQuestion, false);
  assert.equal(publicQuestion.id, sampleQuestion.id);
});

test('공개 빈칸 문제에서 빈칸 정답을 제거한다', () => {
  const publicQuestion = toPublicQuestion({
    id: 'q002',
    type: 'fill-blank',
    blanks: [
      {
        id: 'fallback',
        label: '빈칸',
        answers: ['DEFAULT_USER_PROFILE'],
      },
    ],
  });

  assert.equal('answers' in publicQuestion.blanks[0], false);
});

test('객관식 답안을 정확히 채점한다', () => {
  assert.equal(isCorrectAnswer(sampleQuestion, 1), true);
  assert.equal(isCorrectAnswer(sampleQuestion, 0), false);
  assert.equal(isCorrectAnswer(sampleQuestion, '1'), false);
});

test('단답형 답안을 공백과 대소문자 차이를 줄여 채점한다', () => {
  const question = {
    type: 'short-answer',
    answer: 'Jin',
    acceptedAnswers: ['Jin'],
  };

  assert.equal(isCorrectAnswer(question, ' jin '), true);
  assert.equal(isCorrectAnswer(question, 'Mina'), false);
});

test('빈칸 답안을 빈칸 ID별로 채점한다', () => {
  const question = {
    type: 'fill-blank',
    blanks: [
      {
        id: 'fallback',
        answers: ['DEFAULT_USER_PROFILE'],
      },
    ],
  };

  assert.equal(isCorrectAnswer(question, { fallback: 'DEFAULT_USER_PROFILE' }), true);
  assert.equal(isCorrectAnswer(question, { fallback: 'USER_PROFILES.jin' }), false);
});

test('SQL 답안을 기본 정규화 후 채점한다', () => {
  const question = {
    type: 'sql',
    answer: 'SELECT 제목, 가격 FROM 도서 WHERE 가격 >= 15000;',
  };

  assert.equal(isCorrectAnswer(question, 'select 제목, 가격 from 도서 where 가격 >= 15000'), true);
  assert.equal(isCorrectAnswer(question, 'SELECT * FROM 도서'), false);
});

test('공개된 문제 세트 목록을 요약해서 제공한다', async () => {
  const questionSets = await getQuestionSets();

  assert.equal(questionSets.length, 2);
  assert.equal(questionSets[0].id, 'set-sql-library-rental');
  assert.equal(questionSets[0].questionCount, 25);
});

test('학생에게 배정된 문제 세트만 제공한다', async () => {
  const questionSets = await getQuestionSets('student-minseo');

  assert.deepEqual(
    questionSets.map((questionSet) => questionSet.id),
    ['set-sql-library-rental', 'set-sql-subquery-view'],
  );
});

test('문제 세트의 문제를 지정된 순서대로 제공한다', async () => {
  const questionSet = await getQuestionSet('set-sql-library-rental');

  assert.equal(questionSet.totalScore, 250);
  assert.deepEqual(questionSet.questions.slice(0, 3).map((question) => question.id), ['sql-book-001', 'sql-book-002', 'sql-book-003']);
  assert.equal('answer' in questionSet.questions[0], false);
  assert.equal('acceptedAnswers' in questionSet.questions[0], false);
});

test('문제 세트의 공통 지문을 중복 없이 제공한다', async () => {
  const questionSet = await getQuestionSet('set-sql-library-rental');

  assert.equal(questionSet.contexts.length, 1);
  assert.equal(questionSet.contexts[0].id, 'context-sql-library-rental-schema');
  assert.equal(questionSet.questions.every((question) => question.contextId === 'context-sql-library-rental-schema'), true);
});

test('데이터베이스 구조 지문을 SQL 세트에 제공한다', async () => {
  const questionSet = await getQuestionSet('set-sql-library-rental');

  assert.equal(questionSet.contexts[0].type, 'database-schema');
  assert.equal(questionSet.contexts[0].tables.length, 3);
});

test('문제 세트 제출을 채점하고 JSON 파일에 저장한다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-submissions-'));
  const submissionsPath = path.join(temporaryDirectory, 'submissions.json');
  process.env.MUNJE_SUBMISSIONS_PATH = submissionsPath;
  await writeFile(submissionsPath, '[]\n');
  const questionSet = await findQuestionSetById('set-sql-library-rental');
  const questions = await findAllQuestions();
  const questionMap = new Map(questions.map((question) => [question.id, question]));

  const result = await createSubmission({
    userId: 'student-minseo',
    questionSetId: 'set-sql-library-rental',
    answers: questionSet.questions.map((questionId) => ({
      questionId,
      answer: questionMap.get(questionId).answer,
    })),
  });

  const savedSubmissions = JSON.parse(await readFile(submissionsPath, 'utf8'));

  assert.equal(result.submission.userId, 'student-minseo');
  assert.equal(result.submission.attempt, 1);
  assert.equal(result.submission.answers.length, 25);
  assert.equal(result.submission.score, 250);
  assert.equal(savedSubmissions.length, 1);
  assert.equal(savedSubmissions[0].id, result.submission.id);

  delete process.env.MUNJE_SUBMISSIONS_PATH;
});

test('임시 사용자 목록과 현재 사용자를 공개 정보로 제공한다', async () => {
  const users = await getUsers();
  const currentUser = await getCurrentUser();

  assert.equal(users.length, 2);
  assert.equal(currentUser.id, 'student-minseo');
  assert.equal(currentUser.role, 'student');
  assert.equal('email' in currentUser, false);
});

test('교사 계정은 문제 세트를 제출할 수 없다', async () => {
  const result = await createSubmission({
    userId: 'teacher-hyun',
    questionSetId: 'set-sql-library-rental',
    answers: [
      { questionId: 'sql-book-001', answer: 'SELECT 제목, 가격 FROM 도서 WHERE 가격 >= 15000;' },
    ],
  });

  assert.equal(result.error.status, 403);
});

test('교사는 문제를 생성, 수정, 삭제할 수 있다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-questions-'));
  const questionsPath = path.join(temporaryDirectory, 'questions.json');
  process.env.MUNJE_QUESTIONS_PATH = questionsPath;
  await writeFile(questionsPath, '[]\n');

  const created = await createTeacherQuestion('teacher-hyun', {
    title: '테스트 객관식',
    content: '정답은 몇 번인가요?',
    choices: ['오답', '정답'],
    answer: 1,
    score: 3,
    difficulty: 'easy',
    unit: '테스트 단원',
    explanation: '두 번째 보기가 정답입니다.',
  });
  const listed = await getTeacherQuestions('teacher-hyun');
  const updated = await updateTeacherQuestion('teacher-hyun', created.question.id, {
    ...created.question,
    title: '수정된 객관식',
    choices: ['오답', '정답', '오답 2'],
    answer: 1,
  });
  const deleted = await deleteTeacherQuestion('teacher-hyun', created.question.id);
  const savedQuestions = JSON.parse(await readFile(questionsPath, 'utf8'));

  assert.equal(created.question.createdBy, 'teacher-hyun');
  assert.equal(listed.questions.length, 1);
  assert.equal(updated.question.title, '수정된 객관식');
  assert.equal(deleted.deletedId, created.question.id);
  assert.equal(savedQuestions.length, 0);

  delete process.env.MUNJE_QUESTIONS_PATH;
});

test('학생은 문제를 관리할 수 없다', async () => {
  const result = await createTeacherQuestion('student-minseo', {
    title: '권한 없는 문제',
    content: '학생은 만들 수 없습니다.',
    choices: ['아니오', '예'],
    answer: 0,
    explanation: '학생 권한은 문제 관리가 제한됩니다.',
  });

  assert.equal(result.error.status, 403);
});

test('교사는 문제 세트를 생성, 수정, 삭제할 수 있다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-question-sets-'));
  const questionSetsPath = path.join(temporaryDirectory, 'questionSets.json');
  process.env.MUNJE_QUESTION_SETS_PATH = questionSetsPath;
  await writeFile(questionSetsPath, '[]\n');

  const created = await createTeacherQuestionSet('teacher-hyun', {
    title: '테스트 세트',
    description: '테스트용 문제 세트입니다.',
    questions: ['sql-book-001', 'sql-book-002'],
    isPublished: false,
  });
  const listed = await getTeacherQuestionSets('teacher-hyun');
  const updated = await updateTeacherQuestionSet('teacher-hyun', created.questionSet.id, {
    ...created.questionSet,
    title: '수정된 테스트 세트',
    questions: ['sql-book-002', 'sql-book-001'],
    isPublished: true,
  });
  const deleted = await deleteTeacherQuestionSet('teacher-hyun', created.questionSet.id);
  const savedQuestionSets = JSON.parse(await readFile(questionSetsPath, 'utf8'));

  assert.equal(created.questionSet.createdBy, 'teacher-hyun');
  assert.equal(listed.questionSets.length, 1);
  assert.deepEqual(updated.questionSet.questions, ['sql-book-002', 'sql-book-001']);
  assert.equal(updated.questionSet.isPublished, true);
  assert.equal(deleted.deletedId, created.questionSet.id);
  assert.equal(savedQuestionSets.length, 0);

  delete process.env.MUNJE_QUESTION_SETS_PATH;
});

test('학생은 문제 세트를 관리할 수 없다', async () => {
  const result = await createTeacherQuestionSet('student-minseo', {
    title: '권한 없는 세트',
    description: '학생은 만들 수 없습니다.',
    questions: ['sql-book-001'],
  });

  assert.equal(result.error.status, 403);
});

test('교사는 학생에게 문제 세트를 배정할 수 있다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-assignments-'));
  const assignmentsPath = path.join(temporaryDirectory, 'assignments.json');
  process.env.MUNJE_ASSIGNMENTS_PATH = assignmentsPath;
  await writeFile(assignmentsPath, '[]\n');

  const listed = await getTeacherAssignments('teacher-hyun');
  const updated = await updateTeacherAssignment('teacher-hyun', 'student-minseo', ['set-sql-library-rental']);
  const assignedQuestionSetIds = await getAssignedQuestionSetIds('student-minseo');
  const savedAssignments = JSON.parse(await readFile(assignmentsPath, 'utf8'));

  assert.equal(listed.assignments[0].userId, 'student-minseo');
  assert.deepEqual(updated.assignment.questionSetIds, ['set-sql-library-rental']);
  assert.deepEqual(assignedQuestionSetIds, ['set-sql-library-rental']);
  assert.equal(savedAssignments.length, 1);

  delete process.env.MUNJE_ASSIGNMENTS_PATH;
});

test('학생은 문제 세트를 배정할 수 없다', async () => {
  const result = await updateTeacherAssignment('student-minseo', 'student-minseo', ['set-sql-library-rental']);

  assert.equal(result.error.status, 403);
});

test('교사는 제출 기록 기반 학습 분석을 확인할 수 있다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-analytics-'));
  const submissionsPath = path.join(temporaryDirectory, 'submissions.json');
  process.env.MUNJE_SUBMISSIONS_PATH = submissionsPath;
  await writeFile(submissionsPath, JSON.stringify([
    {
      id: 'submission-test',
      userId: 'student-minseo',
      questionSetId: 'set-sql-library-rental',
      attempt: 1,
      status: 'submitted',
      submittedAt: '2026-09-13T00:00:00.000Z',
      score: 5,
      totalScore: 10,
      answers: [
        { questionId: 'sql-book-001', correct: true, score: 10, maxScore: 10 },
        { questionId: 'sql-book-002', correct: false, score: 0, maxScore: 10 },
      ],
    },
  ], null, 2));

  const analytics = await getLearningAnalytics('teacher-hyun');

  assert.equal(analytics.summary.submissionCount, 1);
  assert.equal(analytics.summary.averageScoreRate, 50);
  assert.equal(analytics.studentStats[0].name, '민서');
  assert.equal(analytics.questionStats.find((stat) => stat.questionId === 'sql-book-002').accuracy, 0);

  delete process.env.MUNJE_SUBMISSIONS_PATH;
});

test('학생은 학습 분석을 확인할 수 없다', async () => {
  const result = await getLearningAnalytics('student-minseo');

  assert.equal(result.error.status, 403);
});

test('학생은 자신의 학습 기록을 확인할 수 있다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-student-analytics-'));
  const submissionsPath = path.join(temporaryDirectory, 'submissions.json');
  process.env.MUNJE_SUBMISSIONS_PATH = submissionsPath;
  await writeFile(submissionsPath, JSON.stringify([
    {
      id: 'submission-student-test',
      userId: 'student-minseo',
      questionSetId: 'set-sql-library-rental',
      attempt: 1,
      status: 'submitted',
      submittedAt: '2026-09-13T00:00:00.000Z',
      score: 5,
      totalScore: 10,
      answers: [
        { questionId: 'sql-book-001', correct: true, score: 10, maxScore: 10 },
        { questionId: 'sql-book-002', correct: false, score: 0, maxScore: 10 },
      ],
    },
    {
      id: 'submission-other-student',
      userId: 'another-student',
      questionSetId: 'set-sql-library-rental',
      attempt: 1,
      status: 'submitted',
      submittedAt: '2026-09-13T01:00:00.000Z',
      score: 10,
      totalScore: 10,
      answers: [
        { questionId: 'sql-book-001', correct: true, score: 10, maxScore: 10 },
        { questionId: 'sql-book-002', correct: true, score: 10, maxScore: 10 },
      ],
    },
  ], null, 2));

  const analytics = await getStudentLearningAnalytics('student-minseo');

  assert.equal(analytics.summary.submissionCount, 1);
  assert.equal(analytics.summary.accuracy, 50);
  assert.equal(analytics.missedQuestions[0].questionId, 'sql-book-002');

  delete process.env.MUNJE_SUBMISSIONS_PATH;
});

test('교사는 학생 전용 학습 기록을 확인할 수 없다', async () => {
  const result = await getStudentLearningAnalytics('teacher-hyun');

  assert.equal(result.error.status, 403);
});
