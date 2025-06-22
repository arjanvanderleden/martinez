/**
 * Ordered Set implementation for maintaining sweep line status
 * Uses binary search for insertion and maintains sorted order
 */
export class OrderedSet<T> {
  private items: T[] = [];
  private compareFn: (a: T, b: T) => boolean;

  constructor(compareFn: (a: T, b: T) => boolean) {
    this.compareFn = compareFn;
  }

  insert(item: T): number {
    // Find the correct position to insert while maintaining order
    let left = 0;
    let right = this.items.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.compareFn(this.items[mid]!, item)) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    this.items.splice(left, 0, item);
    return left;
  }

  delete(item: T): boolean {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  indexOf(item: T): number {
    return this.items.indexOf(item);
  }

  at(index: number): T | undefined {
    return this.items[index];
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }
}