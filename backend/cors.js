export function parseAllowedOrigins(value) {
  return new Set(value.split(',').map((entry) => {
    const value = entry.trim();
    if (!value) return null;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('CLIENT_ORIGIN must contain comma-separated HTTP or HTTPS frontend URLs.');
    }
    return url.origin;
  }).filter(Boolean));
}
