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
  if (match.status !== 'scheduled') {
    return false;
  }

  const startsAtValue = String(match.starts_at_utc).replace(' ', 'T');
  const startsAt = new Date(`${startsAtValue}Z`);
  return Date.now() < startsAt.getTime() - 10 * 60 * 1000;
}

export function getRuntimeMatchStatus(match) {
  if (match.status === 'finished') return 'finished';
  if (match.status === 'closed') return 'closed';

  const startsAtValue = String(match.starts_at_utc).replace(' ', 'T');
  const startsAt = new Date(`${startsAtValue}Z`);

  if (Number.isNaN(startsAt.getTime())) {
    return match.status || 'scheduled';
  }

  const now = Date.now();
  const startsAtMs = startsAt.getTime();
  const estimatedEndMs = startsAtMs + 2.5 * 60 * 60 * 1000;

  if (now >= startsAtMs && now < estimatedEndMs) return 'live';
  if (now >= estimatedEndMs) return 'closed';
  return match.status || 'scheduled';
}

export function formatBrasiliaDateTime(date, timeBrasilia) {
  return `${date} ${String(timeBrasilia).slice(0, 5)}`;
}
