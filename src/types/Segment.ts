import type { Point } from './Point';

/**
 * Represents a line segment with begin and end points
 */
export class Segment {
  constructor(private beginPoint: Point, private endPoint: Point) {}

  begin(): Point {
    return this.beginPoint;
  }

  end(): Point {
    return this.endPoint;
  }
}