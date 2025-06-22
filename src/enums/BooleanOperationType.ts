/**
 * Boolean operation types for polygon clipping
 */
export const BooleanOperationType = {
  INTERSECTION: 0,
  UNION: 1,
  DIFFERENCE: 2,
  XOR: 3,
} as const;

export type BooleanOperationType = typeof BooleanOperationType[keyof typeof BooleanOperationType];