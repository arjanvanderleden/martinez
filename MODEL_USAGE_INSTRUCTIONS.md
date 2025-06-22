# @avdl/martinez Package Usage Instructions for Coding Models

## Package Overview
`@avdl/martinez` is a TypeScript library implementing the Martinez-Rueda-Feito polygon clipping algorithm for Boolean operations on polygons. It performs union, intersection, difference, and XOR operations on complex polygons with holes.

## Installation
```bash
npm install @avdl/martinez
```

## Core API Usage

### Basic Import Pattern
```typescript
import { Martinez, Polygon, BooleanOperationType } from '@avdl/martinez';
```

### Key Types and Classes

#### Point Interface
```typescript
interface Point {
  x: number;
  y: number;
}
```

#### Polygon Class
- Constructor: `new Polygon(contours?: Point[][])`
- Methods:
  - `addContour(points: Point[]): Contour` - Add a contour to the polygon
  - `addContours(points: Point[][])` - Add multiple contours
  - `getContours(): Point[][]` - Get all contours as point arrays

#### BooleanOperationType Enum
```typescript
enum BooleanOperationType {
  INTERSECTION = 0,
  UNION = 1,
  DIFFERENCE = 2,
  XOR = 3
}
```

### Basic Usage Pattern

```typescript
import { Martinez, Polygon, BooleanOperationType } from '@avdl/martinez';

// Create polygons from point arrays
const polygon1 = new Polygon();
polygon1.addContour([
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
]);

const polygon2 = new Polygon();
polygon2.addContour([
  { x: 50, y: 50 },
  { x: 150, y: 50 },
  { x: 150, y: 150 },
  { x: 50, y: 150 }
]);

// Perform boolean operation
const martinez = new Martinez(polygon1, polygon2);
const result = martinez.compute(BooleanOperationType.INTERSECTION);

// Extract result points
const resultContours = result.getContours();
console.log('Result polygon contours:', resultContours);
```

### Multiple Contours (Polygons with Holes)

```typescript
// Create polygon with hole
const outerPolygon = new Polygon();
outerPolygon.addContours([
  // Outer boundary (counter-clockwise)
  [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ],
  // Inner hole (clockwise)
  [
    { x: 25, y: 25 },
    { x: 25, y: 75 },
    { x: 75, y: 75 },
    { x: 75, y: 25 }
  ]
]);
```

### All Boolean Operations

```typescript
const martinez = new Martinez(polygon1, polygon2);

// Union: A ∪ B
const union = martinez.compute(BooleanOperationType.UNION);

// Intersection: A ∩ B  
const intersection = martinez.compute(BooleanOperationType.INTERSECTION);

// Difference: A - B
const difference = martinez.compute(BooleanOperationType.DIFFERENCE);

// XOR: A ⊕ B (symmetric difference)
const xor = martinez.compute(BooleanOperationType.XOR);
```

### Error Handling
The Martinez algorithm may produce empty results for non-overlapping polygons or invalid input. Always check the result:

```typescript
const result = martinez.compute(BooleanOperationType.INTERSECTION);
if (result.contourCount() === 0) {
  console.log('No intersection found');
} else {
  const contours = result.getContours();
  // Process result contours
}
```

## Advanced Usage

### Statistics
```typescript
const martinez = new Martinez(polygon1, polygon2);
const result = martinez.compute(BooleanOperationType.UNION);
const intersectionCount = martinez.getIntersectionCount();
console.log(`Found ${intersectionCount} intersections during computation`);
```

### Direct Polygon Construction
```typescript
// Alternative construction method
const points = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 }
];
const polygon = new Polygon([points]); // Pass array of contours
```

## Important Notes for Models

1. **Coordinate System**: Uses regular JavaScript `number` type for coordinates
2. **Winding Order**: Counter-clockwise for outer boundaries, clockwise for holes
3. **Point Precision**: Algorithm works with floating-point coordinates
4. **Polygon Validity**: Input polygons should be non-self-intersecting
5. **Memory**: Each Martinez instance processes one pair of polygons
6. **Reusability**: Create new Martinez instance for each operation

## Common Patterns

### Batch Operations
```typescript
function performAllOperations(poly1: Polygon, poly2: Polygon) {
  const operations = [
    BooleanOperationType.UNION,
    BooleanOperationType.INTERSECTION,
    BooleanOperationType.DIFFERENCE,
    BooleanOperationType.XOR
  ];
  
  return operations.map(op => {
    const martinez = new Martinez(poly1, poly2);
    return {
      operation: op,
      result: martinez.compute(op),
      intersections: martinez.getIntersectionCount()
    };
  });
}
```

### Polygon Area Calculation
```typescript
import { calculateSignedArea } from '@avdl/martinez';

function getPolygonArea(polygon: Polygon): number {
  let totalArea = 0;
  const contours = polygon.getContours();
  
  for (const contour of contours) {
    totalArea += Math.abs(calculateSignedArea(contour));
  }
  
  return totalArea;
}
```

This package provides a robust, type-safe implementation of polygon Boolean operations suitable for computational geometry applications, GIS systems, and graphics processing.