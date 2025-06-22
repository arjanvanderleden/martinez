// Main exports for the Martinez clipping library

// Main algorithm class
export { Martinez } from './martinez';

// Type definitions
export type { Point } from './types';
export { Segment, Contour, Polygon } from './types';

// Enums
export { BooleanOperationType, EdgeType, PolygonType } from './enums';

// Data structures (for advanced users)
export { PriorityQueue, OrderedSet } from './data-structures';

// Geometry utilities (for advanced users)
export { calculateSignedArea, findSegmentIntersection, isPointOnSegment } from './geometry';

// Sweep line components (for advanced users)
export { SweepEvent, SweepEventComparator, SegmentComparator } from './sweep-line';

// Connector components (for advanced users)
export { PointChain, Connector } from './connector';
