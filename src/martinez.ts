/**
 * Direct TypeScript translation of the Martinez C++ implementation
 * Based on martinez.h and martinez.cpp from the example folder
 */

// Import types
import type { Point } from "./types";
import { Segment, Contour, Polygon } from "./types";
import { BooleanOperationType, EdgeType as EdgeTypeEnum, PolygonType as PolygonTypeEnum } from "./enums";
import { PriorityQueue, OrderedSet } from "./data-structures";
import { GeometryUtils } from "./geometry";
import { SweepEvent, SweepEventComparator, SegmentComparator } from "./sweep-line";
import { PointChain, Connector } from "./connector";

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
  }

  /**
   * Get the number of intersections found during computation (for statistics)
   * @returns Number of intersections
   */
  getIntersectionCount(): number {
    return this.intersectionCount;
  }

  /**
   * Compute the boolean operation between the two input polygons
   * @param operation The boolean operation type to perform
   * @returns The resulting polygon from the boolean operation
   */
  computeBooleanOperation(operation: number): Polygon {
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
      for (let j = 0; j < this.subjectPolygon.contour(i).nvertices(); j++) {
        this.processSegment(this.subjectPolygon.contour(i).segment(j), PolygonTypeEnum.SUBJECT);
      }
    }

    for (let i = 0; i < this.clippingPolygon.contourCount(); i++) {
      for (let j = 0; j < this.clippingPolygon.contour(i).nvertices(); j++) {
        this.processSegment(this.clippingPolygon.contour(i).segment(j), PolygonTypeEnum.CLIPPING);
      }
    }

    const connector: Connector = new Connector(); // to connect the edge solutions
    const S = new OrderedSet<SweepEvent>(SegmentComparator.compare); // Status line
    const MINMAXX = Math.min(maxsubj.x, maxclip.x); // for optimization 1

    // No need to sort - PriorityQueue maintains order automatically

    while (!this.eventQueue.isEmpty()) {
      const e = this.eventQueue.pop()!; // Get highest priority element from priority queue

      // optimization 1
      if (
        (operation === BooleanOperationType.INTERSECTION && e.p.x > MINMAXX) ||
        (operation === BooleanOperationType.DIFFERENCE && e.p.x > maxsubj.x)
      ) {
        connector.toPolygon(resultPolygon);
        return resultPolygon;
      }
      if (operation === BooleanOperationType.UNION && e.p.x > MINMAXX) {
        // add all the non-processed line segments to the result
        if (!e.left) connector.add(e.segment());
        while (!this.eventQueue.isEmpty()) {
          const e2 = this.eventQueue.pop()!; // Use pop() to maintain priority order
          if (!e2.left) connector.add(e2.segment());
        }
        connector.toPolygon(resultPolygon);
        return resultPolygon;
      }
      // end of optimization 1

      if (e.left) {
        // the line segment must be inserted into S
        const index = S.insert(e);
        e.poss = index;

        // Update positions of all events after the inserted one
        for (let i = index + 1; i < S.size(); i++) {
          const event = S.at(i);
          if (event && event.poss !== null) {
            event.poss = i;
          }
        }

        // Find previous and next elements using the ordered set
        const prev = index > 0 ? S.at(index - 1) : null;
        const next = index < S.size() - 1 ? S.at(index + 1) : null;

        // Compute the inside and inOut flags
        if (prev === null || prev === undefined) {
          // there is not a previous line segment in S?
          e.inside = e.inOut = false;
        } else if (prev.type !== EdgeTypeEnum.NORMAL) {
          if (index <= 1) {
            // e overlaps with prev or is at the beginning
            e.inside = true; // it is not relevant to set true or false
            e.inOut = false;
          } else {
            // the previous two line segments in S are overlapping line segments
            const prevPrev = S.at(index - 2);
            if (prevPrev && prev.pl === e.pl) {
              e.inOut = !prev.inOut;
              e.inside = !prevPrev.inOut;
            } else if (prevPrev) {
              e.inOut = !prevPrev.inOut;
              e.inside = !prev.inOut;
            }
          }
        } else if (e.pl === prev.pl) {
          // previous line segment in S belongs to the same polygon
          e.inside = prev.inside;
          e.inOut = !prev.inOut;
        } else {
          // previous line segment in S belongs to a different polygon
          e.inside = !prev.inOut;
          e.inOut = prev.inside;
        }

        // Process a possible intersection between "e" and its next neighbor in S
        if (next !== null && next !== undefined) {
          this.possibleIntersection(e, next);
        }

        // Process a possible intersection between "e" and its previous neighbor in S
        if (prev !== null && prev !== undefined) {
          this.possibleIntersection(prev, e);
        }
      } else {
        // the line segment must be removed from S
        const otherEvent = e.other!;
        const index = otherEvent.poss!; // Get the stored position
        const prev = index > 0 ? S.at(index - 1) : null;
        const next = index < S.size() - 1 ? S.at(index + 1) : null;

        // Check if the line segment belongs to the Boolean operation
        switch (e.type) {
          case EdgeTypeEnum.NORMAL:
            switch (operation) {
              case BooleanOperationType.INTERSECTION:
                if (e.other!.inside) connector.add(e.segment());
                break;
              case BooleanOperationType.UNION:
                if (!e.other!.inside) connector.add(e.segment());
                break;
              case BooleanOperationType.DIFFERENCE:
                if (
                  (e.pl === PolygonTypeEnum.SUBJECT && !e.other!.inside) ||
                  (e.pl === PolygonTypeEnum.CLIPPING && e.other!.inside)
                )
                  connector.add(e.segment());
                break;
              case BooleanOperationType.XOR:
                connector.add(e.segment());
                break;
            }
            break;
          case EdgeTypeEnum.SAME_TRANSITION:
            if (operation === BooleanOperationType.INTERSECTION || operation === BooleanOperationType.UNION)
              connector.add(e.segment());
            break;
          case EdgeTypeEnum.DIFFERENT_TRANSITION:
            if (operation === BooleanOperationType.DIFFERENCE) connector.add(e.segment());
            break;
        }

        // delete line segment associated to e from S and check for intersection between neighbors
        S.delete(otherEvent);

        // Update positions of all events after the deleted one
        for (let i = index; i < S.size(); i++) {
          const event = S.at(i);
          if (event && event.poss !== null) {
            event.poss = i;
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
    e1.other = e2;

    if (e1.p.x < e2.p.x) {
      e2.left = false;
    } else if (e1.p.x > e2.p.x) {
      e1.left = false;
    } else if (e1.p.y < e2.p.y) {
      // the line segment is vertical. The bottom endpoint is the left endpoint
      e2.left = false;
    } else {
      e1.left = false;
    }

    this.eventQueue.push(e1);
    this.eventQueue.push(e2);
  }

  private possibleIntersection(e1: SweepEvent, e2: SweepEvent): void {
    const ip1: Point = { x: 0, y: 0 };
    const ip2: Point = { x: 0, y: 0 };

    const nintersections = GeometryUtils.findIntersection(e1.segment(), e2.segment(), ip1, ip2);

    if (nintersections === 0) {
      return;
    }

    if (
      nintersections === 1 &&
      ((e1.p.x === e2.p.x && e1.p.y === e2.p.y) || (e1.other!.p.x === e2.other!.p.x && e1.other!.p.y === e2.other!.p.y))
    ) {
      return; // the line segments intersect at an endpoint of both line segments
    }

    if (nintersections === 2 && e1.pl === e2.pl) {
      return; // the line segments overlap, but they belong to the same polygon
    }

    // The line segments associated to e1 and e2 intersect
    this.intersectionCount += nintersections;

    if (nintersections === 1) {
      if ((e1.p.x !== ip1.x || e1.p.y !== ip1.y) && (e1.other!.p.x !== ip1.x || e1.other!.p.y !== ip1.y)) {
        // if ip1 is not an endpoint of e1
        this.divideSegment(e1, ip1);
      }
      if ((e2.p.x !== ip1.x || e2.p.y !== ip1.y) && (e2.other!.p.x !== ip1.x || e2.other!.p.y !== ip1.y)) {
        // if ip1 is not an endpoint of e2
        this.divideSegment(e2, ip1);
      }
      return;
    }

    // The line segments overlap
    const sortedEvents: (SweepEvent | null)[] = [];

    if (e1.p.x === e2.p.x && e1.p.y === e2.p.y) {
      sortedEvents.push(null);
    } else if (SweepEventComparator.compare(e1, e2)) {
      sortedEvents.push(e2);
      sortedEvents.push(e1);
    } else {
      sortedEvents.push(e1);
      sortedEvents.push(e2);
    }

    if (e1.other!.p.x === e2.other!.p.x && e1.other!.p.y === e2.other!.p.y) {
      sortedEvents.push(null);
    } else if (SweepEventComparator.compare(e1.other!, e2.other!)) {
      sortedEvents.push(e2.other!);
      sortedEvents.push(e1.other!);
    } else {
      sortedEvents.push(e1.other!);
      sortedEvents.push(e2.other!);
    }

    if (sortedEvents.length === 2) {
      // are both line segments equal?
      e1.type = e1.other!.type = EdgeTypeEnum.NON_CONTRIBUTING;
      e2.type = e2.other!.type =
        e1.inOut === e2.inOut ? EdgeTypeEnum.SAME_TRANSITION : EdgeTypeEnum.DIFFERENT_TRANSITION;
      return;
    }

    if (sortedEvents.length === 3) {
      // the line segments share an endpoint
      sortedEvents[1]!.type = sortedEvents[1]!.other!.type = EdgeTypeEnum.NON_CONTRIBUTING;
      if (sortedEvents[0])
        // is the right endpoint the shared point?
        sortedEvents[0]!.other!.type =
          e1.inOut === e2.inOut ? EdgeTypeEnum.SAME_TRANSITION : EdgeTypeEnum.DIFFERENT_TRANSITION;
      // the shared point is the left endpoint
      else
        sortedEvents[2]!.other!.type =
          e1.inOut === e2.inOut ? EdgeTypeEnum.SAME_TRANSITION : EdgeTypeEnum.DIFFERENT_TRANSITION;
      this.divideSegment(sortedEvents[0] ? sortedEvents[0]! : sortedEvents[2]!.other!, sortedEvents[1]!.p);
      return;
    }

    if (sortedEvents[0] !== sortedEvents[3]!.other) {
      // no line segment includes totally the other one
      sortedEvents[1]!.type = EdgeTypeEnum.NON_CONTRIBUTING;
      sortedEvents[2]!.type = e1.inOut === e2.inOut ? EdgeTypeEnum.SAME_TRANSITION : EdgeTypeEnum.DIFFERENT_TRANSITION;
      this.divideSegment(sortedEvents[0]!, sortedEvents[1]!.p);
      this.divideSegment(sortedEvents[1]!, sortedEvents[2]!.p);
      return;
    }

    // one line segment includes the other one
    sortedEvents[1]!.type = sortedEvents[1]!.other!.type = EdgeTypeEnum.NON_CONTRIBUTING;
    this.divideSegment(sortedEvents[0]!, sortedEvents[1]!.p);
    sortedEvents[3]!.other!.type =
      e1.inOut === e2.inOut ? EdgeTypeEnum.SAME_TRANSITION : EdgeTypeEnum.DIFFERENT_TRANSITION;
    this.divideSegment(sortedEvents[3]!.other!, sortedEvents[2]!.p);
  }

  private divideSegment(e: SweepEvent, p: Point): void {
    // "Right event" of the "left line segment" resulting from dividing e
    const r = this.storeSweepEvent(new SweepEvent(p, false, e.pl, e, e.type));
    // "Left event" of the "right line segment" resulting from dividing e
    const l = this.storeSweepEvent(new SweepEvent(p, true, e.pl, e.other!, e.other!.type));

    if (SweepEventComparator.compare(l, e.other!)) {
      // avoid a rounding error
      console.log("Oops");
      e.other!.left = true;
      l.left = false;
    }
    if (SweepEventComparator.compare(e, r)) {
      // avoid a rounding error
      console.log("Oops2");
    }

    e.other!.other = l;
    e.other = r;
    this.eventQueue.push(l);
    this.eventQueue.push(r);
  }

  private storeSweepEvent(e: SweepEvent): SweepEvent {
    this.eventStorage.push(e);
    return this.eventStorage[this.eventStorage.length - 1]!;
  }
}
