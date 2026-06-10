import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import sensible from '@fastify/sensible';
import { config } from './config.js';
import authPlugin from './plugins/auth.js';
import { uploadsDir } from './services/uploads.js';
import { startReminderJob } from './services/reminders.js';
import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';
import { matchRoutes } from './routes/matches.js';
import { predictionRoutes } from './routes/predictions.js';
import { rankingRoutes } from './routes/ranking.js';
import { adminRoutes } from './routes/admin.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistDir = path.resolve(dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistDir, 'index.html');

const app = Fastify({
  logger: true
});

await app.register(sensible);
await app.register(cors, {
  origin: true,
  credentials: true
});
await app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});
await fs.mkdir(uploadsDir, { recursive: true });
await app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
  decorateReply: false
});

let hasFrontendBuild = false;
try {
  await fs.access(frontendIndexPath);
  hasFrontendBuild = true;
  await app.register(fastifyStatic, {
    root: frontendDistDir,
    prefix: '/',
    decorateReply: false,
    wildcard: false
  });
} catch {
  app.log.warn('Build do frontend nao encontrado em frontend/dist. Rode npm run build.');
}

await app.register(authPlugin);
await app.register(authRoutes);
await app.register(profileRoutes);
await app.register(matchRoutes);
await app.register(predictionRoutes);
await app.register(rankingRoutes);
await app.register(adminRoutes);

app.get('/health', async () => ({ ok: true }));

if (hasFrontendBuild) {
  app.get('/*', async (request, reply) => {
    const acceptsHtml = String(request.headers.accept || '').includes('text/html');
    if (!acceptsHtml) {
      throw app.httpErrors.notFound('Recurso nao encontrado.');
    }

    const html = await fs.readFile(frontendIndexPath, 'utf8');
    return reply.type('text/html; charset=utf-8').send(html);
  });
}

app.setErrorHandler((error, _request, reply) => {
  const statusCode = error.statusCode || 500;
  app.log.error(error);
  reply.code(statusCode).send({
    error: statusCode >= 500 ? 'Erro interno do servidor.' : error.message
  });
});

if (config.enableReminders) {
  startReminderJob(app);
}

try {
  await app.listen({
    port: config.port});
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
