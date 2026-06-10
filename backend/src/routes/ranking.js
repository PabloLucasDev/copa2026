import { query } from '../db/pool.js';
import { toCsv } from '../services/csv.js';

export async function rankingRoutes(app) {
  app.get('/ranking', { preHandler: app.authenticate }, async () => {
    const ranking = await getRankingRows();
    return { ranking };
  });

  app.get('/ranking/export.csv', { preHandler: app.requireAdmin }, async (_request, reply) => {
    const ranking = await getRankingRows();
    const csv = toCsv(
      ranking.map((row) => ({
        posicao: row.position,
        nome: row.name,
        email: row.email,
        pontuacao_total: row.points,
        acertos_exatos: row.exact_hits,
        acertos_vencedor_empate: row.outcome_hits,
        total_palpites: row.total_predictions
      }))
    );

    reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', 'attachment; filename="ranking-copa-2026.csv"')
      .send(csv);
  });
}

async function getRankingRows() {
  const rows = await query(
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
     WHERE u.blocked = 0
     GROUP BY u.id
     ORDER BY points DESC, exact_hits DESC, outcome_hits DESC, total_predictions DESC, u.name ASC`
  );

  return rows.map((row, index) => ({
    position: index + 1,
    ...row
  }));
}
