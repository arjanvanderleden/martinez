/**
 * Direct TypeScript translation of the Martinez C++ implementation
 * Based on martinez.h and martinez.cpp found here
 * https://github.com/akavel/martinez-src/tree/master/cageo141
 */

// Import types
import type { Point } from "./types";
import { Segment, Contour, Polygon } from "./types";
import { BooleanOperationType, EdgeType as EdgeTypeEnum, PolygonType as PolygonTypeEnum } from "./enums";
import { PriorityQueue, OrderedSet } from "./data-structures";
import { calculateSignedArea, findSegmentIntersection, isPointOnSegment } from "./geometry";
import { SweepEvent, SweepEventComparator, SegmentComparator } from "./sweep-line";
import { PointChain, Connector } from "./connector";

/**
 * Result of a boolean operation containing both the polygon and intersection points
 */
export interface BooleanOperationResult {
  polygon: Polygon;
  intersections: Point[];
}

/**
 * Martinez Boolean Operations Algorithm
 * Implements the Martinez-Rueda clipping algorithm for polygon boolean operations
 */
export class Martinez {
  // Private members
  private eventQueue: PriorityQueue<SweepEvent>; // Event Queue (priority queue)
  private eventStorage: SweepEvent[]; // Storage for all events generated during computation
  private subjectPolygon: Polygon; // First input polygon
  private clippingPolygon: Polygon; // Second input polygon
  private intersectionCount: number; // Number of intersections found
  private intersectionPoints: Point[]; // Collection of intersection points

  /**
   * Constructor
   * @param subjectPolygon First input polygon
   * @param clippingPolygon Second input polygon
   */
  constructor(subjectPolygon: Polygon, clippingPolygon: Polygon) {
    this.eventQueue = new PriorityQueue<SweepEvent>(SweepEventComparator.compare);
    this.eventStorage = [];
    this.subjectPolygon = subjectPolygon;
    this.clippingPolygon = clippingPolygon;
    this.intersectionCount = 0;
    this.intersectionPoints = [];
  }

  /**
   * Get the number of intersections found during computation (for statistics)
   * @returns Number of intersections
   */
  getIntersectionCount(): number {
    return this.intersectionCount;
  }

  /**
   * Compute the boolean operation between the two input polygons and return both result and intersections
   * @param operation The boolean operation type to perform
   * @returns Object containing the resulting polygon and intersection points
   */
  performBooleanCalculation(operation: number): BooleanOperationResult {
    const polygon = this.computeBooleanOperation(operation);
    return {
      polygon,
      intersections: [...this.intersectionPoints]
    };
  }

