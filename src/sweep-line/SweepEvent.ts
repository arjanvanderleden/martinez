import type { Point } from '../types';
import { Segment } from '../types';
import { EdgeType } from '../enums';
import { GeometryUtils } from '../geometry';

/**
 * Represents a sweep event in the Martinez-Rueda clipping algorithm
 */
export class SweepEvent {
  point: Point; // point associated with the event
  isLeftEndpoint: boolean; // is the point the left endpoint of the segment (point, other->point)?
  polygonLabel: number; // Polygon to which the associated segment belongs to (PolygonType)
  otherEvent: SweepEvent | null; // Event associated to the other endpoint of the segment
  isInsideOutsideTransition: boolean; // Does the segment (point, other->point) represent an inside-outside transition?
  edgeType: number; // EdgeType
  isInsideOtherPolygon: boolean; // Only used in "left" events. Is the segment (point, other->point) inside the other polygon?
  positionInSweepLine: number | null; // Only used in "left" events. Position of the event in S

  constructor(
    point: Point, 
    isLeftEndpoint: boolean, 
    polygonLabel: number, 
    otherEvent: SweepEvent | null, 
    edgeType: number = EdgeType.NORMAL
  ) {
    this.point = point;
    this.isLeftEndpoint = isLeftEndpoint;
    this.polygonLabel = polygonLabel;
    this.otherEvent = otherEvent;
    this.edgeType = edgeType;
    this.positionInSweepLine = null;
    this.isInsideOutsideTransition = false;
    this.isInsideOtherPolygon = false;
  }

  /**
   * Return the line segment associated to the SweepEvent
   */
  getSegment(): Segment {
    return new Segment(this.point, this.otherEvent!.point);
  }

  /**
   * Check if the line segment (point, other->point) is below a given point
   */
  isSegmentBelowPoint(testPoint: Point): boolean {
    if (this.isLeftEndpoint) {
      return GeometryUtils.signedArea(this.point, this.otherEvent!.point, testPoint) > 0;
    } else {
      return GeometryUtils.signedArea(this.otherEvent!.point, this.point, testPoint) > 0;
    }
  }

  /**
   * Check if the line segment (point, other->point) is above a given point
   */
  isSegmentAbovePoint(testPoint: Point): boolean {
    return !this.isSegmentBelowPoint(testPoint);
  }

  // Backward compatibility aliases
  get p(): Point { return this.point; }
  set p(value: Point) { this.point = value; }
  
  get left(): boolean { return this.isLeftEndpoint; }
  set left(value: boolean) { this.isLeftEndpoint = value; }
  
  get pl(): number { return this.polygonLabel; }
  set pl(value: number) { this.polygonLabel = value; }
  
  get other(): SweepEvent | null { return this.otherEvent; }
  set other(value: SweepEvent | null) { this.otherEvent = value; }
  
  get inOut(): boolean { return this.isInsideOutsideTransition; }
  set inOut(value: boolean) { this.isInsideOutsideTransition = value; }
  
  get type(): number { return this.edgeType; }
  set type(value: number) { this.edgeType = value; }
  
  get inside(): boolean { return this.isInsideOtherPolygon; }
  set inside(value: boolean) { this.isInsideOtherPolygon = value; }
  
  get poss(): number | null { return this.positionInSweepLine; }
  set poss(value: number | null) { this.positionInSweepLine = value; }

  segment(): Segment { return this.getSegment(); }
  below(testPoint: Point): boolean { return this.isSegmentBelowPoint(testPoint); }
  above(testPoint: Point): boolean { return this.isSegmentAbovePoint(testPoint); }
}