import app from './app.js';

const port = process.env.PORT || 4000;

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
