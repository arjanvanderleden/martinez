/**
 * Priority Queue implementation for event queue management
 * Uses a binary heap with custom comparison function
 */
export class PriorityQueue<T> {
  private items: T[] = [];
  private compareFn: (a: T, b: T) => boolean;

  constructor(compareFn: (a: T, b: T) => boolean) {
    this.compareFn = compareFn;
  }

  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    if (this.items.length === 1) return this.items.pop();

    const top = this.items[0];
    this.items[0] = this.items.pop()!;
    this.bubbleDown(0);
    return top;
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (!this.compareFn(this.items[parentIndex]!, this.items[index]!)) {
        break;
      }
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      let minIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.items.length && this.compareFn(this.items[minIndex]!, this.items[leftChild]!)) {
        minIndex = leftChild;
      }

      if (rightChild < this.items.length && this.compareFn(this.items[minIndex]!, this.items[rightChild]!)) {
        minIndex = rightChild;
      }

      if (minIndex === index) break;

      this.swap(index, minIndex);
      index = minIndex;
    }
  }

  private swap(i: number, j: number): void {
    [this.items[i], this.items[j]] = [this.items[j]!, this.items[i]!];
  }
}