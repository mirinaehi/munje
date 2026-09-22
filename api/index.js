import app from '../server/app.js';

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path.join('/');
  }

  if (typeof path === 'string') {
    return path.replace(/^\/+/, '');
  }

  return '';
}

function getApiPath(request, url) {
  const queryPath = normalizePath(request.query?.path ?? url.searchParams.get('path'));

  if (queryPath) {
    return `/api/${queryPath}`;
  }

  if (url.pathname.startsWith('/api')) {
    return url.pathname;
  }

  return `/api${url.pathname.startsWith('/') ? '' : '/'}${url.pathname}`;
}

function getSearchWithoutRoutingParams(url) {
  url.searchParams.delete('path');

  const search = url.searchParams.toString();
  return search ? `?${search}` : '';
}

export default function handler(request, response) {
  const url = new URL(request.url ?? '/api', 'http://localhost');
  request.url = `${getApiPath(request, url)}${getSearchWithoutRoutingParams(url)}`;

  return app(request, response);
}
