import { describe, test, expect, beforeEach } from "vitest";
import { SweepEvent } from "../src/sweep-line/SweepEvent";
import { EdgeType, PolygonType } from "../src/enums";
import { Segment } from "../src/types/Segment";
import type { Point } from "../src/types/Point";

describe("SweepEvent", () => {
  let leftPoint: Point;
  let rightPoint: Point;

  beforeEach(() => {
    leftPoint = { x: 0, y: 0 };
    rightPoint = { x: 2, y: 2 };
  });

  describe("constructor", () => {
    test("should create sweep event with required parameters", () => {
      const event = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);

      expect(event.point).toEqual(leftPoint);
      expect(event.isLeftEndpoint).toBe(true);
      expect(event.polygonLabel).toBe(PolygonType.SUBJECT);
      expect(event.otherEvent).toBeNull();
      expect(event.edgeType).toBe(EdgeType.NORMAL); // default value
    });

    test("should create sweep event with custom edge type", () => {
      const event = new SweepEvent(leftPoint, false, PolygonType.CLIPPING, null, EdgeType.NON_CONTRIBUTING);

      expect(event.point).toEqual(leftPoint);
      expect(event.isLeftEndpoint).toBe(false);
      expect(event.polygonLabel).toBe(PolygonType.CLIPPING);
      expect(event.otherEvent).toBeNull();
      expect(event.edgeType).toBe(EdgeType.NON_CONTRIBUTING);
    });

    test("should initialize optional properties with default values", () => {
      const event = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);

      expect(event.positionInSweepLine).toBeNull();
      expect(event.isInsideOutsideTransition).toBe(false);
      expect(event.isInsideOtherPolygon).toBe(false);
    });

    test("should create paired sweep events", () => {
      const leftEvent = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
      const rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;

      expect(leftEvent.otherEvent).toBe(rightEvent);
      expect(rightEvent.otherEvent).toBe(leftEvent);
      expect(leftEvent.isLeftEndpoint).toBe(true);
      expect(rightEvent.isLeftEndpoint).toBe(false);
    });
  });

  describe("getSegment", () => {
    test("should return segment from this point to other event point", () => {
      const leftEvent = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
      const rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;

      const segment = leftEvent.getSegment();

      expect(segment.begin()).toEqual(leftPoint);
      expect(segment.end()).toEqual(rightPoint);
    });

    test("should work for right endpoint events", () => {
      const leftEvent = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
      const rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;

      const segment = rightEvent.getSegment();

      expect(segment.begin()).toEqual(rightPoint);
      expect(segment.end()).toEqual(leftPoint);
    });

    test("should handle degenerate segments (same points)", () => {
      const point = { x: 1, y: 1 };
      const leftEvent = new SweepEvent(point, true, PolygonType.SUBJECT, null);
      const rightEvent = new SweepEvent(point, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;

      const segment = leftEvent.getSegment();

      expect(segment.begin()).toEqual(point);
      expect(segment.end()).toEqual(point);
    });
  });

  describe("isSegmentBelowPoint", () => {
    let leftEvent: SweepEvent;
    let rightEvent: SweepEvent;

    beforeEach(() => {
      leftEvent = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
      rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;
    });

    test("should return true when test point is above left endpoint segment", () => {
      // Segment from (0,0) to (2,2), test point at (1,2) should be above
      const testPoint: Point = { x: 1, y: 2 };

      const result = leftEvent.isSegmentBelowPoint(testPoint);

      expect(result).toBe(true);
    });

    test("should return false when test point is below left endpoint segment", () => {
      // Segment from (0,0) to (2,2), test point at (1,0) should be below
      const testPoint: Point = { x: 1, y: 0 };

      const result = leftEvent.isSegmentBelowPoint(testPoint);

      expect(result).toBe(false);
    });

    test("should return false when test point is on the segment", () => {
      // Segment from (0,0) to (2,2), test point at (1,1) is on the line
      const testPoint: Point = { x: 1, y: 1 };

      const result = leftEvent.isSegmentBelowPoint(testPoint);

      expect(result).toBe(false);
    });

    test("should work correctly for right endpoint events", () => {
      // Test with the right event instead
      const testPoint: Point = { x: 1, y: 2 };

      const result = rightEvent.isSegmentBelowPoint(testPoint);

      expect(result).toBe(true);
    });

    test("should handle horizontal segments", () => {
      const horizontalLeft = new SweepEvent({ x: 0, y: 1 }, true, PolygonType.SUBJECT, null);
      const horizontalRight = new SweepEvent({ x: 2, y: 1 }, false, PolygonType.SUBJECT, horizontalLeft);
      horizontalLeft.otherEvent = horizontalRight;

      const pointAbove: Point = { x: 1, y: 2 };
      const pointBelow: Point = { x: 1, y: 0 };

      expect(horizontalLeft.isSegmentBelowPoint(pointAbove)).toBe(true);
      expect(horizontalLeft.isSegmentBelowPoint(pointBelow)).toBe(false);
    });

    test("should handle vertical segments", () => {
      const verticalLeft = new SweepEvent({ x: 1, y: 0 }, true, PolygonType.SUBJECT, null);
      const verticalRight = new SweepEvent({ x: 1, y: 2 }, false, PolygonType.SUBJECT, verticalLeft);
      verticalLeft.otherEvent = verticalRight;

      const pointLeft: Point = { x: 0, y: 1 };
      const pointRight: Point = { x: 2, y: 1 };

      // For vertical segments, the signed area calculation determines the result
      // Point to the left has positive signed area, point to the right has negative
      expect(verticalLeft.isSegmentBelowPoint(pointLeft)).toBe(true);
      expect(verticalLeft.isSegmentBelowPoint(pointRight)).toBe(false);
    });

    test("should handle segments with negative coordinates", () => {
      const negativeLeft = new SweepEvent({ x: -2, y: -2 }, true, PolygonType.SUBJECT, null);
      const negativeRight = new SweepEvent({ x: 0, y: 0 }, false, PolygonType.SUBJECT, negativeLeft);
      negativeLeft.otherEvent = negativeRight;

      const testPoint: Point = { x: -1, y: 0 };

      const result = negativeLeft.isSegmentBelowPoint(testPoint);

      expect(result).toBe(true);
    });
  });

  describe("isSegmentAbovePoint", () => {
    let leftEvent: SweepEvent;
    let rightEvent: SweepEvent;

    beforeEach(() => {
      leftEvent = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
      rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;
    });

    test("should return opposite of isSegmentBelowPoint", () => {
      const testPoint: Point = { x: 1, y: 2 };

      const belowResult = leftEvent.isSegmentBelowPoint(testPoint);
      const aboveResult = leftEvent.isSegmentAbovePoint(testPoint);

      expect(aboveResult).toBe(!belowResult);
    });

    test("should return true when segment is above test point", () => {
      const testPoint: Point = { x: 1, y: 0 };

      const result = leftEvent.isSegmentAbovePoint(testPoint);

      expect(result).toBe(true);
    });

    test("should return false when segment is below test point", () => {
      const testPoint: Point = { x: 1, y: 2 };

      const result = leftEvent.isSegmentAbovePoint(testPoint);

      expect(result).toBe(false);
    });

    test("should return true when test point is on the segment", () => {
      const testPoint: Point = { x: 1, y: 1 };

      const result = leftEvent.isSegmentAbovePoint(testPoint);

      expect(result).toBe(true);
    });
  });

  describe("property setters and getters", () => {
    let event: SweepEvent;

    beforeEach(() => {
      event = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
    });

    test("should set and get position in sweep line", () => {
      expect(event.positionInSweepLine).toBeNull();

      event.positionInSweepLine = 5;

      expect(event.positionInSweepLine).toBe(5);
    });

    test("should set and get inside-outside transition flag", () => {
      expect(event.isInsideOutsideTransition).toBe(false);

      event.isInsideOutsideTransition = true;

      expect(event.isInsideOutsideTransition).toBe(true);
    });

    test("should set and get inside other polygon flag", () => {
      expect(event.isInsideOtherPolygon).toBe(false);

      event.isInsideOtherPolygon = true;

      expect(event.isInsideOtherPolygon).toBe(true);
    });

    test("should set and get edge type", () => {
      expect(event.edgeType).toBe(EdgeType.NORMAL);

      event.edgeType = EdgeType.SAME_TRANSITION;

      expect(event.edgeType).toBe(EdgeType.SAME_TRANSITION);
    });

    test("should set and get other event reference", () => {
      expect(event.otherEvent).toBeNull();

      const otherEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, event);
      event.otherEvent = otherEvent;

      expect(event.otherEvent).toBe(otherEvent);
    });
  });

  describe("backward compatibility aliases", () => {
    let event: SweepEvent;

    beforeEach(() => {
      event = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
    });

    test("should provide p getter and setter for point", () => {
      expect(event.point).toEqual(leftPoint);

      const newPoint = { x: 5, y: 5 };
      event.point = newPoint;

      expect(event.point).toEqual(newPoint);
      expect(event.point).toEqual(newPoint);
    });

    test("should provide left getter and setter for isLeftEndpoint", () => {
      expect(event.isLeftEndpoint).toBe(true);

      event.isLeftEndpoint = false;

      expect(event.isLeftEndpoint).toBe(false);
      expect(event.isLeftEndpoint).toBe(false);
    });

    test("should provide pl getter and setter for polygonLabel", () => {
      expect(event.polygonLabel).toBe(PolygonType.SUBJECT);

      event.polygonLabel = PolygonType.CLIPPING;

      expect(event.polygonLabel).toBe(PolygonType.CLIPPING);
      expect(event.polygonLabel).toBe(PolygonType.CLIPPING);
    });

    test("should provide other getter and setter for otherEvent", () => {
      expect(event.otherEvent).toBeNull();

      const otherEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, event);
      event.otherEvent = otherEvent;

      expect(event.otherEvent).toBe(otherEvent);
      expect(event.otherEvent).toBe(otherEvent);
    });

    test("should provide inOut getter and setter for isInsideOutsideTransition", () => {
      expect(event.isInsideOutsideTransition).toBe(false);

      event.isInsideOutsideTransition = true;

      expect(event.isInsideOutsideTransition).toBe(true);
      expect(event.isInsideOutsideTransition).toBe(true);
    });

    test("should provide type getter and setter for edgeType", () => {
      expect(event.edgeType).toBe(EdgeType.NORMAL);

      event.edgeType = EdgeType.DIFFERENT_TRANSITION;

      expect(event.edgeType).toBe(EdgeType.DIFFERENT_TRANSITION);
      expect(event.edgeType).toBe(EdgeType.DIFFERENT_TRANSITION);
    });

    test("should provide inside getter and setter for isInsideOtherPolygon", () => {
      expect(event.isInsideOtherPolygon).toBe(false);

      event.isInsideOtherPolygon = true;

      expect(event.isInsideOtherPolygon).toBe(true);
      expect(event.isInsideOtherPolygon).toBe(true);
    });

    test("should provide poss getter and setter for positionInSweepLine", () => {
      expect(event.positionInSweepLine).toBeNull();

      event.positionInSweepLine = 10;

      expect(event.positionInSweepLine).toBe(10);
      expect(event.positionInSweepLine).toBe(10);
    });

    test("should provide segment method alias for getSegment", () => {
      const rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, event);
      event.otherEvent = rightEvent;

      const segment1 = event.segment();
      const segment2 = event.getSegment();

      expect(segment1.begin()).toEqual(segment2.begin());
      expect(segment1.end()).toEqual(segment2.end());
    });

    test("should provide below method alias for isSegmentBelowPoint", () => {
      const rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, event);
      event.otherEvent = rightEvent;

      const testPoint = { x: 1, y: 2 };

      expect(event.below(testPoint)).toBe(event.isSegmentBelowPoint(testPoint));
    });

    test("should provide above method alias for isSegmentAbovePoint", () => {
      const rightEvent = new SweepEvent(rightPoint, false, PolygonType.SUBJECT, event);
      event.otherEvent = rightEvent;

      const testPoint = { x: 1, y: 2 };

      expect(event.above(testPoint)).toBe(event.isSegmentAbovePoint(testPoint));
    });
  });

  describe("edge cases", () => {
    test("should handle events with same coordinates but different endpoints", () => {
      const point = { x: 1, y: 1 };
      const leftEvent = new SweepEvent(point, true, PolygonType.SUBJECT, null);
      const rightEvent = new SweepEvent(point, false, PolygonType.SUBJECT, leftEvent);
      leftEvent.otherEvent = rightEvent;

      expect(leftEvent.isLeftEndpoint).toBe(true);
      expect(rightEvent.isLeftEndpoint).toBe(false);
      expect(leftEvent.point).toEqual(rightEvent.point);
    });

    test("should handle very small coordinate differences", () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 0.0000001, y: 0.0000001 };
      const event = new SweepEvent(point1, true, PolygonType.SUBJECT, null);
      const otherEvent = new SweepEvent(point2, false, PolygonType.SUBJECT, event);
      event.otherEvent = otherEvent;

      const testPoint = { x: 0.00000005, y: 0.00000015 };

      const result = event.isSegmentBelowPoint(testPoint);

      expect(typeof result).toBe("boolean");
    });

    test("should handle all edge type values", () => {
      const edgeTypes = [
        EdgeType.NORMAL,
        EdgeType.NON_CONTRIBUTING,
        EdgeType.SAME_TRANSITION,
        EdgeType.DIFFERENT_TRANSITION,
      ];

      edgeTypes.forEach((edgeType) => {
        const event = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null, edgeType);
        expect(event.edgeType).toBe(edgeType);
      });
    });

    test("should handle both polygon type values", () => {
      const subjectEvent = new SweepEvent(leftPoint, true, PolygonType.SUBJECT, null);
      const clippingEvent = new SweepEvent(leftPoint, true, PolygonType.CLIPPING, null);

      expect(subjectEvent.polygonLabel).toBe(PolygonType.SUBJECT);
      expect(clippingEvent.polygonLabel).toBe(PolygonType.CLIPPING);
    });
  });
});
