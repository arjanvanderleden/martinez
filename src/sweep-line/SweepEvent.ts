import type { Point } from "../types";
import { Segment } from "../types";
import { EdgeType } from "../enums";
import { calculateSignedArea } from "../geometry";

/**
 * Represents a sweep event in the Martinez-Rueda clipping algorithm
 */
export class SweepEvent {
  private _point: Point; // point associated with the event
  private _isLeftEndpoint: boolean; // is the point the left endpoint of the segment (point, other->point)?
  private _polygonLabel: number; // Polygon to which the associated segment belongs to (PolygonType)
  private _otherEvent: SweepEvent | null; // Event associated to the other endpoint of the segment
  private _isInsideOutsideTransition: boolean; // Does the segment (point, other->point) represent an inside-outside transition?
  private _edgeType: number; // EdgeType
  private _isInsideOtherPolygon: boolean; // Only used in "left" events. Is the segment (point, other->point) inside the other polygon?
  private _positionInSweepLine: number | null; // Only used in "left" events. Position of the event in S

  constructor(
    point: Point,
    isLeftEndpoint: boolean,
    polygonLabel: number,
    otherEvent: SweepEvent | null,
    edgeType: number = EdgeType.NORMAL
  ) {
    this._point = point;
    this._isLeftEndpoint = isLeftEndpoint;
    this._polygonLabel = polygonLabel;
    this._otherEvent = otherEvent;
    this._edgeType = edgeType;
    this._positionInSweepLine = null;
    this._isInsideOutsideTransition = false;
    this._isInsideOtherPolygon = false;
  }

  /**
   * Return the line segment associated to the SweepEvent
   */
  getSegment(): Segment {
    return new Segment(this.point, this._otherEvent!.point);
  }

  /**
   * Check if the line segment (point, other->point) is below a given point
   */
  isSegmentBelowPoint(testPoint: Point): boolean {
    if (this._isLeftEndpoint) {
      return calculateSignedArea(this.point, this._otherEvent!.point, testPoint) > 0;
    } else {
      return calculateSignedArea(this._otherEvent!.point, this.point, testPoint) > 0;
    }
  }

  /**
   * Check if the line segment (point, other->point) is above a given point
   */
  isSegmentAbovePoint(testPoint: Point): boolean {
    return !this.isSegmentBelowPoint(testPoint);
  }

  // Backward compatibility aliases
  get point(): Point {
    return this._point;
  }
  set point(value: Point) {
    this._point = value;
  }

  get isLeftEndpoint(): boolean {
    return this._isLeftEndpoint;
  }
  set isLeftEndpoint(value: boolean) {
    this._isLeftEndpoint = value;
  }

  get polygonLabel(): number {
    return this._polygonLabel;
  }
  set polygonLabel(value: number) {
    this._polygonLabel = value;
  }

  get otherEvent(): SweepEvent | null {
    return this._otherEvent;
  }
  set otherEvent(value: SweepEvent | null) {
    this._otherEvent = value;
  }

  get isInsideOutsideTransition(): boolean {
    return this._isInsideOutsideTransition;
  }
  set isInsideOutsideTransition(value: boolean) {
    this._isInsideOutsideTransition = value;
  }

  get edgeType(): number {
    return this._edgeType;
  }
  set edgeType(value: number) {
    this._edgeType = value;
  }

  get isInsideOtherPolygon(): boolean {
    return this._isInsideOtherPolygon;
  }
  set isInsideOtherPolygon(value: boolean) {
    this._isInsideOtherPolygon = value;
  }

  get positionInSweepLine(): number | null {
    return this._positionInSweepLine;
  }
  set positionInSweepLine(value: number | null) {
    this._positionInSweepLine = value;
  }

  segment(): Segment {
    return this.getSegment();
  }
  below(testPoint: Point): boolean {
    return this.isSegmentBelowPoint(testPoint);
  }
  above(testPoint: Point): boolean {
    return this.isSegmentAbovePoint(testPoint);
  }
}
