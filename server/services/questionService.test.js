import assert from 'node:assert/strict';
import test from 'node:test';
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