  /**
   * Compute the boolean operation between the two input polygons
   * @param operation The boolean operation type to perform
   * @returns The resulting polygon from the boolean operation
   */
  computeBooleanOperation(operation: number): Polygon {
    // Reset intersection tracking for new computation
    this.intersectionCount = 0;
    this.intersectionPoints = [];
    
    const resultPolygon = new Polygon();
    // Test 1 for trivial result case
    if (this.subjectPolygon.contourCount() * this.clippingPolygon.contourCount() === 0) {
      // At least one polygon is empty
      if (operation === BooleanOperationType.DIFFERENCE) {
        resultPolygon.addContours(this.subjectPolygon.getContours());
      }
      if (operation === BooleanOperationType.UNION) {
        const source = this.subjectPolygon.contourCount() === 0 ? this.clippingPolygon : this.subjectPolygon;
        resultPolygon.addContours(source.getContours());
      }
      return resultPolygon;
    }

    // Test 2 for trivial result case
    const minsubj: Point = { x: 0, y: 0 };
    const maxsubj: Point = { x: 0, y: 0 };
    const minclip: Point = { x: 0, y: 0 };
    const maxclip: Point = { x: 0, y: 0 };

    this.subjectPolygon.boundingbox(minsubj, maxsubj);
    this.clippingPolygon.boundingbox(minclip, maxclip);

    if (minsubj.x > maxclip.x || minclip.x > maxsubj.x || minsubj.y > maxclip.y || minclip.y > maxsubj.y) {
      // the bounding boxes do not overlap
      if (operation === BooleanOperationType.DIFFERENCE) {
        resultPolygon.addContours(this.subjectPolygon.getContours());
      }
      if (operation === BooleanOperationType.UNION) {
        resultPolygon.addContours(this.subjectPolygon.getContours());
        resultPolygon.addContours(this.clippingPolygon.getContours());
      }
      return resultPolygon;
    }

    // Boolean operation is not trivial

    // Insert all the endpoints associated to the line segments into the event queue
    for (let i = 0; i < this.subjectPolygon.contourCount(); i++) {
      for (let j = 0; j < this.subjectPolygon.contour(i).pointCount(); j++) {
        this.processSegment(this.subjectPolygon.contour(i).segment(j), PolygonTypeEnum.SUBJECT);
      }
    }

    for (let i = 0; i < this.clippingPolygon.contourCount(); i++) {
      for (let j = 0; j < this.clippingPolygon.contour(i).pointCount(); j++) {
        this.processSegment(this.clippingPolygon.contour(i).segment(j), PolygonTypeEnum.CLIPPING);
      }
    }

    const connector: Connector = new Connector(); // to connect the edge solutions
    const orderedSet = new OrderedSet<SweepEvent>(SegmentComparator.compare); // Status line
    const MINMAXX = Math.min(maxsubj.x, maxclip.x); // for optimization 1

    // No need to sort - PriorityQueue maintains order automatically

    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.pop()!; // Get highest priority element from priority queue

      // optimization 1
      if (
        (operation === BooleanOperationType.INTERSECTION && event.point.x > MINMAXX) ||
        (operation === BooleanOperationType.DIFFERENCE && event.point.x > maxsubj.x)
      ) {
        connector.toPolygon(resultPolygon);
        return resultPolygon;
      }
      if (operation === BooleanOperationType.UNION && event.point.x > MINMAXX) {
        // add all the non-processed line segments to the result
        if (!event.isLeftEndpoint) connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
        while (!this.eventQueue.isEmpty()) {
          const e2 = this.eventQueue.pop()!; // Use pop() to maintain priority order
          if (!e2.isLeftEndpoint) connector.addSegment(e2.segment(), e2.otherEvent!.isInsideOutsideTransition);
        }
        connector.toPolygon(resultPolygon);
        return resultPolygon;
      }
      // end of optimization 1

      if (event.isLeftEndpoint) {
        // the line segment must be inserted into S
        const index = orderedSet.insert(event);
        event.positionInSweepLine = index;

        // Update positions of all events after the inserted one
        for (let i = index + 1; i < orderedSet.size(); i++) {
          const event = orderedSet.at(i);
          if (event && event.positionInSweepLine !== null) {
            event.positionInSweepLine = i;
          }
        }

        // Find previous and next elements using the ordered set
        const prev = index > 0 ? orderedSet.at(index - 1) : null;
        const next = index < orderedSet.size() - 1 ? orderedSet.at(index + 1) : null;

        // Compute the inside and inOut flags
        if (prev === null || prev === undefined) {
          // there is not a previous line segment in S?
          event.isInsideOtherPolygon = event.isInsideOutsideTransition = false;
        } else if (prev.edgeType !== EdgeTypeEnum.NORMAL) {
          if (index <= 1) {
            // e overlaps with prev or is at the beginning
            event.isInsideOtherPolygon = true; // it is not relevant to set true or false
            event.isInsideOutsideTransition = false;
          } else {
            // the previous two line segments in S are overlapping line segments
            const prevPrev = orderedSet.at(index - 2);
            if (prevPrev && prev.polygonLabel === event.polygonLabel) {
              event.isInsideOutsideTransition = !prev.isInsideOutsideTransition;
              event.isInsideOtherPolygon = !prevPrev.isInsideOutsideTransition;
            } else if (prevPrev) {
              event.isInsideOutsideTransition = !prevPrev.isInsideOutsideTransition;
              event.isInsideOtherPolygon = !prev.isInsideOutsideTransition;
            }
          }
        } else if (event.polygonLabel === prev.polygonLabel) {
          // previous line segment in S belongs to the same polygon
          event.isInsideOtherPolygon = prev.isInsideOtherPolygon;
          event.isInsideOutsideTransition = !prev.isInsideOutsideTransition;
        } else {
          // previous line segment in S belongs to a different polygon
          event.isInsideOtherPolygon = !prev.isInsideOutsideTransition;
          event.isInsideOutsideTransition = prev.isInsideOtherPolygon;
        }

        // Process a possible intersection between "event" and its next neighbor in orderedSet
        if (next !== null && next !== undefined) {
          this.possibleIntersection(event, next);
        }

        // Process a possible intersection between "event" and its previous neighbor in orderedSet
        if (prev !== null && prev !== undefined) {
          this.possibleIntersection(prev, event);
        }
      } else {
        // the line segment must be removed from orderedSet
        const otherEvent = event.otherEvent!;
        const index = otherEvent.positionInSweepLine!; // Get the stored position
        const prev = index > 0 ? orderedSet.at(index - 1) : null;
        const next = index < orderedSet.size() - 1 ? orderedSet.at(index + 1) : null;

        // Check if the line segment belongs to the Boolean operation
        switch (event.edgeType) {
          case EdgeTypeEnum.NORMAL:
            switch (operation) {
              case BooleanOperationType.INTERSECTION:
                if (event.otherEvent!.isInsideOtherPolygon) connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
                break;
              case BooleanOperationType.UNION:
                if (!event.otherEvent!.isInsideOtherPolygon) connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
                break;
              case BooleanOperationType.DIFFERENCE:
                if (
                  (event.polygonLabel === PolygonTypeEnum.SUBJECT && !event.otherEvent!.isInsideOtherPolygon) ||
                  (event.polygonLabel === PolygonTypeEnum.CLIPPING && event.otherEvent!.isInsideOtherPolygon)
                )
                  connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
                break;
              case BooleanOperationType.XOR:
                connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
                break;
            }
            break;
          case EdgeTypeEnum.SAME_TRANSITION:
            if (operation === BooleanOperationType.INTERSECTION || operation === BooleanOperationType.UNION)
              connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
            break;
          case EdgeTypeEnum.DIFFERENT_TRANSITION:
            if (operation === BooleanOperationType.DIFFERENCE) connector.addSegment(event.segment(), event.otherEvent!.isInsideOutsideTransition);
            break;
        }

        // delete line segment associated to e from S and check for intersection between neighbors
        orderedSet.delete(otherEvent);

        // Update positions of all events after the deleted one
        for (let i = index; i < orderedSet.size(); i++) {
          const event = orderedSet.at(i);
          if (event && event.positionInSweepLine !== null) {
            event.positionInSweepLine = i;
          }
        }

        if (next !== null && prev !== null && next !== undefined && prev !== undefined) {
          this.possibleIntersection(prev, next);
        }
      }
    }
    connector.toPolygon(resultPolygon);
    return resultPolygon;
  }

  // Private methods
  private processSegment(s: Segment, pl: number): void {
    const begin = s.begin();
    const end = s.end();

    if (begin.x === end.x && begin.y === end.y) {
      // if the two edge endpoints are equal, discard
      return;
    }

    const e1 = this.storeSweepEvent(new SweepEvent(begin, true, pl, null));
    const e2 = this.storeSweepEvent(new SweepEvent(end, true, pl, e1));
    e1.otherEvent = e2;

    if (e1.point.x < e2.point.x) {
      e2.isLeftEndpoint = false;
    } else if (e1.point.x > e2.point.x) {
      e1.isLeftEndpoint = false;
    } else if (e1.point.y < e2.point.y) {
      // the line segment is vertical. The bottom endpoint is the left endpoint
      e2.isLeftEndpoint = false;
    } else {
      e1.isLeftEndpoint = false;
    }

    this.eventQueue.push(e1);
    this.eventQueue.push(e2);
  }

  private possibleIntersection(e1: SweepEvent, e2: SweepEvent): void {
    const ip1: Point = { x: 0, y: 0 };
    const ip2: Point = { x: 0, y: 0 };

    const nintersections = findSegmentIntersection(e1.segment(), e2.segment(), ip1, ip2);

    if (nintersections === 0) {
      return;
    }

    if (
      nintersections === 1 &&
      ((e1.point.x === e2.point.x && e1.point.y === e2.point.y) ||
        (e1.otherEvent!.point.x === e2.otherEvent!.point.x && e1.otherEvent!.point.y === e2.otherEvent!.point.y))
    ) {
      return; // the line segments intersect at an endpoint of both line segments
    }

    if (nintersections === 2 && e1.polygonLabel === e2.polygonLabel) {
      return; // the line segments overlap, but they belong to the same polygon
    }

    // The line segments associated to e1 and e2 intersect
    this.intersectionCount += nintersections;

    // Collect intersection points
    if (nintersections === 1) {
      this.intersectionPoints.push({ x: ip1.x, y: ip1.y });
    } else if (nintersections === 2) {
      this.intersectionPoints.push({ x: ip1.x, y: ip1.y });
      this.intersectionPoints.push({ x: ip2.x, y: ip2.y });
    }

    if (nintersections === 1) {
      if (
        (e1.point.x !== ip1.x || e1.point.y !== ip1.y) &&
        (e1.otherEvent!.point.x !== ip1.x || e1.otherEvent!.point.y !== ip1.y)
      ) {
        // if ip1 is not an endpoint of e1
        this.divideSegment(e1, ip1);
      }
      if (
        (e2.point.x !== ip1.x || e2.point.y !== ip1.y) &&
        (e2.otherEvent!.point.x !== ip1.x || e2.otherEvent!.point.y !== ip1.y)
      ) {
        // if ip1 is not an endpoint of e2
        this.divideSegment(e2, ip1);
      }
      return;
    }

    // The line segments overlap
    const sortedEvents: (SweepEvent | null)[] = [];

    if (e1.point.x === e2.point.x && e1.point.y === e2.point.y) {
      sortedEvents.push(null);
    } else if (SweepEventComparator.compare(e1, e2)) {
      sortedEvents.push(e2);
      sortedEvents.push(e1);
    } else {
      sortedEvents.push(e1);
      sortedEvents.push(e2);
    }

    if (e1.otherEvent!.point.x === e2.otherEvent!.point.x && e1.otherEvent!.point.y === e2.otherEvent!.point.y) {
      sortedEvents.push(null);
    } else if (SweepEventComparator.compare(e1.otherEvent!, e2.otherEvent!)) {
      sortedEvents.push(e2.otherEvent!);
      sortedEvents.push(e1.otherEvent!);
    } else {
      sortedEvents.push(e1.otherEvent!);
      sortedEvents.push(e2.otherEvent!);
    }

    if (sortedEvents.length === 2) {
      // are both line segments equal?
      e1.edgeType = e1.otherEvent!.edgeType = EdgeTypeEnum.NON_CONTRIBUTING;
      e2.edgeType = e2.otherEvent!.edgeType =
        e1.isInsideOutsideTransition === e2.isInsideOutsideTransition
          ? EdgeTypeEnum.SAME_TRANSITION
          : EdgeTypeEnum.DIFFERENT_TRANSITION;
      return;
    }

    if (sortedEvents.length === 3) {
      // the line segments share an endpoint
      sortedEvents[1]!.edgeType = sortedEvents[1]!.otherEvent!.edgeType = EdgeTypeEnum.NON_CONTRIBUTING;
      if (sortedEvents[0])
        // is the right endpoint the shared point?
        sortedEvents[0]!.otherEvent!.edgeType =
          e1.isInsideOutsideTransition === e2.isInsideOutsideTransition
            ? EdgeTypeEnum.SAME_TRANSITION
            : EdgeTypeEnum.DIFFERENT_TRANSITION;
      // the shared point is the left endpoint
      else
        sortedEvents[2]!.otherEvent!.edgeType =
          e1.isInsideOutsideTransition === e2.isInsideOutsideTransition
            ? EdgeTypeEnum.SAME_TRANSITION
            : EdgeTypeEnum.DIFFERENT_TRANSITION;
      this.divideSegment(sortedEvents[0] ? sortedEvents[0]! : sortedEvents[2]!.otherEvent!, sortedEvents[1]!.point);
      return;
    }

    if (sortedEvents[0] !== sortedEvents[3]!.otherEvent) {
      // no line segment includes totally the other one
      sortedEvents[1]!.edgeType = EdgeTypeEnum.NON_CONTRIBUTING;
      sortedEvents[2]!.edgeType =
        e1.isInsideOutsideTransition === e2.isInsideOutsideTransition
          ? EdgeTypeEnum.SAME_TRANSITION
          : EdgeTypeEnum.DIFFERENT_TRANSITION;
      this.divideSegment(sortedEvents[0]!, sortedEvents[1]!.point);
      this.divideSegment(sortedEvents[1]!, sortedEvents[2]!.point);
      return;
    }

    // one line segment includes the other one
    sortedEvents[1]!.edgeType = sortedEvents[1]!.otherEvent!.edgeType = EdgeTypeEnum.NON_CONTRIBUTING;
    this.divideSegment(sortedEvents[0]!, sortedEvents[1]!.point);
    sortedEvents[3]!.otherEvent!.edgeType =
      e1.isInsideOutsideTransition === e2.isInsideOutsideTransition
        ? EdgeTypeEnum.SAME_TRANSITION
        : EdgeTypeEnum.DIFFERENT_TRANSITION;
    this.divideSegment(sortedEvents[3]!.otherEvent!, sortedEvents[2]!.point);
  }

  private divideSegment(e: SweepEvent, p: Point): void {
    // "Right event" of the "left line segment" resulting from dividing e
    const r = this.storeSweepEvent(new SweepEvent(p, false, e.polygonLabel, e, e.edgeType));
    // "Left event" of the "right line segment" resulting from dividing e
    const l = this.storeSweepEvent(new SweepEvent(p, true, e.polygonLabel, e.otherEvent!, e.otherEvent!.edgeType));

    if (SweepEventComparator.compare(l, e.otherEvent!)) {
      // avoid a rounding error
      console.log("Oops");
      e.otherEvent!.isLeftEndpoint = true;
      l.isLeftEndpoint = false;
    }
    if (SweepEventComparator.compare(e, r)) {
      // avoid a rounding error
      console.log("Oops2");
    }

    e.otherEvent!.otherEvent = l;
    e.otherEvent = r;
    this.eventQueue.push(l);
    this.eventQueue.push(r);
  }

  private storeSweepEvent(e: SweepEvent): SweepEvent {
    this.eventStorage.push(e);
    return this.eventStorage[this.eventStorage.length - 1]!;
  }
}
