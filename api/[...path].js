import app from '../server/app.js';

export default function handler(request, response) {
  if (request.url && !request.url.startsWith('/api')) {
    request.url = `/api${request.url.startsWith('/') ? '' : '/'}${request.url}`;
  }

  return app(request, response);
}
