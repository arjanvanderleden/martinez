import { describe, test, expect, beforeEach } from 'vitest';
import { PointChain } from '../src/connector/PointChain';
import { Segment } from '../src/types/Segment';
import type { Point } from '../src/types/Point';

describe('PointChain', () => {
  let chain: PointChain;

  beforeEach(() => {
    chain = new PointChain();
  });

  describe('constructor', () => {
    test('should initialize with empty point list and closed=false', () => {
      expect(chain.getPoints()).toEqual([]);
      expect(chain.isClosed()).toBe(false);
      expect(chain.getSize()).toBe(0);
    });
  });

  describe('initializeWithSegment', () => {
    test('should initialize chain with segment endpoints', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      chain.initializeWithSegment(segment);
      
      const points = chain.getPoints();
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 1 });
      expect(chain.isClosed()).toBe(false);
    });

    test('should handle degenerate segment (same start and end point)', () => {
      const segment = new Segment({ x: 5, y: 5 }, { x: 5, y: 5 });
      
      chain.initializeWithSegment(segment);
      
      const points = chain.getPoints();
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 5, y: 5 });
      expect(points[1]).toEqual({ x: 5, y: 5 });
    });
  });

  describe('linkSegment', () => {
    beforeEach(() => {
      // Initialize with a base segment from (0,0) to (1,0)
      const baseSegment = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      chain.initializeWithSegment(baseSegment);
    });

    test('should link segment when segment.begin matches chain.front', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: -1, y: 0 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(true);
      const points = chain.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: -1, y: 0 });
      expect(points[1]).toEqual({ x: 0, y: 0 });
      expect(points[2]).toEqual({ x: 1, y: 0 });
    });

    test('should link segment when segment.end matches chain.back', () => {
      const segment = new Segment({ x: 2, y: 0 }, { x: 1, y: 0 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(true);
      const points = chain.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 0 });
      expect(points[2]).toEqual({ x: 2, y: 0 });
    });

    test('should link segment when segment.end matches chain.front', () => {
      const segment = new Segment({ x: -1, y: 0 }, { x: 0, y: 0 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(true);
      const points = chain.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: -1, y: 0 });
      expect(points[1]).toEqual({ x: 0, y: 0 });
      expect(points[2]).toEqual({ x: 1, y: 0 });
    });

    test('should link segment when segment.begin matches chain.back', () => {
      const segment = new Segment({ x: 1, y: 0 }, { x: 2, y: 0 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(true);
      const points = chain.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 0 });
      expect(points[2]).toEqual({ x: 2, y: 0 });
    });

    test('should close chain when segment connects front and back', () => {
      const segment = new Segment({ x: 1, y: 0 }, { x: 0, y: 0 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(true);
      expect(chain.isClosed()).toBe(true);
      // Points remain the same when closing
      const points = chain.getPoints();
      expect(points).toHaveLength(2);
    });

    test('should close chain when segment.begin matches front and segment.end matches back', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(true);
      expect(chain.isClosed()).toBe(true);
    });

    test('should return false when segment cannot be linked', () => {
      const segment = new Segment({ x: 5, y: 5 }, { x: 6, y: 6 });
      
      const result = chain.linkSegment(segment);
      
      expect(result).toBe(false);
      const points = chain.getPoints();
      expect(points).toHaveLength(2); // Original points unchanged
      expect(chain.isClosed()).toBe(false);
    });

    test('should handle linking to form a triangle', () => {
      // Start with segment from (0,0) to (1,0)
      // Add segment from (1,0) to (0.5,1)
      const segment1 = new Segment({ x: 1, y: 0 }, { x: 0.5, y: 1 });
      chain.linkSegment(segment1);
      
      // Add segment from (0.5,1) to (0,0) to close triangle
      const segment2 = new Segment({ x: 0.5, y: 1 }, { x: 0, y: 0 });
      const result = chain.linkSegment(segment2);
      
      expect(result).toBe(true);
      expect(chain.isClosed()).toBe(true);
      const points = chain.getPoints();
      expect(points).toHaveLength(3);
    });
  });

  describe('linkPointChain', () => {
    let chain1: PointChain;
    let chain2: PointChain;

    beforeEach(() => {
      chain1 = new PointChain();
      chain2 = new PointChain();
      
      // Initialize chain1 with segment from (0,0) to (1,0)
      chain1.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      
      // Initialize chain2 with segment from (1,0) to (2,0)
      chain2.initializeWithSegment(new Segment({ x: 1, y: 0 }, { x: 2, y: 0 }));
    });

    test('should link when other chain front matches this chain back', () => {
      const result = chain1.linkPointChain(chain2);
      
      expect(result).toBe(true);
      const points = chain1.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 0 });
      expect(points[2]).toEqual({ x: 2, y: 0 });
    });

    test('should link when other chain back matches this chain front', () => {
      // Set up chain2 to end where chain1 begins
      chain2 = new PointChain();
      chain2.initializeWithSegment(new Segment({ x: -1, y: 0 }, { x: 0, y: 0 }));
      
      const result = chain1.linkPointChain(chain2);
      
      expect(result).toBe(true);
      const points = chain1.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: -1, y: 0 });
      expect(points[1]).toEqual({ x: 0, y: 0 });
      expect(points[2]).toEqual({ x: 1, y: 0 });
    });

    test('should link when both chain fronts match (with reversal)', () => {
      // Set up chain2 to start where chain1 starts
      chain2 = new PointChain();
      chain2.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: -1, y: 0 }));
      
      const result = chain1.linkPointChain(chain2);
      
      expect(result).toBe(true);
      const points = chain1.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: -1, y: 0 });
      expect(points[1]).toEqual({ x: 0, y: 0 });
      expect(points[2]).toEqual({ x: 1, y: 0 });
    });

    test('should link when both chain backs match (with reversal)', () => {
      // Set up chain2 to end where chain1 ends
      chain2 = new PointChain();
      chain2.initializeWithSegment(new Segment({ x: 2, y: 0 }, { x: 1, y: 0 }));
      
      const result = chain1.linkPointChain(chain2);
      
      expect(result).toBe(true);
      const points = chain1.getPoints();
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 0 });
      expect(points[2]).toEqual({ x: 2, y: 0 });
    });

    test('should return false when chains cannot be linked', () => {
      // Set up chain2 with no common endpoints
      chain2 = new PointChain();
      chain2.initializeWithSegment(new Segment({ x: 5, y: 5 }, { x: 6, y: 6 }));
      
      const result = chain1.linkPointChain(chain2);
      
      expect(result).toBe(false);
      const points = chain1.getPoints();
      expect(points).toHaveLength(2); // Original points unchanged
    });

    test('should handle linking chains with multiple points', () => {
      // Build longer chains
      chain1.linkSegment(new Segment({ x: 1, y: 0 }, { x: 1, y: 1 }));
      chain2.linkSegment(new Segment({ x: 2, y: 0 }, { x: 3, y: 0 }));
      
      // Reset chain2 to start from (1,1) where chain1 ends
      chain2 = new PointChain();
      chain2.initializeWithSegment(new Segment({ x: 1, y: 1 }, { x: 2, y: 1 }));
      chain2.linkSegment(new Segment({ x: 2, y: 1 }, { x: 3, y: 1 }));
      
      const result = chain1.linkPointChain(chain2);
      
      expect(result).toBe(true);
      const points = chain1.getPoints();
      expect(points).toHaveLength(5);
    });
  });

  describe('isClosed', () => {
    test('should return false for new chain', () => {
      expect(chain.isClosed()).toBe(false);
    });

    test('should return false after adding segments that don\'t close', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      chain.initializeWithSegment(segment);
      
      expect(chain.isClosed()).toBe(false);
    });

    test('should return true after chain is closed', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      chain.linkSegment(new Segment({ x: 1, y: 0 }, { x: 0, y: 0 }));
      
      expect(chain.isClosed()).toBe(true);
    });
  });

  describe('getPoints', () => {
    test('should return empty array for new chain', () => {
      expect(chain.getPoints()).toEqual([]);
    });

    test('should return points after initialization', () => {
      const segment = new Segment({ x: 1, y: 2 }, { x: 3, y: 4 });
      chain.initializeWithSegment(segment);
      
      const points = chain.getPoints();
      expect(points).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]);
    });

    test('should return updated points after linking segments', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      chain.linkSegment(new Segment({ x: 1, y: 0 }, { x: 2, y: 0 }));
      
      const points = chain.getPoints();
      expect(points).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ]);
    });
  });

  describe('clearChain', () => {
    test('should clear all points but not reset closed status', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      chain.linkSegment(new Segment({ x: 1, y: 0 }, { x: 0, y: 0 })); // Close the chain
      
      chain.clearChain();
      
      expect(chain.getPoints()).toEqual([]);
      // clearChain only clears points, not the closed status
      expect(chain.isClosed()).toBe(true);
      expect(chain.getSize()).toBe(0);
    });
  });

  describe('getSize', () => {
    test('should return 0 for empty chain', () => {
      expect(chain.getSize()).toBe(0);
    });

    test('should return correct size after adding points', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      expect(chain.getSize()).toBe(2);
      
      chain.linkSegment(new Segment({ x: 1, y: 0 }, { x: 2, y: 0 }));
      expect(chain.getSize()).toBe(3);
    });
  });

  describe('backward compatibility aliases', () => {
    test('init should work as alias for initializeWithSegment', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 1, y: 1 });
      
      chain.init(segment);
      
      expect(chain.getPoints()).toHaveLength(2);
      expect(chain.getPoints()[0]).toEqual({ x: 0, y: 0 });
      expect(chain.getPoints()[1]).toEqual({ x: 1, y: 1 });
    });

    test('closed should work as alias for isClosed', () => {
      expect(chain.closed()).toBe(false);
      
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      chain.linkSegment(new Segment({ x: 1, y: 0 }, { x: 0, y: 0 }));
      
      expect(chain.closed()).toBe(true);
    });

    test('begin and end should work as aliases for getPoints', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      
      expect(chain.begin()).toEqual(chain.getPoints());
      expect(chain.end()).toEqual(chain.getPoints());
    });

    test('clear should work as alias for clearChain', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      
      chain.clear();
      
      expect(chain.getPoints()).toEqual([]);
    });

    test('size should work as alias for getSize', () => {
      expect(chain.size()).toBe(0);
      
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      expect(chain.size()).toBe(2);
    });

    test('list getter should return point list', () => {
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      
      expect(chain.list).toEqual(chain.getPoints());
    });

    test('_closed getter and setter should work', () => {
      expect(chain._closed).toBe(false);
      
      chain._closed = true;
      expect(chain._closed).toBe(true);
      expect(chain.isClosed()).toBe(true);
      
      chain._closed = false;
      expect(chain._closed).toBe(false);
      expect(chain.isClosed()).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle empty chain operations', () => {
      const otherChain = new PointChain();
      
      // Test that empty chain linking doesn't crash but returns false
      // Initialize both chains to avoid undefined access
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      otherChain.initializeWithSegment(new Segment({ x: 5, y: 5 }, { x: 6, y: 6 }));
      
      expect(chain.linkPointChain(otherChain)).toBe(false);
      expect(chain.getPoints()).toHaveLength(2);
    });

    test('should handle single point chains', () => {
      const segment = new Segment({ x: 0, y: 0 }, { x: 0, y: 0 });
      chain.initializeWithSegment(segment);
      
      expect(chain.getPoints()).toHaveLength(2);
      expect(chain.getPoints()[0]).toEqual({ x: 0, y: 0 });
      expect(chain.getPoints()[1]).toEqual({ x: 0, y: 0 });
    });

    test('should handle very small coordinate differences', () => {
      const segment1 = new Segment({ x: 0, y: 0 }, { x: 1, y: 0 });
      const segment2 = new Segment({ x: 1.0000000001, y: 0 }, { x: 2, y: 0 });
      
      chain.initializeWithSegment(segment1);
      const result = chain.linkSegment(segment2);
      
      // Should not link due to floating point precision
      expect(result).toBe(false);
    });

    test('should handle chains with identical consecutive points after linking', () => {
      // Create a scenario where linking might result in duplicate points
      const otherChain = new PointChain();
      
      chain.initializeWithSegment(new Segment({ x: 0, y: 0 }, { x: 1, y: 0 }));
      otherChain.initializeWithSegment(new Segment({ x: 1, y: 0 }, { x: 2, y: 0 }));
      
      const result = chain.linkPointChain(otherChain);
      
      expect(result).toBe(true);
      const points = chain.getPoints();
      // Should not have duplicate (1,0) point
      expect(points).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ]);
    });
  });
});