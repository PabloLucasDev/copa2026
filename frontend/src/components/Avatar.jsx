import { getAssetUrl } from '../api.js';

export function Avatar({ src, name, size = 40 }) {
  const initials = String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        alt={name}
        className="avatar"
        src={getAssetUrl(src)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className="avatar avatar-fallback" style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}
