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
- Constructor: `new Polygon(contours?: Contour[])`
- Methods:
  - `addContours(contours: Contour[])` - Add multiple contours
  - `getContours(): Contour[]` - Get all contour objects
  - `pushbackContour(): Contour` - Create and add a new empty contour
  - `contourCount(): number` - Get number of contours
  - `contour(index: number): Contour` - Get contour by index

#### Contour Class
- Constructor: `new Contour(points?: Point[])`
- Methods:
  - `getPoints(): Point[]` - Get contour points
  - `addPoint(point: Point): void` - Add a single point
  - `pointCount(): number` - Get number of points
  - `segment(i: number): Segment` - Get segment at index
  - `isHole(): boolean` - Check if this contour is a hole
  - `getParentHoleIndex(): number | null` - Get parent contour index if this is a hole
  - `getChildHoleIndices(): number[]` - Get indices of child holes
  - `getDepth(): number` - Get nesting depth

- Methods for internal use
  - `setParentIndex(parentIndex: number): void` - Set this contour as a hole of another
  - `addHole(holeIndex: number): void` - Add a hole to this contour
  - `setPoints(points: Point[]): void` - Set contour points
  - `setDepth(depth: number): void` - Set the nesting depth

#### BooleanOperationType Enum
```typescript
enum BooleanOperationType {
  INTERSECTION = 0,
  UNION = 1,
  DIFFERENCE = 2,
  XOR = 3
}
```

#### Polygon Class (Updated)
- Constructor: `new Polygon(contours?: Contour[])`
- Methods:
  - `addContour(points: Point[]): void` - Add contour from point array (convenience method)
  - `addContours(contours: Contour[])` - Add multiple contours
  - `getContours(): Contour[]` - Get all contour objects
  - `pushbackContour(): Contour` - Create and add a new empty contour
  - `contourCount(): number` - Get number of contours
  - `contour(index: number): Contour` - Get contour by index

#### BooleanOperationResult Interface (New)
```typescript
interface BooleanOperationResult {
  polygon: Polygon;
  intersections: Point[];
}
```

### Basic Usage Pattern

```typescript
import { Martinez, Polygon, BooleanOperationType } from '@avdl/martinez';

// Create polygons using convenience method
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

// Method 1: Standard boolean operation
const martinez = new Martinez(polygon1, polygon2);
const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);

// Extract result contours
const resultContours = result.getContours();
console.log('Result polygon contours:', resultContours.map(c => c.getPoints()));

// Method 2: Boolean operation with intersection tracking (NEW)
const detailedResult = martinez.performBooleanCalculation(BooleanOperationType.INTERSECTION);
console.log('Result polygon:', detailedResult.polygon.getContours().map(c => c.getPoints()));
console.log('Intersection points found:', detailedResult.intersections);
```

### Multiple Contours (Polygons with Holes)

```typescript
// Create polygon with hole
const outerContour = new Contour([
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
]);

const holeContour = new Contour([
  { x: 25, y: 25 },
  { x: 25, y: 75 },
  { x: 75, y: 75 },
  { x: 75, y: 25 }
]);

const outerPolygon = new Polygon([outerContour, holeContour]);
```

### Working with Contour Parent-Child Relationships

The library now supports tracking parent-child relationships between contours and their holes:

```typescript
import { Martinez, Polygon, BooleanOperationType } from '@avdl/martinez';

// After performing a boolean operation
const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);

// Access individual contours to examine hole relationships
const contours = result.getContours();

contours.forEach((contour, index) => {
  console.log(`Contour ${index}:`);

  // Check if this contour is a hole
  if (contour.isHole()) {
    const parentId = contour.getParentHoleIndex();
    console.log(`  This is a hole of contour ${parentId}`);
    console.log(`  Nesting depth: ${contour.getDepth()}`);
  } else {
    // This is an outer boundary - check for child holes
    const childHoles = contour.getChildHoleIndices();
    if (childHoles.length > 0) {
      console.log(`  This contour has ${childHoles.length} holes:`);
      childHoles.forEach(holeId => {
        console.log(`    - Hole at index ${holeId}`);
      });
    }
    console.log(`  Nesting depth: ${contour.getDepth()}`);
  }
});
```

### All Boolean Operations

