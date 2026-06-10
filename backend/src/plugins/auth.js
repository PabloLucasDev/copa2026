import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { query } from '../db/pool.js';
import { config } from '../config.js';

export default fp(async function authPlugin(app) {
  app.register(jwt, {
    secret: config.jwtSecret
  });

  app.decorate('authenticate', async function authenticate(request) {
    await request.jwtVerify();

    const [user] = await query(
      `SELECT id, name, email, role, profile_photo, blocked
       FROM users
       WHERE id = :id`,
      { id: request.user.sub }
    );

    if (!user || user.blocked) {
      throw app.httpErrors.unauthorized('Usuario nao autorizado.');
    }

    request.currentUser = user;
  });

  app.decorate('requireAdmin', async function requireAdmin(request) {
    await app.authenticate(request);

    if (request.currentUser.role !== 'admin') {
      throw app.httpErrors.forbidden('Acesso restrito a administradores.');
    }
  });
});
