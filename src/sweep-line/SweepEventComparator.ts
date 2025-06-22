import type { SweepEvent } from './SweepEvent';

/**
 * Comparator for SweepEvent ordering in the event queue
 */
export class SweepEventComparator {
  /**
   * Compare two sweep events for priority queue ordering
   * @param firstEvent First sweep event
   * @param secondEvent Second sweep event
   * @returns True if firstEvent has higher priority than secondEvent
   */
  static compare(firstEvent: SweepEvent, secondEvent: SweepEvent): boolean {
    if (firstEvent.point.x > secondEvent.point.x) {
      // Different x-coordinate
      return true;
    }
    if (secondEvent.point.x > firstEvent.point.x) {
      // Different x-coordinate
      return false;
    }
    if (firstEvent.point.x !== secondEvent.point.x || firstEvent.point.y !== secondEvent.point.y) {
      // Different points, but same x-coordinate
      return firstEvent.point.y > secondEvent.point.y;
    }
    if (firstEvent.isLeftEndpoint !== secondEvent.isLeftEndpoint) {
      // Same point, but one is left endpoint and other is right endpoint
      return firstEvent.isLeftEndpoint;
    }
    // Same point, both events are left endpoints or both are right endpoints
    return firstEvent.isSegmentAbovePoint(secondEvent.otherEvent!.point);
  }
}