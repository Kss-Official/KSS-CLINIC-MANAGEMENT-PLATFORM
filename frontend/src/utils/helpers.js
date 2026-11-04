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
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE') || trimmed.includes('<html')) {
        return 'An error occurred while processing your request. Please try again.';
      }
      return data;
    }
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    if (typeof data.non_field_errors === 'string') {
      return data.non_field_errors;
    }
    // Check first field error if dictionary of errors
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      if (Array.isArray(val) && val.length > 0) return `${val[0]}`;
      if (typeof val === 'string') return val;
    }
  }
  return error.message || 'An unexpected error occurred';
};
