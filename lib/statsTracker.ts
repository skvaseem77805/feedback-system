/**
 * Stats Tracker - Manages automatic profile statistics updates based on user actions
 * Each student's stats are independently tracked and persisted
 */

export interface StudentStats {
  projectsUploaded: number;
  connections: number;
  collaborations: number;
}

const DEFAULT_STATS: StudentStats = {
  projectsUploaded: 0,
  connections: 0,
  collaborations: 0,
};

/**
 * Get storage key for a student's stats
 */
export const getStatsKey = (studentId: string): string => {
  return `studentStats_${studentId}`;
};

/**
 * Get current stats for a student
 */
export const getStudentStats = (studentId: string): StudentStats => {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  
  const storageKey = getStatsKey(studentId);
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('[StatsTracker] Error parsing stats:', error);
      return DEFAULT_STATS;
    }
  }
  
  return DEFAULT_STATS;
};

/**
 * Save stats for a student
 */
export const saveStudentStats = (studentId: string, stats: StudentStats): void => {
  if (typeof window === 'undefined') return;
  
  const storageKey = getStatsKey(studentId);
  localStorage.setItem(storageKey, JSON.stringify(stats));
};

/**
 * Increment projects uploaded count
 * Called when a student successfully uploads a new project
 */
export const incrementProjectsUploaded = (studentId: string): StudentStats => {
  const stats = getStudentStats(studentId);
  stats.projectsUploaded += 1;
  saveStudentStats(studentId, stats);
  return stats;
};

/**
 * Increment connections count
 * Called when a student connects with another student via LinkedIn
 */
export const incrementConnections = (studentId: string): StudentStats => {
  const stats = getStudentStats(studentId);
  stats.connections += 1;
  saveStudentStats(studentId, stats);
  return stats;
};

/**
 * Increment collaborations count
 * Called when a student initiates a collaboration via LinkedIn or Email
 */
export const incrementCollaborations = (studentId: string): StudentStats => {
  const stats = getStudentStats(studentId);
  stats.collaborations += 1;
  saveStudentStats(studentId, stats);
  return stats;
};

/**
 * Get current logged-in student ID
 */
export const getCurrentStudentId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentStudentId');
};

/**
 * Initialize stats for a new student if they don't exist
 */
export const initializeStudentStats = (studentId: string): StudentStats => {
  const existing = getStudentStats(studentId);
  if (Object.values(existing).some(v => v === undefined)) {
    saveStudentStats(studentId, DEFAULT_STATS);
    return DEFAULT_STATS;
  }
  return existing;
};

/**
 * Reset all stats for a student (admin/testing only)
 */
export const resetStudentStats = (studentId: string): StudentStats => {
  saveStudentStats(studentId, DEFAULT_STATS);
  return DEFAULT_STATS;
};

/**
 * Get all students' stats (for admin panel if needed)
 */
export const getAllStudentsStats = (): Record<string, StudentStats> => {
  if (typeof window === 'undefined') return {};
  
  const allStats: Record<string, StudentStats> = {};
  
  for (const key in localStorage) {
    if (key.startsWith('studentStats_')) {
      const studentId = key.replace('studentStats_', '');
      try {
        const stats = JSON.parse(localStorage.getItem(key) || '{}');
        allStats[studentId] = stats;
      } catch (error) {
        console.error('[StatsTracker] Error parsing stats for', studentId, error);
      }
    }
  }
  
  return allStats;
};
