import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(dirname, '../../uploads');

const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

export async function saveProfilePhoto(filePart) {
  if (!filePart) return null;

  const extension = allowedMimeTypes.get(filePart.mimetype);
  if (!extension) {
    throw new Error('A foto deve ser JPG, PNG ou WEBP.');
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${crypto.randomUUID()}${extension}`;
  const destination = path.join(uploadsDir, filename);

  await pipeline(filePart.file, await fs.open(destination, 'w').then((handle) => handle.createWriteStream()));

  return `/uploads/${filename}`;
}

export async function parseFormData(request) {
  const fields = {};
  let profilePhoto = null;

  if (!request.isMultipart()) {
    return { fields: request.body || {}, profilePhoto };
  }

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      if (part.fieldname === 'profile_photo' && part.filename) {
        profilePhoto = await saveProfilePhoto(part);
      } else {
        part.file.resume();
      }
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, profilePhoto };
}
