import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: '서버에서 요청을 처리하지 못했습니다.' });
});

app.listen(port, () => {
  console.log(`Munje API listening on http://localhost:${port}`);
});
