/**
 * Cache time constants for React Query
 * All values in milliseconds
 */
export const CACHE_TIMES = {
  /** 30 seconds - For frequently changing data (appointments, stats) */
  APPOINTMENTS: 30 * 1000,
  
  /** 5 minutes - For user profile and settings */
  PROFILE: 5 * 60 * 1000,
  
  /** 10 minutes - For configuration data */
  SETTINGS: 10 * 60 * 1000,
  
  /** Never expires - For static reference data */
  STATIC: Infinity,
} as const;

/**
 * Helper to convert minutes to milliseconds
 */
export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

/**
 * Helper to convert seconds to milliseconds
 */
export const secondsToMs = (seconds: number): number => seconds * 1000;

