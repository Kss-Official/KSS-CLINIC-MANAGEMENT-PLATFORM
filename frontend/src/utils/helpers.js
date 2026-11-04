/**
 * Formats ISO date string to localized readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Extracts error message from API response error
 */
export const extractErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';
  const data = error.response?.data;
  if (data) {
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    // Check for any field-level error messages (e.g. { username: ['...'] })
    if (typeof data === 'object') {
      const values = Object.values(data);
      if (values.length > 0) {
        const first = values[0];
        if (Array.isArray(first) && first.length > 0) return first[0];
        if (typeof first === 'string') return first;
      }
    }
  }
  return error.message || 'An unexpected error occurred';
};

