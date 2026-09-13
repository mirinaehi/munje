import assert from 'node:assert/strict';
import test from 'node:test';
import { getQuestionSet, getQuestionSets } from './questionSetService.js';
import { isCorrectAnswer, toPublicQuestion } from './questionService.js';

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
