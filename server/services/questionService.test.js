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

test('객관식 답안을 정확히 채점한다', () => {
  assert.equal(isCorrectAnswer(sampleQuestion, 1), true);
  assert.equal(isCorrectAnswer(sampleQuestion, 0), false);
  assert.equal(isCorrectAnswer(sampleQuestion, '1'), false);
});

test('공개된 문제 세트 목록을 요약해서 제공한다', async () => {
  const questionSets = await getQuestionSets();

  assert.equal(questionSets.length, 1);
  assert.equal(questionSets[0].id, 'set-js-object-basics');
  assert.equal(questionSets[0].questionCount, 3);
});

test('문제 세트의 문제를 지정된 순서대로 제공한다', async () => {
  const questionSet = await getQuestionSet('set-js-object-basics');

  assert.equal(questionSet.totalScore, 15);
  assert.deepEqual(questionSet.questions.map((question) => question.id), ['q016', 'q017', 'q018']);
  assert.equal('answer' in questionSet.questions[0], false);
});
