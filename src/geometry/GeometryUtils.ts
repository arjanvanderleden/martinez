import type { Point, Segment } from '../types';

/**
 * Utility functions for geometric calculations
 */
export class GeometryUtils {
  /**
   * Calculate the signed area of a triangle formed by three points
   * @param firstPoint First point of the triangle
   * @param secondPoint Second point of the triangle
   * @param thirdPoint Third point of the triangle
   * @returns Signed area (positive for counter-clockwise, negative for clockwise)
   */
  static calculateSignedArea(firstPoint: Point, secondPoint: Point, thirdPoint: Point): number {
    return (firstPoint.x - thirdPoint.x) * (secondPoint.y - thirdPoint.y) - (secondPoint.x - thirdPoint.x) * (firstPoint.y - thirdPoint.y);
  }

  /**
   * Find intersection between two line segments
   * @param segment1 First line segment
   * @param segment2 Second line segment
   * @param intersectionPoint1 Output: first intersection point
   * @param intersectionPoint2 Output: second intersection point (for overlapping segments)
   * @returns Number of intersections (0, 1, or 2)
   */
  static findSegmentIntersection(segment1: Segment, segment2: Segment, intersectionPoint1: Point, intersectionPoint2: Point): number {
    const p0 = segment1.begin();
    const p1 = segment1.end();
    const p2 = segment2.begin();
    const p3 = segment2.end();

    // Direction vectors
    const d0x = p1.x - p0.x;
    const d0y = p1.y - p0.y;
    const d1x = p3.x - p2.x;
    const d1y = p3.y - p2.y;
    
    // Vector from p0 to p2
    const Ex = p2.x - p0.x;
    const Ey = p2.y - p0.y;
    
    // Cross product of direction vectors
    const kross = d0x * d1y - d0y * d1x;
    const sqrEpsilon = 0.0000001;
    const sqrLen0 = d0x * d0x + d0y * d0y;
    const sqrLen1 = d1x * d1x + d1y * d1y;

    if (kross * kross > sqrEpsilon * sqrLen0 * sqrLen1) {
      // Lines are not parallel - check for intersection
      const s = (Ex * d1y - Ey * d1x) / kross;
      if (s < 0 || s > 1) {
        return 0; // No intersection within segment1
      }
      
      const t = (Ex * d0y - Ey * d0x) / kross;
      if (t < 0 || t > 1) {
        return 0; // No intersection within segment2
      }
      
      // Intersection point
      intersectionPoint1.x = p0.x + s * d0x;
      intersectionPoint1.y = p0.y + s * d0y;
      
      // Snap to exact endpoints if very close (for numerical stability)
      const snapDistance = 0.00000001;
      if (Math.abs(intersectionPoint1.x - p0.x) < snapDistance && Math.abs(intersectionPoint1.y - p0.y) < snapDistance) {
        intersectionPoint1.x = p0.x;
        intersectionPoint1.y = p0.y;
      } else if (Math.abs(intersectionPoint1.x - p1.x) < snapDistance && Math.abs(intersectionPoint1.y - p1.y) < snapDistance) {
        intersectionPoint1.x = p1.x;
        intersectionPoint1.y = p1.y;
      } else if (Math.abs(intersectionPoint1.x - p2.x) < snapDistance && Math.abs(intersectionPoint1.y - p2.y) < snapDistance) {
        intersectionPoint1.x = p2.x;
        intersectionPoint1.y = p2.y;
      } else if (Math.abs(intersectionPoint1.x - p3.x) < snapDistance && Math.abs(intersectionPoint1.y - p3.y) < snapDistance) {
        intersectionPoint1.x = p3.x;
        intersectionPoint1.y = p3.y;
      }
      
      return 1;
    }

    // Lines are parallel or collinear
    const sqrLenE = Ex * Ex + Ey * Ey;
    const krossE = Ex * d0y - Ey * d0x;
    const sqrKrossE = krossE * krossE;
    
    if (sqrKrossE > sqrEpsilon * sqrLen0 * sqrLenE) {
      // Lines are parallel but different - no intersection
      return 0;
    }

    // Lines are collinear - check for segment overlap
    const s0 = (d0x * Ex + d0y * Ey) / sqrLen0;
    const s1 = s0 + (d0x * d1x + d0y * d1y) / sqrLen0;
    const smin = Math.min(s0, s1);
    const smax = Math.max(s0, s1);
    
    // Find intersection of [0,1] with [smin, smax]
    const wmin = Math.max(0.0, smin);
    const wmax = Math.min(1.0, smax);
    
    if (wmin > wmax) {
      return 0; // No overlap
    }
    
    if (wmin === wmax) {
      // Single point overlap
      intersectionPoint1.x = p0.x + wmin * d0x;
      intersectionPoint1.y = p0.y + wmin * d0y;
      return 1;
    } else {
      // Segment overlap
      intersectionPoint1.x = p0.x + wmin * d0x;
      intersectionPoint1.y = p0.y + wmin * d0y;
      intersectionPoint2.x = p0.x + wmax * d0x;
      intersectionPoint2.y = p0.y + wmax * d0y;
      return 2;
    }
  }

  /**
   * Check if a point lies on a line segment
   * @param segmentStart Start point of the segment
   * @param segmentEnd End point of the segment
   * @param testPoint Point to test
   * @returns True if the point lies on the segment
   */
  static isPointOnSegment(segmentStart: Point, segmentEnd: Point, testPoint: Point): boolean {
    return (
      testPoint.x <= Math.max(segmentStart.x, segmentEnd.x) && 
      testPoint.x >= Math.min(segmentStart.x, segmentEnd.x) && 
      testPoint.y <= Math.max(segmentStart.y, segmentEnd.y) && 
      testPoint.y >= Math.min(segmentStart.y, segmentEnd.y)
    );
  }

  // Backward compatibility aliases
  static signedArea = GeometryUtils.calculateSignedArea;
  static findIntersection = GeometryUtils.findSegmentIntersection;
  static onSegment = GeometryUtils.isPointOnSegment;
}