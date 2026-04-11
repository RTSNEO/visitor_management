/**
 * API URL resolver.
 * Uses relative URLs so it works with any domain (localhost, codespace, production, etc)
 * Both frontend and backend are served from the same origin.
 */
export const getApiUrl = (): string => {
  // Use empty string for relative URLs - works with any domain
  return '';
};

export const API_URL = getApiUrl();
