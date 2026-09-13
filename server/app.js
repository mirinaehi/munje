import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health.js';
import { questionSetsRouter } from './routes/questionSets.js';
import { questionsRouter } from './routes/questions.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/question-sets', questionSetsRouter);
app.use('/api/questions', questionsRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: '서버에서 요청을 처리하지 못했습니다.' });
});

export default app;
