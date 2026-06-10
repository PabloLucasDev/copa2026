function outcome(scoreA, scoreB) {
  if (scoreA > scoreB) return 'A';
  if (scoreB > scoreA) return 'B';
  return 'D';
}

export function calculatePredictionScore(prediction, match) {
  const exactHit =
    Number(prediction.predicted_score_a) === Number(match.official_score_a) &&
    Number(prediction.predicted_score_b) === Number(match.official_score_b);

  if (exactHit) {
    return { points: 10, exact_hit: 1, outcome_hit: 0 };
  }

  const predictedOutcome = outcome(prediction.predicted_score_a, prediction.predicted_score_b);
  const officialOutcome = outcome(match.official_score_a, match.official_score_b);

  if (predictedOutcome === officialOutcome) {
    return { points: 5, exact_hit: 0, outcome_hit: 1 };
  }

  return { points: 0, exact_hit: 0, outcome_hit: 0 };
}

export async function recalculateMatchScores(connection, matchId) {
  const [[match]] = await connection.execute('SELECT * FROM matches WHERE id = ?', [matchId]);

  if (!match || match.official_score_a === null || match.official_score_b === null) {
    return;
  }

  const [predictions] = await connection.execute('SELECT * FROM predictions WHERE match_id = ?', [matchId]);

  for (const prediction of predictions) {
    const score = calculatePredictionScore(prediction, match);
    await connection.execute(
      `UPDATE predictions
       SET points = ?, exact_hit = ?, outcome_hit = ?
       WHERE id = ?`,
      [score.points, score.exact_hit, score.outcome_hit, prediction.id]
    );
  }
}
