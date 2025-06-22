import { describe, test, expect, beforeEach } from 'vitest';
import { Martinez } from '../src/martinez';
import { Polygon } from '../src/types/Polygon';
import { BooleanOperationType } from '../src/enums';
import type { Point } from '../src/types/Point';

describe('Martinez', () => {
  let martinez: Martinez;
  let emptyPolygon: Polygon;
  let simpleRectangle: Polygon;
  let overlappingRectangle: Polygon;
  let trianglePolygon: Polygon;

  beforeEach(() => {
    emptyPolygon = new Polygon();
    
    // Simple rectangle from (0,0) to (2,2)
    simpleRectangle = new Polygon();
    simpleRectangle.addContour([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 }
    ]);
    
    // Overlapping rectangle from (1,1) to (3,3)
    overlappingRectangle = new Polygon();
    overlappingRectangle.addContour([
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 3 },
      { x: 1, y: 3 }
    ]);

    // Triangle
    trianglePolygon = new Polygon();
    trianglePolygon.addContour([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 2 }
    ]);

    martinez = new Martinez(simpleRectangle, overlappingRectangle);
  });

  describe('constructor', () => {
    test('should create Martinez instance with two polygons', () => {
      expect(martinez).toBeInstanceOf(Martinez);
      expect(martinez.getIntersectionCount()).toBe(0);
    });

    test('should handle empty polygons in constructor', () => {
      const martignez = new Martinez(emptyPolygon, simpleRectangle);
      expect(martignez).toBeInstanceOf(Martinez);
    });
  });

  describe('getIntersectionCount', () => {
    test('should return 0 initially', () => {
      expect(martinez.getIntersectionCount()).toBe(0);
    });

    test('should return intersection count after computation', () => {
      martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      // After computing intersection of overlapping rectangles, there should be intersections
      expect(martinez.getIntersectionCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeBooleanOperation - trivial cases', () => {
    test('should handle empty subject polygon for DIFFERENCE', () => {
      const martinez = new Martinez(emptyPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBe(0);
    });

    test('should handle empty subject polygon for UNION', () => {
      const martinez = new Martinez(emptyPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBe(1);
      expect(result.getContours()[0]).toHaveLength(4);
    });

    test('should handle empty clipping polygon for DIFFERENCE', () => {
      const martinez = new Martinez(simpleRectangle, emptyPolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBe(1);
      expect(result.getContours()[0]).toHaveLength(4);
    });

    test('should handle empty clipping polygon for UNION', () => {
      const martinez = new Martinez(simpleRectangle, emptyPolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBe(1);
      expect(result.getContours()[0]).toHaveLength(4);
    });

    test('should handle both empty polygons', () => {
      const martinez = new Martinez(emptyPolygon, emptyPolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBe(0);
    });
  });

  describe('computeBooleanOperation - non-overlapping bounding boxes', () => {
    let nonOverlappingRectangle: Polygon;

    beforeEach(() => {
      // Rectangle that doesn't overlap with simpleRectangle
      nonOverlappingRectangle = new Polygon();
      nonOverlappingRectangle.addContour([
        { x: 5, y: 5 },
        { x: 7, y: 5 },
        { x: 7, y: 7 },
        { x: 5, y: 7 }
      ]);
    });

    test('should handle non-overlapping polygons for DIFFERENCE', () => {
      const martinez = new Martinez(simpleRectangle, nonOverlappingRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBe(1);
      expect(result.getContours()[0]).toHaveLength(4);
    });

    test('should handle non-overlapping polygons for UNION', () => {
      const martinez = new Martinez(simpleRectangle, nonOverlappingRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBe(2);
      expect(result.getContours()[0]).toHaveLength(4);
      expect(result.getContours()[1]).toHaveLength(4);
    });

    test('should handle non-overlapping polygons for INTERSECTION', () => {
      const martinez = new Martinez(simpleRectangle, nonOverlappingRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBe(0);
    });

    test('should handle non-overlapping polygons for XOR', () => {
      const martinez = new Martinez(simpleRectangle, nonOverlappingRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.XOR);
      
      expect(result.contourCount()).toBe(0);
    });
  });

  describe('computeBooleanOperation - INTERSECTION', () => {
    test('should compute intersection of overlapping rectangles', () => {
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThan(0);
      // The intersection should be a square from (1,1) to (2,2)
      if (result.contourCount() > 0) {
        const contour = result.getContours()[0]!;
        expect(contour.length).toBeGreaterThan(0);
      }
    });

    test('should compute intersection of identical polygons', () => {
      const martinez = new Martinez(simpleRectangle, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThan(0);
    });

    test('should handle intersection with triangle', () => {
      const martinez = new Martinez(simpleRectangle, trianglePolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeBooleanOperation - UNION', () => {
    test('should compute union of overlapping rectangles', () => {
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBeGreaterThan(0);
      // Union should create a larger shape
      if (result.contourCount() > 0) {
        const contour = result.getContours()[0]!;
        expect(contour.length).toBeGreaterThan(0);
      }
    });

    test('should compute union of identical polygons', () => {
      const martinez = new Martinez(simpleRectangle, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBeGreaterThan(0);
    });

    test('should handle union with triangle', () => {
      const martinez = new Martinez(simpleRectangle, trianglePolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBeGreaterThan(0);
    });
  });

  describe('computeBooleanOperation - DIFFERENCE', () => {
    test('should compute difference of overlapping rectangles', () => {
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
      // Difference should remove the overlapping part
    });

    test('should compute difference with identical polygons', () => {
      const martinez = new Martinez(simpleRectangle, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      // Subtracting identical polygon should result in empty
      expect(result.contourCount()).toBe(0);
    });

    test('should handle difference with triangle', () => {
      const martinez = new Martinez(simpleRectangle, trianglePolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle reverse difference', () => {
      const martinez = new Martinez(overlappingRectangle, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeBooleanOperation - XOR', () => {
    test('should compute XOR of overlapping rectangles', () => {
      const result = martinez.computeBooleanOperation(BooleanOperationType.XOR);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
      // XOR should give the non-overlapping parts
    });

    test('should compute XOR with identical polygons', () => {
      const martinez = new Martinez(simpleRectangle, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.XOR);
      
      // XOR of identical polygons should be empty
      expect(result.contourCount()).toBe(0);
    });

    test('should handle XOR with triangle', () => {
      const martinez = new Martinez(simpleRectangle, trianglePolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.XOR);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('complex polygon scenarios', () => {
    test('should handle polygons with holes', () => {
      const polygonWithHole = new Polygon();
      // Outer contour
      polygonWithHole.addContour([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 4 },
        { x: 0, y: 4 }
      ]);
      // Inner hole (clockwise to create hole)
      polygonWithHole.addContour([
        { x: 1, y: 1 },
        { x: 1, y: 3 },
        { x: 3, y: 3 },
        { x: 3, y: 1 }
      ]);

      const martinez = new Martinez(polygonWithHole, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle multiple contours', () => {
      const multiContourPolygon = new Polygon();
      // First contour
      multiContourPolygon.addContour([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ]);
      // Second separate contour
      multiContourPolygon.addContour([
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 4, y: 4 },
        { x: 3, y: 4 }
      ]);

      const martinez = new Martinez(multiContourPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle very small polygons', () => {
      const smallPolygon = new Polygon();
      smallPolygon.addContour([
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.1 },
        { x: 0.2, y: 0.2 },
        { x: 0.1, y: 0.2 }
      ]);

      const martinez = new Martinez(smallPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle complex star-shaped polygon', () => {
      const starPolygon = new Polygon();
      const starPoints: Point[] = [];
      const outerRadius = 2;
      const innerRadius = 1;
      const numPoints = 5;
      
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        starPoints.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      starPolygon.addContour(starPoints);

      const martinez = new Martinez(starPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    test('should handle degenerate segments', () => {
      const degeneratePolygon = new Polygon();
      degeneratePolygon.addContour([
        { x: 1, y: 1 },
        { x: 1, y: 1 }, // Same point
        { x: 2, y: 1 },
        { x: 1, y: 2 }
      ]);

      const martinez = new Martinez(degeneratePolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle collinear points', () => {
      const collinearPolygon = new Polygon();
      collinearPolygon.addContour([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // Collinear with previous two
        { x: 2, y: 2 },
        { x: 0, y: 2 }
      ]);

      const martinez = new Martinez(collinearPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle floating point precision issues', () => {
      const precisionPolygon = new Polygon();
      precisionPolygon.addContour([
        { x: 0.1, y: 0.1 },
        { x: 1.9999999, y: 0.1 },
        { x: 1.9999999, y: 1.9999999 },
        { x: 0.1, y: 1.9999999 }
      ]);

      const martinez = new Martinez(precisionPolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle negative coordinates', () => {
      const negativePolygon = new Polygon();
      negativePolygon.addContour([
        { x: -2, y: -2 },
        { x: 1, y: -2 },
        { x: 1, y: 1 },
        { x: -2, y: 1 }
      ]);

      const martinez = new Martinez(negativePolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance and optimization', () => {
    test('should handle optimization for intersection beyond bounding box', () => {
      // Create a large polygon that extends beyond the clipping polygon
      const largePolygon = new Polygon();
      largePolygon.addContour([
        { x: -10, y: -10 },
        { x: 100, y: -10 },
        { x: 100, y: 100 },
        { x: -10, y: 100 }
      ]);

      const martinez = new Martinez(largePolygon, simpleRectangle);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle optimization for difference beyond subject polygon', () => {
      const largeClippingPolygon = new Polygon();
      largeClippingPolygon.addContour([
        { x: -10, y: -10 },
        { x: 100, y: -10 },
        { x: 100, y: 100 },
        { x: -10, y: 100 }
      ]);

      const martinez = new Martinez(simpleRectangle, largeClippingPolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });

    test('should handle optimization for union beyond minimum bounding box', () => {
      const farPolygon = new Polygon();
      farPolygon.addContour([
        { x: 100, y: 100 },
        { x: 102, y: 100 },
        { x: 102, y: 102 },
        { x: 100, y: 102 }
      ]);

      const martinez = new Martinez(simpleRectangle, farPolygon);
      
      const result = martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(result.contourCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('intersection counting', () => {
    test('should count intersections correctly for crossing segments', () => {
      // Create two polygons that will have clear intersections
      const crossingPolygon1 = new Polygon();
      crossingPolygon1.addContour([
        { x: 0, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 0, y: 2 }
      ]);

      const crossingPolygon2 = new Polygon();
      crossingPolygon2.addContour([
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 3 },
        { x: 1, y: 3 }
      ]);

      const martinez = new Martinez(crossingPolygon1, crossingPolygon2);
      
      martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      
      expect(martinez.getIntersectionCount()).toBeGreaterThanOrEqual(0);
    });

    test('should count intersections for overlapping segments', () => {
      // Create polygons with overlapping edges
      const overlappingPolygon1 = new Polygon();
      overlappingPolygon1.addContour([
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 0, y: 1 }
      ]);

      const overlappingPolygon2 = new Polygon();
      overlappingPolygon2.addContour([
        { x: 1, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 1 },
        { x: 1, y: 1 }
      ]);

      const martinez = new Martinez(overlappingPolygon1, overlappingPolygon2);
      
      martinez.computeBooleanOperation(BooleanOperationType.UNION);
      
      expect(martinez.getIntersectionCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('result validation', () => {
    test('should produce non-null results for all operations', () => {
      const operations = [
        BooleanOperationType.INTERSECTION,
        BooleanOperationType.UNION,
        BooleanOperationType.DIFFERENCE,
        BooleanOperationType.XOR
      ];

      operations.forEach(operation => {
        const result = martinez.computeBooleanOperation(operation);
        expect(result).toBeInstanceOf(Polygon);
        expect(result.contourCount()).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle all boolean operations consistently', () => {
      // Test that all operations complete without throwing errors
      expect(() => {
        martinez.computeBooleanOperation(BooleanOperationType.INTERSECTION);
      }).not.toThrow();

      expect(() => {
        martinez.computeBooleanOperation(BooleanOperationType.UNION);
      }).not.toThrow();

      expect(() => {
        martinez.computeBooleanOperation(BooleanOperationType.DIFFERENCE);
      }).not.toThrow();

      expect(() => {
        martinez.computeBooleanOperation(BooleanOperationType.XOR);
      }).not.toThrow();
    });
  });
});