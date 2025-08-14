/**
 * Basic logging module for database operations
 */

export function createLogger(component) {
  return {
    info: (data, message) => {
      console.log(`[${component.toUpperCase()}] ${message || ''}`, data);
    },
    warn: (data, message) => {
      console.warn(`[${component.toUpperCase()}] ${message || ''}`, data);
    },
    error: (data, message) => {
      console.error(`[${component.toUpperCase()}] ${message || ''}`, data);
    }
  };
}