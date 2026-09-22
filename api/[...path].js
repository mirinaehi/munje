import app from '../server/app.js';

function getCatchAllPath(request) {
  const path = request.query?.path;

  if (Array.isArray(path)) {
    return path.join('/');
  }

  if (typeof path === 'string') {
    return path;
  }

  return '';
}

export default function handler(request, response) {
  const url = request.url ?? '/';

  if (url.startsWith('/api/[...path]')) {
    const search = url.includes('?') ? `?${url.split('?').slice(1).join('?')}` : '';
    request.url = `/api/${getCatchAllPath(request)}${search}`;
  } else if (!url.startsWith('/api')) {
    request.url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return app(request, response);
}
