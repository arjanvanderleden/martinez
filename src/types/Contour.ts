import { Segment } from './Segment';
import type { Point } from './Point';

/**
 * Represents a contour (closed polygon boundary) with multiple vertices
 */
export class Contour {
  private points: Point[] = [];

  constructor(points: Point[] = []) {
    this.points = [...points];
  }

  nvertices(): number {
    return this.points.length;
  }

  segment(i: number): Segment {
    const p1 = this.points[i]!;
    const p2 = this.points[(i + 1) % this.points.length]!;
    return new Segment(p1, p2);
  }

  addPoint(point: Point): void {
    this.points.push(point);
  }

  getPoints(): Point[] {
    return [...this.points];
  }

  setPoints(points: Point[]): void {
    this.points = [...points];
  }
}