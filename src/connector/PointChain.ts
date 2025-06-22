import type { Point, Segment } from '../types';

/**
 * Represents a chain of connected points forming part of a polygon contour
 * Direct translation of PointChain class from connector.h and connector.cpp
 */
export class PointChain {
  private pointList: Point[]; // Linked point chain (using Array instead of std::list)
  private isChainClosed: boolean; // is the chain closed?

  constructor() {
    this.pointList = [];
    this.isChainClosed = false;
  }

  /**
   * Initialize the chain with a segment
   */
  initializeWithSegment(segment: Segment): void {
    this.pointList.push(segment.begin());
    this.pointList.push(segment.end());
  }

  /**
   * Try to link a segment to this chain
   * @param segment Segment to link
   * @returns True if the segment was successfully linked
   */
  linkSegment(segment: Segment): boolean {
    const segmentBegin = segment.begin();
    const segmentEnd = segment.end();

    if (segmentBegin.x === this.pointList[0]!.x && segmentBegin.y === this.pointList[0]!.y) {
      // segment.begin() == pointList.front()
      if (segmentEnd.x === this.pointList[this.pointList.length - 1]!.x && segmentEnd.y === this.pointList[this.pointList.length - 1]!.y)
        // segment.end() == pointList.back()
        this.isChainClosed = true;
      else this.pointList.unshift(segmentEnd); // push_front
      return true;
    }

    if (segmentEnd.x === this.pointList[this.pointList.length - 1]!.x && segmentEnd.y === this.pointList[this.pointList.length - 1]!.y) {
      // segment.end() == pointList.back()
      if (segmentBegin.x === this.pointList[0]!.x && segmentBegin.y === this.pointList[0]!.y)
        // segment.begin() == pointList.front()
        this.isChainClosed = true;
      else this.pointList.push(segmentBegin); // push_back
      return true;
    }

    if (segmentEnd.x === this.pointList[0]!.x && segmentEnd.y === this.pointList[0]!.y) {
      // segment.end() == pointList.front()
      if (segmentBegin.x === this.pointList[this.pointList.length - 1]!.x && segmentBegin.y === this.pointList[this.pointList.length - 1]!.y)
        // segment.begin() == pointList.back()
        this.isChainClosed = true;
      else this.pointList.unshift(segmentBegin); // push_front
      return true;
    }

    if (segmentBegin.x === this.pointList[this.pointList.length - 1]!.x && segmentBegin.y === this.pointList[this.pointList.length - 1]!.y) {
      // segment.begin() == pointList.back()
      if (segmentEnd.x === this.pointList[0]!.x && segmentEnd.y === this.pointList[0]!.y)
        // segment.end() == pointList.front()
        this.isChainClosed = true;
      else this.pointList.push(segmentEnd); // push_back
      return true;
    }

    return false;
  }

  /**
   * Try to link another point chain to this chain
   * @param chain Point chain to link
   * @returns True if the chain was successfully linked
   */
  linkPointChain(chain: PointChain): boolean {
    if (
      chain.pointList[0]!.x === this.pointList[this.pointList.length - 1]!.x &&
      chain.pointList[0]!.y === this.pointList[this.pointList.length - 1]!.y
    ) {
      // chain.pointList.front() == pointList.back()
      chain.pointList.shift(); // pop_front
      this.pointList.splice(this.pointList.length, 0, ...chain.pointList); // splice at end
      return true;
    }

    if (
      chain.pointList[chain.pointList.length - 1]!.x === this.pointList[0]!.x &&
      chain.pointList[chain.pointList.length - 1]!.y === this.pointList[0]!.y
    ) {
      // chain.pointList.back() == pointList.front()
      this.pointList.shift(); // pop_front
      this.pointList.splice(0, 0, ...chain.pointList); // splice at begin
      return true;
    }

    if (chain.pointList[0]!.x === this.pointList[0]!.x && chain.pointList[0]!.y === this.pointList[0]!.y) {
      // chain.pointList.front() == pointList.front()
      this.pointList.shift(); // pop_front
      chain.pointList.reverse(); // reverse
      this.pointList.splice(0, 0, ...chain.pointList); // splice at begin
      return true;
    }

    if (
      chain.pointList[chain.pointList.length - 1]!.x === this.pointList[this.pointList.length - 1]!.x &&
      chain.pointList[chain.pointList.length - 1]!.y === this.pointList[this.pointList.length - 1]!.y
    ) {
      // chain.pointList.back() == pointList.back()
      this.pointList.pop(); // pop_back
      chain.pointList.reverse(); // reverse
      this.pointList.splice(this.pointList.length, 0, ...chain.pointList); // splice at end
      return true;
    }

    return false;
  }

  /**
   * Check if the chain is closed
   */
  isClosed(): boolean {
    return this.isChainClosed;
  }

  /**
   * Get the points in the chain
   */
  getPoints(): Point[] {
    return this.pointList;
  }

  /**
   * Clear the chain
   */
  clearChain(): void {
    this.pointList = [];
  }

  /**
   * Get the number of points in the chain
   */
  getSize(): number {
    return this.pointList.length;
  }

  // Backward compatibility aliases
  init = this.initializeWithSegment;
  closed = this.isClosed;
  begin = this.getPoints;
  end = this.getPoints;
  clear = this.clearChain;
  size = this.getSize;
  get list() { return this.pointList; }
  get _closed() { return this.isChainClosed; }
  set _closed(value: boolean) { this.isChainClosed = value; }
}