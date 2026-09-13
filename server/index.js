import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health.js';
import { questionSetsRouter } from './routes/questionSets.js';
import { questionsRouter } from './routes/questions.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/question-sets', questionSetsRouter);
app.use('/api/questions', questionsRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: '서버에서 요청을 처리하지 못했습니다.' });
});

const server = app.listen(port, () => {
  console.log(`Munje API listening on http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing server and try again.`);
    return;
  }

  console.error(error);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
