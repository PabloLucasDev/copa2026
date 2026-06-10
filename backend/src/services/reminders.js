import crypto from 'node:crypto';
import cron from 'node-cron';
import { query, withTransaction } from '../db/pool.js';
import { sendMatchReminder } from './email.js';

export function startReminderJob(app) {
  cron.schedule('* * * * *', async () => {
    try {
      await processDueReminders();
    } catch (error) {
      app.log.error(error, 'Falha ao processar lembretes');
    }
  });
}

export async function processDueReminders() {
  const matches = await query(
    `SELECT *
     FROM matches
     WHERE status = 'scheduled'
       AND starts_at_utc BETWEEN UTC_TIMESTAMP() + INTERVAL 9 MINUTE
                             AND UTC_TIMESTAMP() + INTERVAL 11 MINUTE`
  );

  for (const match of matches) {
    const users = await query(
      `SELECT id, name, email
       FROM users
       WHERE blocked = 0`
    );

    for (const user of users) {
      await withTransaction(async (connection) => {
        const [[existing]] = await connection.execute(
          'SELECT id FROM notifications WHERE user_id = ? AND match_id = ?',
          [user.id, match.id]
        );

        if (existing) return;

        const [[prediction]] = await connection.execute(
          'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?',
          [user.id, match.id]
        );

        const result = await sendMatchReminder({
          user,
          match,
          hasPrediction: Boolean(prediction)
        });

        await connection.execute(
          `INSERT INTO notifications (id, user_id, match_id, email_sent, sent_at)
           VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
          [crypto.randomUUID(), user.id, match.id, result.skipped ? 0 : 1]
        );
      });
    }
  }
}
