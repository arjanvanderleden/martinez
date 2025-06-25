import type { Point } from "./Point";
import { Contour } from "./Contour";

/**
 * Represents a polygon with multiple contours and bounding box calculations
 */
export class Polygon {
  private contours: Contour[] = [];

  constructor(contours: Contour[] = []) {
    this.contours = [...contours];
  }

  contourCount(): number {
    return this.contours.length;
  }

  contour(index: number): Contour {
    return this.contours[index]!;
  }

  boundingbox(min: Point, max: Point): void {
    if (this.contours.length === 0) return;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const contour of this.contours) {
      for (let i = 0; i < contour.pointCount(); i++) {
        const seg = contour.segment(i);
        const p1 = seg.begin();
        const p2 = seg.end();

        minX = Math.min(minX, p1.x, p2.x);
        minY = Math.min(minY, p1.y, p2.y);
        maxX = Math.max(maxX, p1.x, p2.x);
        maxY = Math.max(maxY, p1.y, p2.y);
      }
    }

    min.x = minX;
    min.y = minY;
    max.x = maxX;
    max.y = maxY;
  }

  pushbackContour(): Contour {
    const contour = new Contour();
    this.contours.push(contour);
    return contour;
  }

  addContour(points: Point[]): void {
    const contour = new Contour(points);
    this.contours.push(contour);
  }

  addContours(contours: Contour[]) {
      this.contours.push(...structuredClone(contours));
    };

  getContours(): Contour[] {
    return this.contours;
  }
}
