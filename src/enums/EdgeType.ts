/**
 * Edge types for sweep line algorithm
 */
export const EdgeType = {
  NORMAL: 0,
  NON_CONTRIBUTING: 1,
  SAME_TRANSITION: 2,
  DIFFERENT_TRANSITION: 3,
} as const;

export type EdgeType = typeof EdgeType[keyof typeof EdgeType];