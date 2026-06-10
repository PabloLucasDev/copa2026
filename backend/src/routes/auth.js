import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { parseFormData } from '../services/uploads.js';

const CORPORATE_DOMAIN = '@officecont.cnt.br';

export async function authRoutes(app) {
  app.post('/auth/register', async (request, reply) => {
    const { fields, profilePhoto } = await parseFormData(request);
    const name = String(fields.name || '').trim();
    const email = String(fields.email || '').trim().toLowerCase();
    const password = String(fields.password || '');

    if (!name || !email || !password) {
      throw app.httpErrors.badRequest('Nome, e-mail e senha sao obrigatorios.');
    }

    if (!email.endsWith(CORPORATE_DOMAIN)) {
      throw app.httpErrors.badRequest(`Use um e-mail corporativo ${CORPORATE_DOMAIN}.`);
    }

    if (password.length < 8) {
      throw app.httpErrors.badRequest('A senha deve ter pelo menos 8 caracteres.');
    }

    const [existing] = await query('SELECT id FROM users WHERE email = :email', { email });
    if (existing) {
      throw app.httpErrors.conflict('E-mail ja cadastrado.');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const role = 'user';

    await query(
      `INSERT INTO users (id, name, email, password_hash, profile_photo, role)
       VALUES (:id, :name, :email, :passwordHash, :profilePhoto, :role)`,
      { id, name, email, passwordHash, profilePhoto, role }
    );

    const token = app.jwt.sign({ sub: id, role }, { expiresIn: '7d' });

    reply.code(201).send({
      token,
      user: { id, name, email, role, profile_photo: profilePhoto }
    });
  });

  app.post('/auth/login', async (request) => {
    const email = String(request.body?.email || '').trim().toLowerCase();
    const password = String(request.body?.password || '');

    const [user] = await query('SELECT * FROM users WHERE email = :email', { email });
    if (!user || user.blocked) {
      throw app.httpErrors.unauthorized('E-mail ou senha invalidos.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      throw app.httpErrors.unauthorized('E-mail ou senha invalidos.');
    }

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_photo: user.profile_photo
      }
    };
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    return { user: request.currentUser };
  });

  app.post('/auth/forgot-password', async () => {
    return {
      message: 'Recuperacao de senha registrada. Configure o provedor SMTP e fluxo de token para envio em producao.'
    };
  });
}
