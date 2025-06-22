import type { Segment } from '../types';
import { Polygon } from '../types';
import { PointChain } from './PointChain';

/**
 * Connects segments to form complete polygon contours
 * Direct translation of Connector class from connector.h and connector.cpp
 */
export class Connector {
  private openPolygonChains: PointChain[];
  private closedPolygonChains: PointChain[];

  constructor() {
    this.openPolygonChains = [];
    this.closedPolygonChains = [];
  }

  /**
   * Add a segment to the connector, linking it to existing chains or creating a new one
   * @param segment Segment to add
   */
  addSegment(segment: Segment): void {
    let chainIndex = 0;
    while (chainIndex < this.openPolygonChains.length) {
      if (this.openPolygonChains[chainIndex]!.linkSegment(segment)) {
        if (this.openPolygonChains[chainIndex]!.isClosed()) {
          // Move from openPolygonChains to closedPolygonChains (equivalent to splice operation)
          const closedChain = this.openPolygonChains.splice(chainIndex, 1)[0]!;
          this.closedPolygonChains.push(closedChain);
        } else {
          // Try to link with other open polygons
          let otherChainIndex = chainIndex + 1;
          while (otherChainIndex < this.openPolygonChains.length) {
            if (this.openPolygonChains[chainIndex]!.linkPointChain(this.openPolygonChains[otherChainIndex]!)) {
              this.openPolygonChains.splice(otherChainIndex, 1); // erase
              break;
            }
            otherChainIndex++;
          }
        }
        return;
      }
      chainIndex++;
    }

    // The segment cannot be connected with any open polygon
    const newChain = new PointChain();
    newChain.initializeWithSegment(segment);
    this.openPolygonChains.push(newChain);
  }

  /**
   * Get the closed polygon chains
   */
  getClosedChains(): PointChain[] {
    return this.closedPolygonChains;
  }

  /**
   * Clear all chains
   */
  clearAll(): void {
    this.closedPolygonChains = [];
    this.openPolygonChains = [];
  }

  /**
   * Get the number of closed chains
   */
  getClosedChainCount(): number {
    return this.closedPolygonChains.length;
  }

  /**
   * Convert the closed chains to a polygon
   * @param targetPolygon Polygon to populate with the chains
   */
  toPolygon(targetPolygon: Polygon): void {
    for (const chain of this.closedPolygonChains) {
      const contour = targetPolygon.pushbackContour();
      for (const point of chain.getPoints()) {
        contour.addPoint(point);
      }
    }
  }

  // Backward compatibility aliases
  add = this.addSegment;
  begin = this.getClosedChains;
  end = this.getClosedChains;
  clear = this.clearAll;
  size = this.getClosedChainCount;
}