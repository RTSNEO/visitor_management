/**
 * API URL resolver.
 * Returns empty string to use relative URLs (same origin).
 * Both frontend and backend are served from the same port.
 */
export const getApiUrl = (): string => {
  return '';  // Use relative paths - same origin at current host
};

export const API_URL = getApiUrl();
