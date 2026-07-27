export class RingBuffer {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }

  push(item) {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.maxSize;
    if (this._size < this.maxSize) {
      this._size++;
    } else {
      this.head = (this.head + 1) % this.maxSize;
    }
  }

  get length() {
    return this._size;
  }

  toArray() {
    if (this._size === 0) return [];
    const result = new Array(this._size);
    for (let i = 0; i < this._size; i++) {
      result[i] = this.buffer[(this.head + i) % this.maxSize];
    }
    return result;
  }

  forEach(fn) {
    for (let i = 0; i < this._size; i++) {
      fn(this.buffer[(this.head + i) % this.maxSize], i);
    }
  }

  filter(fn) {
    const result = [];
    for (let i = 0; i < this._size; i++) {
      const item = this.buffer[(this.head + i) % this.maxSize];
      if (fn(item, i)) result.push(item);
    }
    return result;
  }

  clear() {
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }
}
