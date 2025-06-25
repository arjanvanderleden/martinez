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
  private prevInResult: number | null; // Index of most recent contour in result for spatial context

  constructor() {
    this.openPolygonChains = [];
    this.closedPolygonChains = [];
    this.prevInResult = null;
  }

  /**
   * Add a segment to the connector, linking it to existing chains or creating a new one
   * @param segment Segment to add
   * @param resultTransition Optional transition information for hierarchy classification
   */
  addSegment(segment: Segment, resultTransition?: boolean): void {
    let chainIndex = 0;
    while (chainIndex < this.openPolygonChains.length) {
      if (this.openPolygonChains[chainIndex]!.linkSegment(segment)) {
        if (this.openPolygonChains[chainIndex]!.isClosed()) {
          // Move from openPolygonChains to closedPolygonChains (equivalent to splice operation)
          const closedChain = this.openPolygonChains.splice(chainIndex, 1)[0]!;
          // Set spatial context for hierarchy classification
          if (resultTransition !== undefined) {
            closedChain.setSpatialContext(this.prevInResult, resultTransition);
          }
          this.closedPolygonChains.push(closedChain);
          // Update prevInResult to point to this newly closed contour
          this.prevInResult = this.closedPolygonChains.length - 1;
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
   * Convert the closed chains to a polygon with hierarchy classification
   * @param targetPolygon Polygon to populate with the chains
   */
  toPolygon(targetPolygon: Polygon): void {
    // First pass: create all contours
    for (const chain of this.closedPolygonChains) {
      const contour = targetPolygon.pushbackContour();
      for (const point of chain.getPoints()) {
        contour.addPoint(point);
      }
    }

    // Second pass: establish hierarchy relationships based on spatial context
    for (let i = 0; i < this.closedPolygonChains.length; i++) {
      const chain = this.closedPolygonChains[i]!;
      const contour = targetPolygon.contour(i);
      const spatialContext = chain.getSpatialContext();

      if (spatialContext.prevInResult !== null) {
        this.classifyContourHierarchy(i, spatialContext, targetPolygon);
      }
    }
  }

  /**
   * Classify contour hierarchy based on spatial context
   */
  private classifyContourHierarchy(
    contourIndex: number,
    spatialContext: { prevInResult: number | null; resultTransition: boolean },
    targetPolygon: Polygon
  ): void {
    const { prevInResult, resultTransition } = spatialContext;

    if (prevInResult === null) {
      // No spatial context - treat as exterior contour
      return;
    }

    const currentContour = targetPolygon.contour(contourIndex);
    const prevContour = targetPolygon.contour(prevInResult);

    // Apply hierarchy rules based on transition direction and spatial context
    if (resultTransition) {
      // Positive transition = entering a contour (moving from outside to inside)
      // This means we're starting inside another contour, so this is a hole
      if (prevContour.isHole()) {
        // If the lower contour is a hole, connect to the same parent
        const parentIndex = prevContour.getParentHoleIndex();
        if (parentIndex !== null) {
          currentContour.setParentIndex(parentIndex);
          targetPolygon.contour(parentIndex).addHole(contourIndex);
          currentContour.setDepth(prevContour.getDepth());
        }
      } else {
        // The lower contour is exterior - this hole becomes its child
        currentContour.setParentIndex(prevInResult);
        prevContour.addHole(contourIndex);
        currentContour.setDepth(prevContour.getDepth() + 1);
      }
    } else {
      // Negative transition = exiting a contour (moving from inside to outside)
      // This means we're starting outside, so this is an exterior contour
      currentContour.setDepth(prevContour.getDepth());
    }
  }

}