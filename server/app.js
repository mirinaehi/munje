import cors from 'cors';
import express from 'express';
import { analyticsRouter } from './routes/analytics.js';
import { healthRouter } from './routes/health.js';
import { questionSetsRouter } from './routes/questionSets.js';
import { questionsRouter } from './routes/questions.js';
import { submissionsRouter } from './routes/submissions.js';
import { teacherAssignmentsRouter } from './routes/teacherAssignments.js';
import { teacherQuestionSetsRouter } from './routes/teacherQuestionSets.js';
import { teacherQuestionsRouter } from './routes/teacherQuestions.js';
import { usersRouter } from './routes/users.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/', (_request, response) => {
  response.json({
    ok: true,
    message: 'Munje API 서버가 실행 중입니다.',
  });
});
app.use('/api/analytics', analyticsRouter);
app.use('/api/health', healthRouter);
app.use('/api/question-sets', questionSetsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/teacher/assignments', teacherAssignmentsRouter);
app.use('/api/teacher/question-sets', teacherQuestionSetsRouter);
app.use('/api/teacher/questions', teacherQuestionsRouter);
app.use('/api/users', usersRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: '서버에서 요청을 처리하지 못했습니다.' });
});

export default app;
