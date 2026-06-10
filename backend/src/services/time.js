export function parseBrasiliaDateTimeToUtc(date, timeBrasilia) {
  if (!date || !timeBrasilia) {
    throw new Error('Data e horario do jogo sao obrigatorios.');
  }

  const normalizedTime = String(timeBrasilia).slice(0, 5);
  const utcDate = new Date(`${date}T${normalizedTime}:00-03:00`);

  if (Number.isNaN(utcDate.getTime())) {
    throw new Error('Data ou horario do jogo invalido.');
  }

  return utcDate;
}

export function toMysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function isPredictionOpen(match) {
  const startsAtValue = String(match.starts_at_utc).replace(' ', 'T');
  const startsAt = new Date(`${startsAtValue}Z`);
  return Date.now() < startsAt.getTime() - 10 * 60 * 1000;
}

export function formatBrasiliaDateTime(date, timeBrasilia) {
  return `${date} ${String(timeBrasilia).slice(0, 5)}`;
}
