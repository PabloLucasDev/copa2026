import nodemailer from 'nodemailer';
import { config } from '../config.js';

export function createTransporter() {
  if (!config.smtp.host) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user
      ? {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      : undefined
  });
}

export async function sendMatchReminder({ user, match, hasPrediction }) {
  const transporter = createTransporter();

  if (!transporter) {
    return { skipped: true };
  }

  const pendingText = hasPrediction
    ? 'Seu palpite ja esta registrado.'
    : 'Seu palpite ainda esta pendente. Acesse o sistema agora para registrar.';

  await transporter.sendMail({
    from: config.smtp.from,
    to: user.email,
    subject: 'Lembrete: jogo começando em 10 minutos',
    text: `Ola, ${user.name}.

O jogo ${match.team_a} x ${match.team_b} começa em 10 minutos.

${pendingText}

Horario do jogo: ${match.date} ${String(match.time_brasilia).slice(0, 5)}
Link para acessar o sistema: ${config.appUrl}
`
  });

  return { skipped: false };
}
