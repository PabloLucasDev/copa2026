import { query } from '../db/pool.js';
import { getRuntimeMatchStatus, isPredictionOpen } from '../services/time.js';

export async function matchRoutes(app) {
  app.get('/matches', { preHandler: app.authenticate }, async (request) => {
    const filters = [];
    const params = { userId: request.currentUser.id };

    if (request.query?.date) {
      filters.push('m.date = :date');
      params.date = request.query.date;
    }

    if (request.query?.team) {
      filters.push('(m.team_a LIKE :team OR m.team_b LIKE :team)');
      params.team = `%${request.query.team}%`;
    }

    if (request.query?.group) {
      filters.push('m.group_name = :groupName');
      params.groupName = request.query.group;
    }

    if (request.query?.phase) {
      filters.push('m.phase = :phase');
      params.phase = request.query.phase;
    }

    if (request.query?.finished === 'true') {
      filters.push("m.status = 'finished'");
    }

    if (request.query?.open === 'true') {
      filters.push("m.status = 'scheduled'");
      filters.push('m.starts_at_utc > UTC_TIMESTAMP() + INTERVAL 10 MINUTE');
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const matches = await query(
      `SELECT
         m.*,
         p.predicted_score_a,
         p.predicted_score_b,
         p.points AS prediction_points,
         p.updated_at AS prediction_updated_at
       FROM matches m
       LEFT JOIN predictions p
         ON p.match_id = m.id
        AND p.user_id = :userId
       ${where}
       ORDER BY m.starts_at_utc ASC`,
      params
    );

    return {
      matches: matches.map(serializeMatch)
    };
  });

  app.get('/matches/:id', { preHandler: app.authenticate }, async (request) => {
    const [match] = await query(
      `SELECT
         m.*,
         p.predicted_score_a,
         p.predicted_score_b,
         p.points AS prediction_points
       FROM matches m
       LEFT JOIN predictions p
         ON p.match_id = m.id
        AND p.user_id = :userId
       WHERE m.id = :id`,
      { id: request.params.id, userId: request.currentUser.id }
    );

    if (!match) {
      throw app.httpErrors.notFound('Jogo nao encontrado.');
    }

    return {
      match: serializeMatch(match)
    };
  });

  app.get('/matches/:id/predictions', { preHandler: app.authenticate }, async (request) => {
    const [match] = await query('SELECT * FROM matches WHERE id = :id', { id: request.params.id });

    if (!match) {
      throw app.httpErrors.notFound('Jogo nao encontrado.');
    }

    if (isPredictionOpen(match)) {
      throw app.httpErrors.forbidden('Os palpites deste jogo ficam ocultos ate o prazo encerrar.');
    }

    const predictions = await query(
      `SELECT
         u.id AS user_id,
         u.name,
         u.email,
         u.profile_photo,
         p.predicted_score_a,
         p.predicted_score_b,
         p.points,
         p.updated_at
       FROM users u
       LEFT JOIN predictions p
         ON p.user_id = u.id
        AND p.match_id = :matchId
       WHERE u.blocked = 0
       ORDER BY
         p.updated_at IS NULL ASC,
         u.name ASC`,
      { matchId: request.params.id }
    );

    return {
      match: serializeMatch(match),
      predictions: predictions.map((prediction) => ({
        ...prediction,
        has_prediction: prediction.predicted_score_a !== null && prediction.predicted_score_b !== null
      }))
    };
  });
}

function serializeMatch(match) {
  const runtimeStatus = getRuntimeMatchStatus(match);
  const predictionOpen = isPredictionOpen(match);

  return {
    ...match,
    effective_status: runtimeStatus,
    user_prediction:
      match.predicted_score_a === null
        ? null
        : {
            predicted_score_a: match.predicted_score_a,
            predicted_score_b: match.predicted_score_b,
            points: match.prediction_points,
            updated_at: match.prediction_updated_at
          },
    prediction_open: predictionOpen,
    display_status: getDisplayStatus(runtimeStatus, predictionOpen)
  };
}

function getDisplayStatus(status, predictionOpen) {
  if (status === 'finished') return 'Jogo finalizado';
  if (status === 'live') return 'Em andamento';
  if (status === 'closed') return 'Palpite encerrado';
  return predictionOpen ? 'Aberto para palpite' : 'Palpite bloqueado';
}
