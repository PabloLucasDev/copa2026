import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { isPredictionOpen } from '../services/time.js';

export async function predictionRoutes(app) {
  app.put('/matches/:matchId/prediction', { preHandler: app.authenticate }, async (request) => {
    const predictedScoreA = Number(request.body?.predicted_score_a);
    const predictedScoreB = Number(request.body?.predicted_score_b);

    if (!Number.isInteger(predictedScoreA) || !Number.isInteger(predictedScoreB) || predictedScoreA < 0 || predictedScoreB < 0) {
      throw app.httpErrors.badRequest('Informe placares validos.');
    }

    const [match] = await query('SELECT * FROM matches WHERE id = :matchId', {
      matchId: request.params.matchId
    });

    if (!match) {
      throw app.httpErrors.notFound('Jogo nao encontrado.');
    }

    if (match.status === 'finished' || !isPredictionOpen(match)) {
      throw app.httpErrors.forbidden('O prazo para palpites deste jogo ja foi encerrado.');
    }

    const id = crypto.randomUUID();

    await query(
      `INSERT INTO predictions (
         id,
         user_id,
         match_id,
         predicted_score_a,
         predicted_score_b
       )
       VALUES (
         :id,
         :userId,
         :matchId,
         :predictedScoreA,
         :predictedScoreB
       )
       ON DUPLICATE KEY UPDATE
         predicted_score_a = VALUES(predicted_score_a),
         predicted_score_b = VALUES(predicted_score_b),
         updated_at = CURRENT_TIMESTAMP`,
      {
        id,
        userId: request.currentUser.id,
        matchId: request.params.matchId,
        predictedScoreA,
        predictedScoreB
      }
    );

    const [prediction] = await query(
      `SELECT *
       FROM predictions
       WHERE user_id = :userId AND match_id = :matchId`,
      { userId: request.currentUser.id, matchId: request.params.matchId }
    );

    return { prediction };
  });
}
