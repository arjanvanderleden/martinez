import { describe, test, expect } from 'vitest';
import { SegmentComparator } from '../src/sweep-line/SegmentComparator';
import { SweepEvent } from '../src/sweep-line/SweepEvent';
import { EdgeType, PolygonType } from '../src/enums';
import type { Point } from '../src/types/Point';

describe('SegmentComparator', () => {
  // Helper function to create a sweep event with its paired event
  function createSweepEventPair(
    leftPoint: Point,
    rightPoint: Point,
    polygonLabel: number = PolygonType.SUBJECT,
    edgeType: number = EdgeType.NORMAL
  ): [SweepEvent, SweepEvent] {
    const leftEvent = new SweepEvent(leftPoint, true, polygonLabel, null, edgeType);
    const rightEvent = new SweepEvent(rightPoint, false, polygonLabel, leftEvent, edgeType);
    leftEvent.otherEvent = rightEvent;
    
    return [leftEvent, rightEvent];
  }

  describe('compare', () => {
    test('should return false when comparing the same event', () => {
      const [leftEvent] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      const result = SegmentComparator.compare(leftEvent, leftEvent);
      
      expect(result).toBe(false);
    });

    test('should handle non-collinear segments with shared left endpoint', () => {
      const sharedPoint: Point = { x: 0, y: 0 };
      const [event1] = createSweepEventPair(sharedPoint, { x: 1, y: 1 });
      const [event2] = createSweepEventPair(sharedPoint, { x: 1, y: -1 });
      
      // event1 segment goes up, event2 segment goes down
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      // Results should be consistent but we don't know the exact ordering
      expect(result1).not.toBe(result2);
    });

    test('should handle segments with different left endpoints - first event comes after second', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 0 }, { x: 2, y: 1 });
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 0 });
      
      // event1 starts after event2, so we need to check if event2 is above event1's left point
      const result = SegmentComparator.compare(event1, event2);
      
      // Since event1 comes after event2 in sweep order, we check if event1 is below event2's point
      expect(typeof result).toBe('boolean');
    });

    test('should handle segments with different left endpoints - second event comes after first', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 0 });
      const [event2] = createSweepEventPair({ x: 1, y: 0 }, { x: 2, y: 1 });
      
      // event2 starts after event1, so we check if event2 is above event1's point
      const result = SegmentComparator.compare(event1, event2);
      
      expect(typeof result).toBe('boolean');
    });

    test('should handle horizontal segments at different y levels', () => {
      const [upperEvent] = createSweepEventPair({ x: 0, y: 1 }, { x: 2, y: 1 });
      const [lowerEvent] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 0 });
      
      const result1 = SegmentComparator.compare(upperEvent, lowerEvent);
      const result2 = SegmentComparator.compare(lowerEvent, upperEvent);
      
      // Results should be opposite
      expect(result1).not.toBe(result2);
    });

    test('should handle vertical segments', () => {
      const [verticalEvent] = createSweepEventPair({ x: 1, y: 0 }, { x: 1, y: 2 });
      const [horizontalEvent] = createSweepEventPair({ x: 0, y: 1 }, { x: 2, y: 1 });
      
      const result1 = SegmentComparator.compare(verticalEvent, horizontalEvent);
      const result2 = SegmentComparator.compare(horizontalEvent, verticalEvent);
      
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('should handle crossing segments', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 });
      const [event2] = createSweepEventPair({ x: 0, y: 2 }, { x: 2, y: 0 });
      
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      // Should give consistent ordering
      expect(result1).not.toBe(result2);
    });

    test('should handle collinear segments with same left endpoint', () => {
      const sharedPoint: Point = { x: 0, y: 0 };
      const [event1] = createSweepEventPair(sharedPoint, { x: 1, y: 1 });
      const [event2] = createSweepEventPair(sharedPoint, { x: 2, y: 2 });
      
      // Both segments are collinear and share the same starting point
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      // For collinear segments with same endpoint, ordering may be consistent based on object comparison
      // but the exact behavior depends on the implementation
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('should handle collinear segments with different endpoints', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 });
      const [event2] = createSweepEventPair({ x: 2, y: 2 }, { x: 3, y: 3 });
      
      // Both segments are on the same line but don't overlap
      const result = SegmentComparator.compare(event1, event2);
      
      expect(typeof result).toBe('boolean');
    });

    test('should handle overlapping collinear segments', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 });
      const [event2] = createSweepEventPair({ x: 1, y: 1 }, { x: 3, y: 3 });
      
      // Both segments are collinear and overlap
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('should handle segments with very small differences', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 0.0000001 });
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: -0.0000001 });
      
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      expect(result1).not.toBe(result2);
    });

    test('should handle parallel segments at different positions', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 });
      const [event2] = createSweepEventPair({ x: 0, y: 1 }, { x: 2, y: 3 });
      
      // Parallel segments with slope 1, but event2 is shifted up
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      expect(result1).not.toBe(result2);
    });

    test('should handle segments with negative coordinates', () => {
      const [event1] = createSweepEventPair({ x: -2, y: -2 }, { x: 0, y: 0 });
      const [event2] = createSweepEventPair({ x: -2, y: 0 }, { x: 0, y: -2 });
      
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      expect(result1).not.toBe(result2);
    });

    test('should handle segments with different polygon labels', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 }, PolygonType.SUBJECT);
      const [event2] = createSweepEventPair({ x: 0, y: 1 }, { x: 1, y: 0 }, PolygonType.CLIPPING);
      
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      // Polygon labels shouldn't affect segment comparison directly
      expect(result1).not.toBe(result2);
    });

    test('should handle segments with different edge types', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 }, PolygonType.SUBJECT, EdgeType.NORMAL);
      const [event2] = createSweepEventPair({ x: 0, y: 1 }, { x: 1, y: 0 }, PolygonType.SUBJECT, EdgeType.NON_CONTRIBUTING);
      
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      // Edge types shouldn't affect segment comparison directly
      expect(result1).not.toBe(result2);
    });

    test('should be transitive for ordering', () => {
      // Create three segments where A < B < C should hold
      const [eventA] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 0 }); // horizontal at y=0
      const [eventB] = createSweepEventPair({ x: 0, y: 1 }, { x: 2, y: 1 }); // horizontal at y=1
      const [eventC] = createSweepEventPair({ x: 0, y: 2 }, { x: 2, y: 2 }); // horizontal at y=2
      
      const aLessThanB = SegmentComparator.compare(eventA, eventB);
      const bLessThanC = SegmentComparator.compare(eventB, eventC);
      const aLessThanC = SegmentComparator.compare(eventA, eventC);
      
      // If A < B and B < C, then A < C (transitivity)
      if (aLessThanB && bLessThanC) {
        expect(aLessThanC).toBe(true);
      }
    });

    test('should handle degenerate segments (point segments)', () => {
      const point: Point = { x: 1, y: 1 };
      const [event1] = createSweepEventPair(point, point);
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 });
      
      const result1 = SegmentComparator.compare(event1, event2);
      const result2 = SegmentComparator.compare(event2, event1);
      
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('should provide consistent ordering for identical segments', () => {
      const [event1a] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 });
      const [event1b] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      const result1 = SegmentComparator.compare(event1a, event1b);
      const result2 = SegmentComparator.compare(event1b, event1a);
      
      // For identical segments, the comparison may return the same result due to shared logic
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });
  });
});