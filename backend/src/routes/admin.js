import crypto from 'node:crypto';
import { query, withTransaction } from '../db/pool.js';
import { parseCsv } from '../services/csv.js';
import { parseBrasiliaDateTimeToUtc, toMysqlDateTime } from '../services/time.js';
import { recalculateMatchScores } from '../services/scoring.js';

export async function adminRoutes(app) {
  app.get('/admin/users', { preHandler: app.requireAdmin }, async () => {
    const users = await query(
      `SELECT id, name, email, profile_photo, role, blocked, created_at
       FROM users
       ORDER BY name ASC`
    );

    return { users };
  });

  app.patch('/admin/users/:id', { preHandler: app.requireAdmin }, async (request) => {
    const role = request.body?.role;
    const blocked = request.body?.blocked;

    if (role && !['user', 'admin'].includes(role)) {
      throw app.httpErrors.badRequest('Perfil invalido.');
    }

    if (request.params.id === request.currentUser.id && (role === 'user' || blocked === true)) {
      throw app.httpErrors.badRequest('Voce nao pode bloquear ou remover seu proprio acesso admin.');
    }

    await query(
      `UPDATE users
       SET role = COALESCE(:role, role),
           blocked = COALESCE(:blocked, blocked)
       WHERE id = :id`,
      {
        id: request.params.id,
        role: role || null,
        blocked: blocked === undefined ? null : Number(Boolean(blocked))
      }
    );

    return { ok: true };
  });

  app.delete('/admin/users/:id', { preHandler: app.requireAdmin }, async (request) => {
    if (request.params.id === request.currentUser.id) {
      throw app.httpErrors.badRequest('Voce nao pode remover seu proprio usuario.');
    }

    await query('DELETE FROM users WHERE id = :id', { id: request.params.id });
    return { ok: true };
  });

  app.post('/admin/matches', { preHandler: app.requireAdmin }, async (request, reply) => {
    const match = normalizeMatchPayload(request.body || {});
    await insertMatch(match);
    reply.code(201).send({ match });
  });

  app.put('/admin/matches/:id', { preHandler: app.requireAdmin }, async (request) => {
    const match = normalizeMatchPayload({ ...request.body, id: request.params.id });

    await query(
      `UPDATE matches
       SET date = :date,
           time_brasilia = :time_brasilia,
           starts_at_utc = :starts_at_utc,
           phase = :phase,
           group_name = :group_name,
           team_a = :team_a,
           team_b = :team_b,
           stadium = :stadium,
           city = :city,
           status = :status
       WHERE id = :id`,
      match
    );

    return { match };
  });

  app.delete('/admin/matches/:id', { preHandler: app.requireAdmin }, async (request) => {
    const result = await query('DELETE FROM matches WHERE id = :id', { id: request.params.id });

    if (!result.affectedRows) {
      throw app.httpErrors.notFound('Jogo nao encontrado.');
    }

    return { ok: true };
  });

  app.patch('/admin/matches/:id/result', { preHandler: app.requireAdmin }, async (request) => {
    const officialScoreA = Number(request.body?.official_score_a);
    const officialScoreB = Number(request.body?.official_score_b);

    if (!Number.isInteger(officialScoreA) || !Number.isInteger(officialScoreB) || officialScoreA < 0 || officialScoreB < 0) {
      throw app.httpErrors.badRequest('Informe placares oficiais validos.');
    }

    await withTransaction(async (connection) => {
      await connection.execute(
        `UPDATE matches
         SET official_score_a = ?,
             official_score_b = ?,
             status = 'finished'
         WHERE id = ?`,
        [officialScoreA, officialScoreB, request.params.id]
      );

      await recalculateMatchScores(connection, request.params.id);
    });

    return { ok: true };
  });

  app.post('/admin/recalculate', { preHandler: app.requireAdmin }, async () => {
    const matches = await query(
      `SELECT id
       FROM matches
       WHERE official_score_a IS NOT NULL
         AND official_score_b IS NOT NULL`
    );

    await withTransaction(async (connection) => {
      for (const match of matches) {
        await recalculateMatchScores(connection, match.id);
      }
    });

    return { recalculated_matches: matches.length };
  });

  app.post('/admin/import-matches', { preHandler: app.requireAdmin }, async (request) => {
    const { fileText } = await readCsvUpload(request);
    const rows = parseCsv(fileText);
    const imported = [];

    for (const row of rows) {
      const match = normalizeMatchPayload(row);
      await insertMatch(match);
      imported.push(match);
    }

    return { imported_count: imported.length, imported };
  });

  app.get('/admin/predictions', { preHandler: app.requireAdmin }, async () => {
    const predictions = await query(
      `SELECT
         p.*,
         u.name,
         u.email,
         m.team_a,
         m.team_b,
         m.date,
         m.time_brasilia,
         m.phase
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       JOIN matches m ON m.id = p.match_id
       ORDER BY m.starts_at_utc ASC, u.name ASC`
    );

    return { predictions };
  });
}

function normalizeMatchPayload(payload) {
  const date = payload.date || payload.data;
  const timeBrasilia = payload.time_brasilia || payload.horario || payload.horario_brasilia;
  const startsAt = parseBrasiliaDateTimeToUtc(date, timeBrasilia);
  const officialScoreA = payload.official_score_a ?? payload.placar_oficial_a ?? null;
  const officialScoreB = payload.official_score_b ?? payload.placar_oficial_b ?? null;

  return {
    id: payload.id || crypto.randomUUID(),
    date,
    time_brasilia: `${String(timeBrasilia).slice(0, 5)}:00`,
    starts_at_utc: toMysqlDateTime(startsAt),
    phase: payload.phase || payload.fase,
    group_name: payload.group_name || payload.grupo || null,
    team_a: payload.team_a || payload.mandante || payload.selecao_a,
    team_b: payload.team_b || payload.visitante || payload.selecao_b,
    stadium: payload.stadium || payload.estadio || null,
    city: payload.city || payload.cidade || null,
    official_score_a: officialScoreA === '' ? null : officialScoreA,
    official_score_b: officialScoreB === '' ? null : officialScoreB,
    status: payload.status || (officialScoreA !== null && officialScoreB !== null ? 'finished' : 'scheduled')
  };
}

async function insertMatch(match) {
  await query(
    `INSERT INTO matches (
       id,
       date,
       time_brasilia,
       starts_at_utc,
       phase,
       group_name,
       team_a,
       team_b,
       stadium,
       city,
       official_score_a,
       official_score_b,
       status
     )
     VALUES (
       :id,
       :date,
       :time_brasilia,
       :starts_at_utc,
       :phase,
       :group_name,
       :team_a,
       :team_b,
       :stadium,
       :city,
       :official_score_a,
       :official_score_b,
       :status
     )`,
    match
  );
}

async function readCsvUpload(request) {
  if (!request.isMultipart()) {
    return { fileText: request.body?.csv || '' };
  }

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      const chunks = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      return { fileText: Buffer.concat(chunks).toString('utf8') };
    }
  }

  return { fileText: '' };
}
