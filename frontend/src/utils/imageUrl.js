import { API_BASE_URL } from './constants.js';

/**
 * Returns a fully qualified image URL that can be loaded safely in the browser,
 * preventing Mixed Content issues on HTTPS, handling relative backend paths,
 * localhost URLs on production, dummy test assets, and blob/data URIs.
 */
export const getEffectiveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Filter out any known dummy, test, or broken placeholders
  if (trimmed.includes('test_avatar.png') || trimmed.includes('placeholder_doctor')) {
    return null;
  }

  // Local blob previews or inline data URIs are always safe and self-contained
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  const isCurrentOriginHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isBrowser = typeof window !== 'undefined';
  const isRemoteDomain = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  // Base backend URL root (e.g. https://clinic-ms-kss-backend.vercel.app or http://localhost:8000)
  const backendRoot = (API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

  // Check if URL points to localhost / 127.0.0.1
  const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed);

  if (isLocalhostUrl) {
    // If the frontend is running on a live remote domain (e.g. Vercel) or over HTTPS:
    if (isRemoteDomain || isCurrentOriginHttps) {
      // If it points to media, remap it to the live backend root
      if (trimmed.includes('/media/')) {
        const mediaPath = trimmed.substring(trimmed.indexOf('/media/'));
        if (backendRoot && /^https?:\/\//i.test(backendRoot) && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(backendRoot)) {
          const secureBase = isCurrentOriginHttps ? backendRoot.replace(/^http:\/\//i, 'https://') : backendRoot;
          return `${secureBase}${mediaPath}`;
        }
      }
      // Insecure localhost cannot be fetched from remote HTTPS origin
      return null;
    }
  }

  // If the page is loaded over HTTPS, never allow insecure http:// requests (prevents browser Mixed Content blocking)
  if (isCurrentOriginHttps && trimmed.startsWith('http://')) {
    if (isLocalhostUrl) {
      return null;
    }
    // Upgrade to secure https://
    return trimmed.replace(/^http:\/\//i, 'https://');
  }

  // Already an https:// URL
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's http:// on an http:// page (e.g. local dev)
  if (trimmed.startsWith('http://')) {
    return trimmed;
  }

  // Relative URLs (e.g. /media/profiles/...)
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const effectiveBase = isCurrentOriginHttps && backendRoot.startsWith('http://')
    ? backendRoot.replace(/^http:\/\//i, 'https://')
    : backendRoot;

  return `${effectiveBase}${cleanPath}`;
};

export default getEffectiveImageUrl;
