import { describe, test, expect, beforeEach } from 'vitest';
import { Connector } from '../src/connector/Connector';
import { PointChain } from '../src/connector/PointChain';
import { Segment } from '../src/types/Segment';
import { Polygon } from '../src/types/Polygon';
import type { Point } from '../src/types/Point';

describe('Connector', () => {
  let connector: Connector;

  beforeEach(() => {
    connector = new Connector();
  });

  describe('constructor', () => {
    test('should initialize with empty chains', () => {
      expect(connector.getClosedChainCount()).toBe(0);
      expect(connector.getClosedChains()).toEqual([]);
    });
  });

  describe('addSegment', () => {
    test('should create new chain for unconnected segment', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      connector.addSegment(segment);
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should connect segments that share endpoints', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      const segment2 = new Segment({ x: 1, y: 1 }, { x: 2, y: 2 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should close chain when segments form a closed loop', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 1, y: 1 });
      const segment3 = new Segment({ x: 1, y: 1 }, { x: 0, y: 1 });
      const segment4 = new Segment({ x: 0, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      connector.addSegment(segment4);
      
      expect(connector.getClosedChainCount()).toBe(1);
    });

    test('should handle triangle formation', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const segment3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      
      expect(connector.getClosedChainCount()).toBe(1);
      
      const closedChains = connector.getClosedChains();
      expect(closedChains[0]!.getPoints()).toHaveLength(3);
    });

    test('should link separate open chains when they can be connected', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 2, y: 0 }, { x: 3, y: 0 });
      const segment3 = new Segment({ x: 1, y: 0 }, { x: 2, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should handle segments with reversed orientation', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 2, y: 0 }, { x: 1, y: 0 }); // reversed
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should handle multiple separate closed chains', () => {
      // First triangle
      const tri1_seg1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const tri1_seg2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const tri1_seg3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      // Second triangle
      const tri2_seg1 = new Segment({ x: 2, y: 0 }, { x: 3, y: 0 });
      const tri2_seg2 = new Segment({ x: 3, y: 0 }, { x: 2.5, y: 1 });
      const tri2_seg3 = new Segment({ x: 2.5, y: 1 }, { x: 2, y: 0 });
      
      connector.addSegment(tri1_seg1);
      connector.addSegment(tri1_seg2);
      connector.addSegment(tri1_seg3);
      connector.addSegment(tri2_seg1);
      connector.addSegment(tri2_seg2);
      connector.addSegment(tri2_seg3);
      
      expect(connector.getClosedChainCount()).toBe(2);
    });
  });

  describe('getClosedChains', () => {
    test('should return empty array when no closed chains exist', () => {
      expect(connector.getClosedChains()).toEqual([]);
    });

    test('should return closed chains after forming complete polygons', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const segment3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      
      const chains = connector.getClosedChains();
      expect(chains).toHaveLength(1);
      expect(chains[0]).toBeInstanceOf(PointChain);
      expect(chains[0]!.isClosed()).toBe(true);
    });
  });

  describe('clearAll', () => {
    test('should clear all open and closed chains', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      connector.addSegment(segment);
      
      connector.clearAll();
      
      expect(connector.getClosedChainCount()).toBe(0);
      expect(connector.getClosedChains()).toEqual([]);
    });
  });

  describe('getClosedChainCount', () => {
    test('should return 0 when no closed chains exist', () => {
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should return correct count after adding closed chains', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const segment3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      expect(connector.getClosedChainCount()).toBe(0);
      
      connector.addSegment(segment2);
      expect(connector.getClosedChainCount()).toBe(0);
      
      connector.addSegment(segment3);
      expect(connector.getClosedChainCount()).toBe(1);
    });
  });

  describe('toPolygon', () => {
    test('should convert closed chains to polygon contours', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 1, y: 1 });
      const segment3 = new Segment({ x: 1, y: 1 }, { x: 0, y: 1 });
      const segment4 = new Segment({ x: 0, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      connector.addSegment(segment4);
      
      const polygon = new Polygon();
      connector.toPolygon(polygon);
      
      expect(polygon.contourCount()).toBe(1);
      const contourPoints = polygon.getContours()[0]!;
      expect(contourPoints).toHaveLength(4);
      
      const expectedPoints = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];
      
      contourPoints.forEach((point, index) => {
        expect(point.x).toBeCloseTo(expectedPoints[index]!.x);
        expect(point.y).toBeCloseTo(expectedPoints[index]!.y);
      });
    });

    test('should handle multiple closed chains in polygon', () => {
      // Create two separate triangles
      const tri1_seg1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const tri1_seg2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const tri1_seg3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      const tri2_seg1 = new Segment({ x: 2, y: 0 }, { x: 3, y: 0 });
      const tri2_seg2 = new Segment({ x: 3, y: 0 }, { x: 2.5, y: 1 });
      const tri2_seg3 = new Segment({ x: 2.5, y: 1 }, { x: 2, y: 0 });
      
      connector.addSegment(tri1_seg1);
      connector.addSegment(tri1_seg2);
      connector.addSegment(tri1_seg3);
      connector.addSegment(tri2_seg1);
      connector.addSegment(tri2_seg2);
      connector.addSegment(tri2_seg3);
      
      const polygon = new Polygon();
      connector.toPolygon(polygon);
      
      expect(polygon.contourCount()).toBe(2);
      
      const contours = polygon.getContours();
      expect(contours[0]).toHaveLength(3);
      expect(contours[1]).toHaveLength(3);
    });

    test('should handle empty connector', () => {
      const polygon = new Polygon();
      connector.toPolygon(polygon);
      
      expect(polygon.contourCount()).toBe(0);
    });
  });

  describe('backward compatibility aliases', () => {
    test('add should work as alias for addSegment', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      connector.add(segment);
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('clear should work as alias for clearAll', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      connector.addSegment(segment);
      
      connector.clear();
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('size should work as alias for getClosedChainCount', () => {
      expect(connector.size()).toBe(0);
      
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const segment3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      
      expect(connector.size()).toBe(1);
    });

    test('begin and end should work as aliases for getClosedChains', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      const segment3 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      connector.addSegment(segment3);
      
      expect(connector.begin()).toEqual(connector.getClosedChains());
      expect(connector.end()).toEqual(connector.getClosedChains());
    });
  });

  describe('edge cases', () => {
    test('should handle single point segments (degenerate)', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 0, y: 0 });
      
      connector.addSegment(segment);
      
      // Degenerate segments don't automatically close, they just create an open chain
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should handle segments with very close but not identical points', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1.0000000001, y: 0 }, { x: 2, y: 0 });
      
      connector.addSegment(segment1);
      connector.addSegment(segment2);
      
      expect(connector.getClosedChainCount()).toBe(0);
    });

    test('should handle complex polygon with many segments added out of order', () => {
      const segments = [
        new Segment({ x: 2, y: 0 }, { x: 3, y: 0 }),
        new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }),
        new Segment({ x: 3, y: 0 }, { x: 3, y: 1 }),
        new Segment({ x: 1, y: 0 }, { x: 2, y: 0 }),
        new Segment({ x: 0, y: 1 }, { x: 0, y: 0 }),
        new Segment({ x: 3, y: 1 }, { x: 0, y: 1 })
      ];
      
      // Add segments in random order
      for (const segment of segments) {
        connector.addSegment(segment);
      }
      
      expect(connector.getClosedChainCount()).toBe(1);
      
      const polygon = new Polygon();
      connector.toPolygon(polygon);
      expect(polygon.contourCount()).toBe(1);
      // The actual number of points depends on how the segments are connected
      expect(polygon.getContours()[0]!.length).toBeGreaterThan(0);
    });
  });
});