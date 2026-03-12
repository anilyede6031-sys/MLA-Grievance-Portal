import api from './api';

/**
 * Standardizes photo URL construction across the app.
 * Handles absolute URLs, relative paths, and Windows-style paths.
 */
export const getPhotoUrl = (ph) => {
  if (!ph) return '';
  if (typeof ph !== 'string') return '';
  if (ph.startsWith('http')) return ph;
  
  // Clean the path (remove leading slashes and fix backslashes)
  const cleanPath = ph.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Get base URL by removing /api from the end
  const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
  
  return `${base}/${cleanPath}`;
};

/**
 * Common formatting for Indian dates
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Common formatting for Indian date-time
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
