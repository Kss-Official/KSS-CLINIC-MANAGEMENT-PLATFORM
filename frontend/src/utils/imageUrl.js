import { API_BASE_URL } from './constants';

/**
 * Returns a fully qualified image URL that can be loaded in the browser,
 * handling relative backend media paths, full URLs, and blob/data URIs.
 */
export const getEffectiveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // Local blob previews or inline data URIs
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  
  // Already absolute URLs (e.g. http://localhost:8000/media/...)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Relative URLs (e.g. /media/profiles/...)
  const backendRoot = (API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendRoot}${cleanPath}`;
};

export default getEffectiveImageUrl;

