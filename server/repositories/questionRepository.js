import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultQuestionsPath = path.join(currentDirectory, '..', 'data', 'questions.json');
let runtimeQuestionsPath = null;

function getQuestionsPath() {
  return process.env.MUNJE_QUESTIONS_PATH || runtimeQuestionsPath || defaultQuestionsPath;
}

function canFallbackToRuntimeFile(error) {
  return ['EACCES', 'ENOENT', 'EROFS', 'EPERM'].includes(error.code);
}

export async function findAllQuestions() {
  const contents = await readFile(getQuestionsPath(), 'utf8');
  return JSON.parse(contents);
}

export async function findQuestionById(id) {
  const questions = await findAllQuestions();
  return questions.find((question) => question.id === id) ?? null;
}

export async function findQuestionsByIds(ids) {
  const questions = await findAllQuestions();
  const questionMap = new Map(questions.map((question) => [question.id, question]));

  return ids.map((id) => questionMap.get(id)).filter(Boolean);
}

export async function saveAllQuestions(questions) {
  const serializedQuestions = `${JSON.stringify(questions, null, 2)}\n`;

  try {
    await writeFile(getQuestionsPath(), serializedQuestions);
  } catch (error) {
    if (process.env.MUNJE_QUESTIONS_PATH || !canFallbackToRuntimeFile(error)) {
      throw error;
    }

    runtimeQuestionsPath = path.join(os.tmpdir(), 'munje-questions.json');
    await writeFile(runtimeQuestionsPath, serializedQuestions);
  }

  return questions;
}
