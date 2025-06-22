import type { SweepEvent } from './SweepEvent';
import { SweepEventComparator } from './SweepEventComparator';
import { calculateSignedArea } from '../geometry';

/**
 * Comparator for segment ordering in the sweep line status
 */
export class SegmentComparator {
  /**
   * Compare two segments (represented by their sweep events) for sweep line ordering
   * @param firstEvent First segment's sweep event
   * @param secondEvent Second segment's sweep event
   * @returns True if firstEvent's segment should come before secondEvent's segment
   */
  static compare(firstEvent: SweepEvent, secondEvent: SweepEvent): boolean {
    if (firstEvent === secondEvent) return false;

    if (
      calculateSignedArea(firstEvent.point, firstEvent.otherEvent!.point, secondEvent.point) !== 0 ||
      calculateSignedArea(firstEvent.point, firstEvent.otherEvent!.point, secondEvent.otherEvent!.point) !== 0
    ) {
      // Segments are not collinear
      // If they share their left endpoint use the right endpoint to sort
      if (firstEvent.point.x === secondEvent.point.x && firstEvent.point.y === secondEvent.point.y) {
        return firstEvent.isSegmentBelowPoint(secondEvent.otherEvent!.point);
      }

      // Different points
      if (SweepEventComparator.compare(firstEvent, secondEvent)) {
        // has the line segment associated to firstEvent been inserted into S after secondEvent?
        return secondEvent.isSegmentAbovePoint(firstEvent.point);
      }
      // The line segment associated to secondEvent has been inserted into S after firstEvent
      return firstEvent.isSegmentBelowPoint(secondEvent.point);
    }

    // Segments are collinear. Just a consistent criterion is used
    if (firstEvent.point.x === secondEvent.point.x && firstEvent.point.y === secondEvent.point.y) {
      // Use object comparison for consistent ordering
      return (firstEvent as any) < (secondEvent as any);
    }

    return SweepEventComparator.compare(firstEvent, secondEvent);
  }
}