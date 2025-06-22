/**
 * Polygon types for boolean operations
 */
export const PolygonType = {
  SUBJECT: 0,
  CLIPPING: 1,
} as const;

export type PolygonType = typeof PolygonType[keyof typeof PolygonType];