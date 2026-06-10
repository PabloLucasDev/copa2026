export function parseCsv(text) {
  const rows = [];
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length);

  if (!lines.length) return rows;

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

export function toCsv(rows) {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(','));
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

function splitCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function escapeCsv(value) {
  const normalized = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}
