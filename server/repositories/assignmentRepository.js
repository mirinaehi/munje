import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultAssignmentsPath = path.join(currentDirectory, '..', 'data', 'assignments.json');
let runtimeAssignmentsPath = null;

function getAssignmentsPath() {
  return process.env.MUNJE_ASSIGNMENTS_PATH || runtimeAssignmentsPath || defaultAssignmentsPath;
}

function canFallbackToRuntimeFile(error) {
  return ['EACCES', 'ENOENT', 'EROFS', 'EPERM'].includes(error.code);
}

export async function findAllAssignments() {
  const contents = await readFile(getAssignmentsPath(), 'utf8');
  return JSON.parse(contents);
}

export async function findAssignmentByUserId(userId) {
  const assignments = await findAllAssignments();
  return assignments.find((assignment) => assignment.userId === userId) ?? null;
}

export async function saveAllAssignments(assignments) {
  const serializedAssignments = `${JSON.stringify(assignments, null, 2)}\n`;

  try {
    await writeFile(getAssignmentsPath(), serializedAssignments);
  } catch (error) {
    if (process.env.MUNJE_ASSIGNMENTS_PATH || !canFallbackToRuntimeFile(error)) {
      throw error;
    }

    runtimeAssignmentsPath = path.join(os.tmpdir(), 'munje-assignments.json');
    await writeFile(runtimeAssignmentsPath, serializedAssignments);
  }

  return assignments;
}
