import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getQuestionSet, getQuestionSets } from './questionSetService.js';
import { isCorrectAnswer, toPublicQuestion } from './questionService.js';
import { createSubmission } from './submissionService.js';
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

  assert.equal(questionSets.length, 3);
  assert.equal(questionSets[0].id, 'set-js-object-basics');
  assert.equal(questionSets[0].questionCount, 5);
});

test('문제 세트의 문제를 지정된 순서대로 제공한다', async () => {
  const questionSet = await getQuestionSet('set-js-object-basics');

  assert.equal(questionSet.totalScore, 25);
  assert.deepEqual(questionSet.questions.map((question) => question.id), ['q016', 'q017', 'q018', 'q019', 'q020']);
  assert.equal('answer' in questionSet.questions[0], false);
  assert.equal('acceptedAnswers' in questionSet.questions[3], false);
  assert.equal('answers' in questionSet.questions[4].blanks[0], false);
});

test('문제 세트의 공통 지문을 중복 없이 제공한다', async () => {
  const questionSet = await getQuestionSet('set-js-object-basics');

  assert.equal(questionSet.contexts.length, 1);
  assert.equal(questionSet.contexts[0].id, 'context-js-user-profiles');
  assert.equal(questionSet.questions.every((question) => question.contextId === 'context-js-user-profiles'), true);
});

test('데이터베이스 구조 지문을 SQL 세트에 제공한다', async () => {
  const questionSet = await getQuestionSet('set-sql-select-basics');

  assert.equal(questionSet.contexts[0].type, 'database-schema');
  assert.equal(questionSet.contexts[0].tables.length, 3);
});

test('문제 세트 제출을 채점하고 JSON 파일에 저장한다', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'munje-submissions-'));
  const submissionsPath = path.join(temporaryDirectory, 'submissions.json');
  process.env.MUNJE_SUBMISSIONS_PATH = submissionsPath;
  await writeFile(submissionsPath, '[]\n');

  const result = await createSubmission({
    userId: 'student-minseo',
    questionSetId: 'set-js-object-basics',
    answers: [
      { questionId: 'q016', answer: 1 },
      { questionId: 'q017', answer: 4 },
      { questionId: 'q018', answer: 3 },
      { questionId: 'q019', answer: 'Jin' },
      { questionId: 'q020', answer: { fallback: 'DEFAULT_USER_PROFILE' } },
    ],
  });

  const savedSubmissions = JSON.parse(await readFile(submissionsPath, 'utf8'));

  assert.equal(result.submission.userId, 'student-minseo');
  assert.equal(result.submission.attempt, 1);
  assert.equal(result.submission.answers.length, 5);
  assert.equal(result.submission.score, 25);
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
    questionSetId: 'set-js-object-basics',
    answers: [
      { questionId: 'q016', answer: 1 },
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
