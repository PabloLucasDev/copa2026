import { query } from '../db/pool.js';
import { parseFormData } from '../services/uploads.js';

export async function profileRoutes(app) {
  app.get('/profile', { preHandler: app.authenticate }, async (request) => {
    const [profile] = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.profile_photo,
         COALESCE(SUM(p.points), 0) AS points,
         COALESCE(SUM(p.exact_hit), 0) AS exact_hits,
         COALESCE(SUM(p.outcome_hit), 0) AS outcome_hits,
         COUNT(p.id) AS total_predictions
       FROM users u
       LEFT JOIN predictions p ON p.user_id = u.id
       WHERE u.id = :userId
       GROUP BY u.id`,
      { userId: request.currentUser.id }
    );

    const history = await query(
      `SELECT
         p.id,
         p.predicted_score_a,
         p.predicted_score_b,
         p.points,
         p.exact_hit,
         p.outcome_hit,
         p.updated_at,
         m.team_a,
         m.team_b,
         m.date,
         m.time_brasilia,
         m.phase,
         m.official_score_a,
         m.official_score_b,
         m.status
       FROM predictions p
       JOIN matches m ON m.id = p.match_id
       WHERE p.user_id = :userId
       ORDER BY m.starts_at_utc DESC`,
      { userId: request.currentUser.id }
    );

    const ranking = await query(
      `SELECT user_id
       FROM (
         SELECT
           u.id AS user_id,
           COALESCE(SUM(p.points), 0) AS points,
           COALESCE(SUM(p.exact_hit), 0) AS exact_hits,
           COALESCE(SUM(p.outcome_hit), 0) AS outcome_hits,
           COUNT(p.id) AS total_predictions,
           u.name
         FROM users u
         LEFT JOIN predictions p ON p.user_id = u.id
         WHERE u.blocked = 0
         GROUP BY u.id
         ORDER BY points DESC, exact_hits DESC, outcome_hits DESC, total_predictions DESC, u.name ASC
       ) ranked`
    );

    const position = ranking.findIndex((item) => item.user_id === request.currentUser.id) + 1;

    return {
      profile: {
        ...profile,
        position: position || null,
        history
      }
    };
  });

  app.put('/profile', { preHandler: app.authenticate }, async (request) => {
    const { fields, profilePhoto } = await parseFormData(request);
    const name = String(fields.name || '').trim();

    if (!name) {
      throw app.httpErrors.badRequest('Nome e obrigatorio.');
    }

    await query(
      `UPDATE users
       SET name = :name,
           profile_photo = COALESCE(:profilePhoto, profile_photo)
       WHERE id = :userId`,
      { name, profilePhoto, userId: request.currentUser.id }
    );

    const [user] = await query(
      'SELECT id, name, email, role, profile_photo FROM users WHERE id = :userId',
      { userId: request.currentUser.id }
    );

    return { user };
  });
}
