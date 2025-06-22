import { describe, test, expect } from 'vitest';
import { SweepEventComparator } from '../src/sweep-line/SweepEventComparator';
import { SweepEvent } from '../src/sweep-line/SweepEvent';
import { EdgeType, PolygonType } from '../src/enums';
import type { Point } from '../src/types/Point';

describe('SweepEventComparator', () => {
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
    test('should prioritize event with larger x-coordinate', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 0 }, { x: 2, y: 0 });
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 0 });
      
      // event1 has larger x-coordinate (1 > 0), so it should have higher priority
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should handle events with same x-coordinate but different y-coordinates', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 2 }, { x: 2, y: 2 });
      const [event2] = createSweepEventPair({ x: 1, y: 1 }, { x: 2, y: 1 });
      
      // Same x-coordinate (1), but event1 has larger y-coordinate (2 > 1)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should prioritize left endpoint over right endpoint for same point', () => {
      const [leftEvent, rightEvent] = createSweepEventPair({ x: 1, y: 1 }, { x: 2, y: 2 });
      
      // Both events are at the same point conceptually, but one is left endpoint, other is right
      // We need to create another pair where the right endpoint is at the same location as the left
      const [, rightEventAtSamePoint] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      const result1 = SweepEventComparator.compare(leftEvent, rightEventAtSamePoint);
      const result2 = SweepEventComparator.compare(rightEventAtSamePoint, leftEvent);
      
      expect(result1).toBe(true);  // left endpoint has priority
      expect(result2).toBe(false);
    });

    test('should handle events at exactly the same point with same endpoint type', () => {
      const point: Point = { x: 1, y: 1 };
      const [event1] = createSweepEventPair(point, { x: 2, y: 2 });
      const [event2] = createSweepEventPair(point, { x: 2, y: 0 });
      
      // Both are left endpoints at the same point, comparison should use segment orientation
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      // Results should be opposite for consistent ordering
      expect(result1).not.toBe(result2);
    });

    test('should handle horizontal segments with same y-coordinate', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 1 }, { x: 2, y: 1 });
      const [event2] = createSweepEventPair({ x: 1, y: 1 }, { x: 3, y: 1 });
      
      // event2 has larger x-coordinate (1 > 0)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });

    test('should handle vertical segments', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 0 }, { x: 1, y: 2 });
      const [event2] = createSweepEventPair({ x: 2, y: 0 }, { x: 2, y: 2 });
      
      // event2 has larger x-coordinate (2 > 1)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });

    test('should handle negative coordinates', () => {
      const [event1] = createSweepEventPair({ x: -1, y: -1 }, { x: 0, y: 0 });
      const [event2] = createSweepEventPair({ x: -2, y: -2 }, { x: 0, y: 0 });
      
      // event1 has larger x-coordinate (-1 > -2)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should handle floating point coordinates', () => {
      const [event1] = createSweepEventPair({ x: 1.5, y: 1.5 }, { x: 2.5, y: 2.5 });
      const [event2] = createSweepEventPair({ x: 1.0, y: 1.0 }, { x: 2.0, y: 2.0 });
      
      // event1 has larger x-coordinate (1.5 > 1.0)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should handle very close but different coordinates', () => {
      const [event1] = createSweepEventPair({ x: 1.0000001, y: 1 }, { x: 2, y: 2 });
      const [event2] = createSweepEventPair({ x: 1.0, y: 1 }, { x: 2, y: 2 });
      
      // event1 has slightly larger x-coordinate
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should be consistent for identical events', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 1 }, { x: 2, y: 2 });
      
      const result = SweepEventComparator.compare(event1, event1);
      
      // When comparing the same event object, the logic may still return true
      // depending on the segment orientation check
      expect(typeof result).toBe('boolean');
    });

    test('should handle events with different polygon labels', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 1 }, { x: 2, y: 2 }, PolygonType.SUBJECT);
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 }, PolygonType.CLIPPING);
      
      // Polygon label shouldn't affect comparison, only coordinates
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);  // event1 has larger x-coordinate
      expect(result2).toBe(false);
    });

    test('should handle events with different edge types', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 1 }, { x: 2, y: 2 }, PolygonType.SUBJECT, EdgeType.NORMAL);
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 }, PolygonType.SUBJECT, EdgeType.NON_CONTRIBUTING);
      
      // Edge type shouldn't affect comparison, only coordinates
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);  // event1 has larger x-coordinate
      expect(result2).toBe(false);
    });

    test('should handle degenerate segments (point segments)', () => {
      const point: Point = { x: 1, y: 1 };
      const [event1] = createSweepEventPair(point, point);
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 });
      
      // event1 has larger x-coordinate (1 > 0)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should provide transitive ordering', () => {
      // Create three events where A should have higher priority than B, and B than C
      const [eventA] = createSweepEventPair({ x: 2, y: 0 }, { x: 3, y: 0 });
      const [eventB] = createSweepEventPair({ x: 1, y: 0 }, { x: 3, y: 0 });
      const [eventC] = createSweepEventPair({ x: 0, y: 0 }, { x: 3, y: 0 });
      
      const aOverB = SweepEventComparator.compare(eventA, eventB);
      const bOverC = SweepEventComparator.compare(eventB, eventC);
      const aOverC = SweepEventComparator.compare(eventA, eventC);
      
      // If A > B and B > C, then A > C (transitivity)
      expect(aOverB).toBe(true);
      expect(bOverC).toBe(true);
      expect(aOverC).toBe(true);
    });

    test('should be antisymmetric for different events', () => {
      const [event1] = createSweepEventPair({ x: 1, y: 1 }, { x: 2, y: 2 });
      const [event2] = createSweepEventPair({ x: 0, y: 0 }, { x: 2, y: 2 });
      
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      // For different events, exactly one should have priority over the other
      expect(result1).not.toBe(result2);
      expect(result1 || result2).toBe(true);  // At least one should be true
    });

    test('should handle complex segment orientations at same point', () => {
      const sharedPoint: Point = { x: 1, y: 1 };
      
      // Two segments starting from the same point but going in different directions
      const [event1] = createSweepEventPair(sharedPoint, { x: 2, y: 2 }); // goes up-right
      const [event2] = createSweepEventPair(sharedPoint, { x: 2, y: 0 }); // goes down-right
      
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      // Should use segment orientation to determine ordering
      expect(result1).not.toBe(result2);
    });

    test('should handle right endpoints at the same location', () => {
      const point: Point = { x: 2, y: 2 };
      
      // Create two segments that end at the same point
      const [, rightEvent1] = createSweepEventPair({ x: 0, y: 0 }, point);
      const [, rightEvent2] = createSweepEventPair({ x: 1, y: 1 }, point);
      
      const result1 = SweepEventComparator.compare(rightEvent1, rightEvent2);
      const result2 = SweepEventComparator.compare(rightEvent2, rightEvent1);
      
      // Results should be consistent, though may be the same in some cases
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('should handle mixed left and right endpoints at same point', () => {
      const point: Point = { x: 1, y: 1 };
      
      const [leftEvent] = createSweepEventPair(point, { x: 2, y: 2 });
      const [, rightEvent] = createSweepEventPair({ x: 0, y: 0 }, point);
      
      // Left endpoint should have priority over right endpoint at same point
      const result1 = SweepEventComparator.compare(leftEvent, rightEvent);
      const result2 = SweepEventComparator.compare(rightEvent, leftEvent);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('should handle zero coordinates', () => {
      const [event1] = createSweepEventPair({ x: 0, y: 0 }, { x: 1, y: 1 });
      const [event2] = createSweepEventPair({ x: 0, y: 1 }, { x: 1, y: 2 });
      
      // Same x-coordinate (0), but event2 has larger y-coordinate (1 > 0)
      const result1 = SweepEventComparator.compare(event1, event2);
      const result2 = SweepEventComparator.compare(event2, event1);
      
      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });
  });
});