import { findAllQuestions } from '../repositories/questionRepository.js';
import { findAllSubmissions } from '../repositories/submissionRepository.js';
import { findAllUsers } from '../repositories/userRepository.js';
import { getRequiredUser } from './userService.js';

async function requireTeacher(userId) {
  const user = await getRequiredUser(userId);

  if (!user) return { error: { status: 404, message: '사용자를 찾을 수 없습니다.' } };
  if (user.role !== 'teacher') return { error: { status: 403, message: '교사만 학습 분석을 확인할 수 있습니다.' } };

  return { user };
}

async function requireStudent(userId) {
  const user = await getRequiredUser(userId);

  if (!user) return { error: { status: 404, message: '사용자를 찾을 수 없습니다.' } };
  if (user.role !== 'student') return { error: { status: 403, message: '학생만 자신의 학습 기록을 확인할 수 있습니다.' } };

  return { user };
}

function toPercent(numerator, denominator) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function getOrCreate(map, key, factory) {
  if (!map.has(key)) map.set(key, factory());
  return map.get(key);
}

export async function getLearningAnalytics(userId) {
  const authorization = await requireTeacher(userId);
  if (authorization.error) return authorization;

  const [submissions, questions, users] = await Promise.all([
    findAllSubmissions(),
    findAllQuestions(),
    findAllUsers(),
  ]);
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const questionStatsMap = new Map();
  const studentStatsMap = new Map();
  const unitStatsMap = new Map();

  for (const submission of submissions) {
    const studentStats = getOrCreate(studentStatsMap, submission.userId, () => ({
      userId: submission.userId,
      name: userMap.get(submission.userId)?.name ?? submission.userId,
      submissions: 0,
      score: 0,
      totalScore: 0,
      correctCount: 0,
      answerCount: 0,
    }));

    studentStats.submissions += 1;
    studentStats.score += submission.score;
    studentStats.totalScore += submission.totalScore;

    for (const answer of submission.answers) {
      const question = questionMap.get(answer.questionId);
      const unit = question?.unit ?? '미분류';
      const questionStats = getOrCreate(questionStatsMap, answer.questionId, () => ({
        questionId: answer.questionId,
        title: question?.title ?? answer.questionId,
        unit,
        attempts: 0,
        correctCount: 0,
      }));
      const unitStats = getOrCreate(unitStatsMap, unit, () => ({
        unit,
        attempts: 0,
        correctCount: 0,
      }));

      questionStats.attempts += 1;
      unitStats.attempts += 1;
      studentStats.answerCount += 1;

      if (answer.correct) {
        questionStats.correctCount += 1;
        unitStats.correctCount += 1;
        studentStats.correctCount += 1;
      }
    }
  }

  const questionStats = [...questionStatsMap.values()].map((stat) => ({
    ...stat,
    accuracy: toPercent(stat.correctCount, stat.attempts),
  })).sort((left, right) => left.accuracy - right.accuracy || right.attempts - left.attempts);
  const studentStats = [...studentStatsMap.values()].map((stat) => ({
    ...stat,
    accuracy: toPercent(stat.correctCount, stat.answerCount),
    scoreRate: toPercent(stat.score, stat.totalScore),
  })).sort((left, right) => right.scoreRate - left.scoreRate);
  const unitStats = [...unitStatsMap.values()].map((stat) => ({
    ...stat,
    accuracy: toPercent(stat.correctCount, stat.attempts),
  })).sort((left, right) => left.accuracy - right.accuracy);
  const recentSubmissions = submissions
    .slice()
    .sort((left, right) => String(right.submittedAt).localeCompare(String(left.submittedAt)))
    .slice(0, 6)
    .map((submission) => ({
      id: submission.id,
      userId: submission.userId,
      name: userMap.get(submission.userId)?.name ?? submission.userId,
      questionSetId: submission.questionSetId,
      attempt: submission.attempt,
      score: submission.score,
      totalScore: submission.totalScore,
      scoreRate: toPercent(submission.score, submission.totalScore),
      submittedAt: submission.submittedAt,
    }));

  return {
    summary: {
      submissionCount: submissions.length,
      studentCount: studentStats.length,
      answerCount: [...studentStatsMap.values()].reduce((sum, stat) => sum + stat.answerCount, 0),
      averageScoreRate: toPercent(
        studentStats.reduce((sum, stat) => sum + stat.score, 0),
        studentStats.reduce((sum, stat) => sum + stat.totalScore, 0),
      ),
    },
    questionStats,
    studentStats,
    unitStats,
    recentSubmissions,
  };
}

export async function getStudentLearningAnalytics(userId) {
  const authorization = await requireStudent(userId);
  if (authorization.error) return authorization;

  const [submissions, questions] = await Promise.all([
    findAllSubmissions(),
    findAllQuestions(),
  ]);
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const studentSubmissions = submissions.filter((submission) => submission.userId === authorization.user.id);
  const unitStatsMap = new Map();
  const missedQuestionsMap = new Map();
  let answerCount = 0;
  let correctCount = 0;
  let score = 0;
  let totalScore = 0;

  for (const submission of studentSubmissions) {
    score += submission.score;
    totalScore += submission.totalScore;

    for (const answer of submission.answers) {
      const question = questionMap.get(answer.questionId);
      const unit = question?.unit ?? '미분류';
      const unitStats = getOrCreate(unitStatsMap, unit, () => ({
        unit,
        attempts: 0,
        correctCount: 0,
      }));

      answerCount += 1;
      unitStats.attempts += 1;

      if (answer.correct) {
        correctCount += 1;
        unitStats.correctCount += 1;
      } else {
        const missedQuestion = getOrCreate(missedQuestionsMap, answer.questionId, () => ({
          questionId: answer.questionId,
          title: question?.title ?? answer.questionId,
          unit,
          missedCount: 0,
        }));

        missedQuestion.missedCount += 1;
      }
    }
  }

  return {
    summary: {
      submissionCount: studentSubmissions.length,
      answerCount,
      correctCount,
      accuracy: toPercent(correctCount, answerCount),
      scoreRate: toPercent(score, totalScore),
    },
    unitStats: [...unitStatsMap.values()].map((stat) => ({
      ...stat,
      accuracy: toPercent(stat.correctCount, stat.attempts),
    })).sort((left, right) => left.accuracy - right.accuracy),
    missedQuestions: [...missedQuestionsMap.values()]
      .sort((left, right) => right.missedCount - left.missedCount)
      .slice(0, 8),
    recentSubmissions: studentSubmissions
      .slice()
      .sort((left, right) => String(right.submittedAt).localeCompare(String(left.submittedAt)))
      .slice(0, 6)
      .map((submission) => ({
        id: submission.id,
        questionSetId: submission.questionSetId,
        attempt: submission.attempt,
        score: submission.score,
        totalScore: submission.totalScore,
        scoreRate: toPercent(submission.score, submission.totalScore),
        submittedAt: submission.submittedAt,
      })),
  };
}