```typescript
const martinez = new Martinez(polygon1, polygon2);

// Standard operations (polygon result only)
const union = martinez.computeBooleanOperation(BooleanOperationType.UNION);
const intersection = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
const difference = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
const xor = martinez.computeBooleanOperation(BooleanOperationType.XOR);

// Enhanced operations with intersection tracking (NEW)
const unionWithIntersections = martinez.performBooleanCalculation(BooleanOperationType.UNION);
const intersectionWithDetails = martinez.performBooleanCalculation(BooleanOperationType.INTERSECTION);
const differenceWithDetails = martinez.performBooleanCalculation(BooleanOperationType.DIFFERENCE);
const xorWithDetails = martinez.performBooleanCalculation(BooleanOperationType.XOR);

// Access intersection points
console.log('Union intersections:', unionWithIntersections.intersections);
console.log('Intersection details:', intersectionWithDetails.intersections);
```

### Error Handling
The Martinez algorithm may produce empty results for non-overlapping polygons or invalid input. Always check the result:

```typescript
const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
if (result.contourCount() === 0) {
  console.log('No intersection found');
} else {
  const contours = result.getContours();
  // Process result contours
}
```

## Advanced Usage

### Statistics and Intersection Analysis

```typescript
const martinez = new Martinez(polygon1, polygon2);

// Method 1: Using legacy intersection count
const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
const intersectionCount = martinez.getIntersectionCount();
console.log(`Found ${intersectionCount} intersections during computation`);

// Method 2: Using new intersection tracking (RECOMMENDED)
const detailedResult = martinez.performBooleanCalculation(BooleanOperationType.UNION);
console.log(`Found ${detailedResult.intersections.length} intersections`);
console.log('Intersection coordinates:', detailedResult.intersections);

// Analyze intersection patterns
detailedResult.intersections.forEach((point, index) => {
  console.log(`Intersection ${index + 1}: (${point.x}, ${point.y})`);
});
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
    const result = martinez.performBooleanCalculation(op);
    return {
      operation: op,
      polygon: result.polygon,
      intersections: result.intersections,
      intersectionCount: result.intersections.length
    };
  });
}

// Enhanced batch processing with detailed analysis
function analyzeAllOperations(poly1: Polygon, poly2: Polygon) {
  const results = performAllOperations(poly1, poly2);
  
  results.forEach(({ operation, polygon, intersections }) => {
    const opName = BooleanOperationType[operation];
    console.log(`${opName}:`);
    console.log(`  Result contours: ${polygon.contourCount()}`);
    console.log(`  Intersections: ${intersections.length}`);
    
    if (intersections.length > 0) {
      console.log('  Intersection points:');
      intersections.forEach((point, i) => {
        console.log(`    ${i + 1}: (${point.x}, ${point.y})`);
      });
    }
  });
  
  return results;
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

### Processing Complex Nested Polygons
```typescript
function analyzePolygonStructure(result: Polygon) {
  const contours = result.contours;

  // Find all outer boundaries (non-holes)
  const outerBoundaries = contours.filter(c => !c.isHole());

  console.log(`Found ${outerBoundaries.length} outer boundaries`);

  outerBoundaries.forEach((boundary, index) => {
    const boundaryIndex = contours.indexOf(boundary);
    const holes = boundary.getChildHoleIds();

    console.log(`Outer boundary ${boundaryIndex}:`);
    console.log(`  Points: ${boundary.getPoints().length}`);
    console.log(`  Holes: ${holes.length}`);
    console.log(`  Depth: ${boundary.getDepth()}`);

    // Process each hole
    holes.forEach(holeId => {
      const hole = contours[holeId];
      if (hole) {
        console.log(`  Hole ${holeId}:`);
        console.log(`    Points: ${hole.getPoints().length}`);
        console.log(`    Depth: ${hole.getDepth()}`);

        // Check if this hole has its own holes (nested structure)
        const nestedHoles = hole.getChildHoleIds();
        if (nestedHoles.length > 0) {
          console.log(`    Nested holes: ${nestedHoles.join(', ')}`);
        }
      }
    });
  });
}

// Usage
const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
analyzePolygonStructure(result);
```

This package provides a robust, type-safe implementation of polygon Boolean operations suitable for computational geometry applications, GIS systems, and graphics processing.