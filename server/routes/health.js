import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    message: 'API 서버와 연결되었습니다.',
  });
});
