# Martinez Polygon Clipping Library

A TypeScript implementation of the Martinez-Rueda-Feito polygon clipping algorithm for Boolean operations on polygons.

## Features

- **Boolean Operations**: Union, intersection, difference, and XOR operations on polygons
- **Multi-contour Support**: Handles polygons with holes and multiple boundaries
- **Intersection Tracking**: NEW! Get both polygon results and intersection points
- **TypeScript**: Full type safety with modern ES modules
- **Direct Translation**: Based on the C++ reference implementation
- **Sweep Line Algorithm**: Efficient O(n log n) performance
- **SVG Visualization**: Comprehensive test suite with visual debugging

## Installation

```bash
npm install @avdl/martinez
```

## Usage

### Basic Boolean Operations

```typescript
import { Martinez, Polygon, BooleanOperationType } from '@avdl/martinez';

// Create polygons using convenience method
const polygon1 = new Polygon();
polygon1.addContour([
  { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }
]);

const polygon2 = new Polygon();
polygon2.addContour([
  { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 6 }, { x: 2, y: 6 }
]);

// Standard boolean operation
const martinez = new Martinez(polygon1, polygon2);
const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);

// Get result contours
const contours = result.getContours().map(c => c.getPoints());
console.log('Result polygon:', contours);
```

### Enhanced Operations with Intersection Tracking

```typescript
// NEW: Get both polygon result AND intersection points
const detailedResult = martinez.performBooleanCalculation(BooleanOperationType.INTERSECTION);

console.log('Result polygon:', detailedResult.polygon.getContours().map(c => c.getPoints()));
console.log('Intersection points:', detailedResult.intersections);
// Output: Intersection points: [{ x: 2, y: 4 }, { x: 4, y: 2 }]
```

## Boolean Operations

- `UNION` - Combines both polygons
- `INTERSECTION` - Returns overlapping areas
- `DIFFERENCE` - Subtracts second polygon from first
- `XOR` - Returns non-overlapping areas

## Example Visualization

The library generates detailed SVG visualizations for testing complex polygon operations with intersection point tracking:

![Martinez XOR Operation](svg-results/martinez_rectangles_intersection.svg)

*Example showing intersection operation between two overlapping rectangles. Red circles mark the exact intersection points found during the sweep line algorithm.*

### Visualization Features

- **Input Polygons**: Green and orange filled shapes with contour outlines
- **Result Polygon**: Blue filled shape showing the boolean operation result  
- **Intersection Points**: Red circles with numbered labels showing exact coordinates
- **Hole Support**: Dashed lines for holes and nested contour visualization
- **Multi-contour**: Support for complex polygons with multiple boundaries

## API Reference

### Core Classes

- **`Martinez`** - Main algorithm implementation with intersection tracking
- **`Polygon`** - Container for polygon contours with convenience methods
- **`Contour`** - Individual polygon boundary with hole relationship tracking
- **`Point`** - 2D coordinate `{ x: number, y: number }`
- **`Segment`** - Line segment between two points

### Key Types

```typescript
interface Point {
  x: number;
  y: number;
}

interface BooleanOperationResult {
  polygon: Polygon;
  intersections: Point[];
}

enum BooleanOperationType {
  INTERSECTION = 0,
  UNION = 1,
  DIFFERENCE = 2,
  XOR = 3
}
```

### Main Methods

```typescript
class Martinez {
  constructor(subjectPolygon: Polygon, clippingPolygon: Polygon);
  
  // Standard boolean operation
  computeBooleanOperation(operation: BooleanOperationType): Polygon;
  
  // Enhanced operation with intersection tracking
  performBooleanCalculation(operation: BooleanOperationType): BooleanOperationResult;
  
  // Get intersection count (legacy method)
  getIntersectionCount(): number;
}

class Polygon {
  // Convenience method for easy polygon creation
  addContour(points: Point[]): void;
  
  // Get all contours
  getContours(): Contour[];
  
  // Other methods...
  contourCount(): number;
  contour(index: number): Contour;
}
```

## Development

```bash
# Build the library
npm run build

# Run tests
npm test

# Generate test visualizations with intersection tracking
npm run test:martinez

# Run comprehensive test suite
npm test

# Type checking
npm run typecheck

# Linting  
npm run lint
```

## Testing

The library includes comprehensive test suites with visual SVG output for debugging complex polygon operations. Test results are generated in the `svg-results/` directory with intersection point visualization.

### Test Features

- **48 Test Scenarios**: Complex polygon combinations including holes, multiple contours, and edge cases
- **SVG Generation**: Visual output showing input polygons, results, and intersection points
- **Intersection Tracking**: Red circles mark exact intersection coordinates found during computation
- **Performance Testing**: Large polygon sets with detailed timing analysis
- **Edge Case Validation**: Degenerate polygons, overlapping edges, and precision boundary testing

## Algorithm

This library implements the Martinez-Rueda-Feito sweep line algorithm with enhanced intersection tracking:

1. **Event Queue**: Processes polygon vertices and intersections in sorted order
2. **Sweep Line**: Maintains active edge segments during the sweep  
3. **Intersection Detection**: Finds and handles edge crossings while recording exact coordinates
4. **Result Construction**: Assembles output polygons from processed segments
5. **Intersection Collection**: NEW! Tracks all intersection points found during computation

### Performance

- **Time Complexity**: O(n log n) where n is the number of vertices
- **Space Complexity**: O(n) for event storage and sweep line status
- **Intersection Tracking**: Minimal overhead - collects points during normal algorithm execution

## License

MIT License - see package.json for details.

## Requirements

- Node.js >= 16.0.0
- TypeScript support for development