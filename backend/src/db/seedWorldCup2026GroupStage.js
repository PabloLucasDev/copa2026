import crypto from 'node:crypto';
import { pool } from './pool.js';

const matches = [
  ['2026-06-11', '16:00', 'A', 'Mexico', 'South Africa', 'Mexico City Stadium', 'Mexico City'],
  ['2026-06-11', '23:00', 'A', 'Korea Republic', 'Czechia', 'Estadio Guadalajara', 'Guadalajara'],
  ['2026-06-12', '16:00', 'B', 'Canada', 'Bosnia and Herzegovina', 'Toronto Stadium', 'Toronto'],
  ['2026-06-12', '22:00', 'D', 'USA', 'Paraguay', 'Los Angeles Stadium', 'Los Angeles'],
  ['2026-06-13', '22:00', 'C', 'Haiti', 'Scotland', 'Boston Stadium', 'Boston'],
  ['2026-06-13', '01:00', 'D', 'Australia', 'Türkiye', 'BC Place Vancouver', 'Vancouver'],
  ['2026-06-13', '19:00', 'C', 'Brazil', 'Morocco', 'New York New Jersey Stadium', 'New York New Jersey'],
  ['2026-06-13', '16:00', 'B', 'Qatar', 'Switzerland', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'],
  ['2026-06-14', '20:00', 'E', "Côte d'Ivoire", 'Ecuador', 'Philadelphia Stadium', 'Philadelphia'],
  ['2026-06-14', '14:00', 'E', 'Germany', 'Curaçao', 'Houston Stadium', 'Houston'],
  ['2026-06-14', '17:00', 'F', 'Netherlands', 'Japan', 'Dallas Stadium', 'Dallas'],
  ['2026-06-14', '23:00', 'F', 'Sweden', 'Tunisia', 'Estadio Monterrey', 'Monterrey'],
  ['2026-06-15', '19:00', 'H', 'Saudi Arabia', 'Uruguay', 'Miami Stadium', 'Miami'],
  ['2026-06-15', '13:00', 'H', 'Spain', 'Cabo Verde', 'Atlanta Stadium', 'Atlanta'],
  ['2026-06-15', '22:00', 'G', 'IR Iran', 'New Zealand', 'Los Angeles Stadium', 'Los Angeles'],
  ['2026-06-15', '16:00', 'G', 'Belgium', 'Egypt', 'Seattle Stadium', 'Seattle'],
  ['2026-06-16', '16:00', 'I', 'France', 'Senegal', 'New York New Jersey Stadium', 'New York New Jersey'],
  ['2026-06-16', '19:00', 'I', 'Iraq', 'Norway', 'Boston Stadium', 'Boston'],
  ['2026-06-16', '22:00', 'J', 'Argentina', 'Algeria', 'Kansas City Stadium', 'Kansas City'],
  ['2026-06-16', '01:00', 'J', 'Austria', 'Jordan', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'],
  ['2026-06-17', '20:00', 'L', 'Ghana', 'Panama', 'Toronto Stadium', 'Toronto'],
  ['2026-06-17', '17:00', 'L', 'England', 'Croatia', 'Dallas Stadium', 'Dallas'],
  ['2026-06-17', '14:00', 'K', 'Portugal', 'Congo DR', 'Houston Stadium', 'Houston'],
  ['2026-06-17', '23:00', 'K', 'Uzbekistan', 'Colombia', 'Mexico City Stadium', 'Mexico City'],
  ['2026-06-18', '13:00', 'A', 'Czechia', 'South Africa', 'Atlanta Stadium', 'Atlanta'],
  ['2026-06-18', '16:00', 'B', 'Switzerland', 'Bosnia and Herzegovina', 'Los Angeles Stadium', 'Los Angeles'],
  ['2026-06-18', '19:00', 'B', 'Canada', 'Qatar', 'BC Place Vancouver', 'Vancouver'],
  ['2026-06-18', '22:00', 'A', 'Mexico', 'Korea Republic', 'Estadio Guadalajara', 'Guadalajara'],
  ['2026-06-19', '22:00', 'C', 'Brazil', 'Haiti', 'Philadelphia Stadium', 'Philadelphia'],
  ['2026-06-19', '19:00', 'C', 'Scotland', 'Morocco', 'Boston Stadium', 'Boston'],
  ['2026-06-19', '01:00', 'D', 'Türkiye', 'Paraguay', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'],
  ['2026-06-19', '16:00', 'D', 'USA', 'Australia', 'Seattle Stadium', 'Seattle'],
  ['2026-06-20', '17:00', 'E', 'Germany', "Côte d'Ivoire", 'Toronto Stadium', 'Toronto'],
  ['2026-06-20', '21:00', 'E', 'Ecuador', 'Curaçao', 'Kansas City Stadium', 'Kansas City'],
  ['2026-06-20', '14:00', 'F', 'Netherlands', 'Sweden', 'Houston Stadium', 'Houston'],
  ['2026-06-20', '01:00', 'F', 'Tunisia', 'Japan', 'Estadio Monterrey', 'Monterrey'],
  ['2026-06-21', '19:00', 'H', 'Uruguay', 'Cabo Verde', 'Miami Stadium', 'Miami'],
  ['2026-06-21', '13:00', 'H', 'Spain', 'Saudi Arabia', 'Atlanta Stadium', 'Atlanta'],
  ['2026-06-21', '16:00', 'G', 'Belgium', 'IR Iran', 'Los Angeles Stadium', 'Los Angeles'],
  ['2026-06-21', '22:00', 'G', 'New Zealand', 'Egypt', 'BC Place Vancouver', 'Vancouver'],
  ['2026-06-22', '21:00', 'I', 'Norway', 'Senegal', 'New York New Jersey Stadium', 'New York New Jersey'],
  ['2026-06-22', '18:00', 'I', 'France', 'Iraq', 'Philadelphia Stadium', 'Philadelphia'],
  ['2026-06-22', '14:00', 'J', 'Argentina', 'Austria', 'Dallas Stadium', 'Dallas'],
  ['2026-06-22', '00:00', 'J', 'Jordan', 'Algeria', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'],
  ['2026-06-23', '17:00', 'L', 'England', 'Ghana', 'Boston Stadium', 'Boston'],
  ['2026-06-23', '20:00', 'L', 'Panama', 'Croatia', 'Toronto Stadium', 'Toronto'],
  ['2026-06-23', '14:00', 'K', 'Portugal', 'Uzbekistan', 'Houston Stadium', 'Houston'],
  ['2026-06-23', '23:00', 'K', 'Colombia', 'Congo DR', 'Estadio Guadalajara', 'Guadalajara'],
  ['2026-06-24', '19:00', 'C', 'Scotland', 'Brazil', 'Miami Stadium', 'Miami'],
  ['2026-06-24', '19:00', 'C', 'Morocco', 'Haiti', 'Atlanta Stadium', 'Atlanta'],
  ['2026-06-24', '16:00', 'B', 'Switzerland', 'Canada', 'BC Place Vancouver', 'Vancouver'],
  ['2026-06-24', '16:00', 'B', 'Bosnia and Herzegovina', 'Qatar', 'Seattle Stadium', 'Seattle'],
  ['2026-06-24', '22:00', 'A', 'Czechia', 'Mexico', 'Mexico City Stadium', 'Mexico City'],
  ['2026-06-24', '22:00', 'A', 'South Africa', 'Korea Republic', 'Estadio Monterrey', 'Monterrey'],
  ['2026-06-25', '17:00', 'E', 'Curaçao', "Côte d'Ivoire", 'Philadelphia Stadium', 'Philadelphia'],
  ['2026-06-25', '17:00', 'E', 'Ecuador', 'Germany', 'New York New Jersey Stadium', 'New York New Jersey'],
  ['2026-06-25', '20:00', 'F', 'Japan', 'Sweden', 'Dallas Stadium', 'Dallas'],
  ['2026-06-25', '20:00', 'F', 'Tunisia', 'Netherlands', 'Kansas City Stadium', 'Kansas City'],
  ['2026-06-25', '23:00', 'D', 'Türkiye', 'USA', 'Los Angeles Stadium', 'Los Angeles'],
  ['2026-06-25', '23:00', 'D', 'Paraguay', 'Australia', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'],
  ['2026-06-26', '16:00', 'I', 'Norway', 'France', 'Boston Stadium', 'Boston'],
  ['2026-06-26', '16:00', 'I', 'Senegal', 'Iraq', 'Toronto Stadium', 'Toronto'],
  ['2026-06-26', '00:00', 'G', 'Egypt', 'IR Iran', 'Seattle Stadium', 'Seattle'],
  ['2026-06-26', '00:00', 'G', 'New Zealand', 'Belgium', 'BC Place Vancouver', 'Vancouver'],
  ['2026-06-26', '21:00', 'H', 'Cabo Verde', 'Saudi Arabia', 'Houston Stadium', 'Houston'],
  ['2026-06-26', '21:00', 'H', 'Uruguay', 'Spain', 'Estadio Guadalajara', 'Guadalajara'],
  ['2026-06-27', '18:00', 'L', 'Panama', 'England', 'New York New Jersey Stadium', 'New York New Jersey'],
  ['2026-06-27', '18:00', 'L', 'Croatia', 'Ghana', 'Philadelphia Stadium', 'Philadelphia'],
  ['2026-06-27', '23:00', 'J', 'Algeria', 'Austria', 'Kansas City Stadium', 'Kansas City'],
  ['2026-06-27', '23:00', 'J', 'Jordan', 'Argentina', 'Dallas Stadium', 'Dallas'],
  ['2026-06-27', '20:30', 'K', 'Colombia', 'Portugal', 'Miami Stadium', 'Miami'],
  ['2026-06-27', '20:30', 'K', 'Congo DR', 'Uzbekistan', 'Atlanta Stadium', 'Atlanta']
];

function brtToUtcDateTime(date, time) {
  return new Date(`${date}T${time}:00-03:00`).toISOString().slice(0, 19).replace('T', ' ');
}

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  let inserted = 0;
  let updated = 0;

  for (const [date, time, group, teamA, teamB, stadium, city] of matches) {
    const startsAtUtc = brtToUtcDateTime(date, time);
    const [[existing]] = await connection.execute(
      `SELECT id
       FROM matches
       WHERE phase = 'Fase de grupos'
         AND group_name = ?
         AND team_a = ?
         AND team_b = ?
       LIMIT 1`,
      [group, teamA, teamB]
    );

    if (existing) {
      await connection.execute(
        `UPDATE matches
         SET date = ?,
             time_brasilia = ?,
             starts_at_utc = ?,
             stadium = ?,
             city = ?,
             status = 'scheduled'
         WHERE id = ?`,
        [date, `${time}:00`, startsAtUtc, stadium, city, existing.id]
      );
      updated += 1;
    } else {
      await connection.execute(
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
           status
         )
         VALUES (?, ?, ?, ?, 'Fase de grupos', ?, ?, ?, ?, ?, 'scheduled')`,
        [crypto.randomUUID(), date, `${time}:00`, startsAtUtc, group, teamA, teamB, stadium, city]
      );
      inserted += 1;
    }
  }

  await connection.commit();

  const [[summary]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM matches
     WHERE phase = 'Fase de grupos'`
  );

  console.log(JSON.stringify({ inserted, updated, total_group_stage_matches: summary.total }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
