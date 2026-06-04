import { createServer } from './server';
import { closeBrowser } from './fetcher';

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = createServer(PORT);

process.on('SIGINT', async () => {
  console.log('\nShutting down FeedSmith...');
  await closeBrowser();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  server.close();
  process.exit(0);
});
