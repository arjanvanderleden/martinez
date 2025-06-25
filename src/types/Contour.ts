import { Segment } from './Segment';
import type { Point } from './Point';

/**
 * Represents a contour (closed polygon boundary) with multiple vertices
 */
export class Contour {
  private points: Point[] = [];
  private holeOf: number | null = null; // Index of parent contour if this is a hole
  private holeIds: number[] = []; // Indices of child holes
  private depth: number = 0; // Nesting depth for validation

  constructor(points: Point[] = []) {
    this.points = [...points];
  }

  pointCount(): number {
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

  /**
   * Set this contour as a hole of another contour
   */
  setParentIndex(parentIndex: number): void {
    this.holeOf = parentIndex;
  }

  /**
   * Get the parent contour index if this is a hole
   */
  getParentHoleIndex(): number | null {
    return this.holeOf;
  }

  /**
   * Add a hole to this contour
   */
  addHole(holeIndex: number): void {
    this.holeIds.push(holeIndex);
  }

  /**
   * Get all hole indices for this contour
   */
  getChildHoleIndices(): number[] {
    return [...this.holeIds];
  }

  /**
   * Set the nesting depth
   */
  setDepth(depth: number): void {
    this.depth = depth;
  }

  /**
   * Get the nesting depth
   */
  getDepth(): number {
    return this.depth;
  }

  /**
   * Check if this contour is a hole
   */
  isHole(): boolean {
    return this.holeOf !== null;
  }
}