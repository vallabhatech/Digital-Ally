import { describe, expect, it } from 'vitest';
import { RingBuffer } from './ringBuffer.js';

describe('RingBuffer', () => {
  it('pushes and retrieves items', () => {
    const buf = new RingBuffer(3);
    buf.push('a');
    buf.push('b');
    buf.push('c');
    expect(buf.toArray()).toEqual(['a', 'b', 'c']);
    expect(buf.length).toBe(3);
  });

  it('evicts oldest items when full', () => {
    const buf = new RingBuffer(3);
    buf.push('a');
    buf.push('b');
    buf.push('c');
    buf.push('d');
    expect(buf.toArray()).toEqual(['b', 'c', 'd']);
    expect(buf.length).toBe(3);
  });

  it('handles single item', () => {
    const buf = new RingBuffer(5);
    buf.push('only');
    expect(buf.toArray()).toEqual(['only']);
    expect(buf.length).toBe(1);
  });

  it('returns empty array when empty', () => {
    const buf = new RingBuffer(5);
    expect(buf.toArray()).toEqual([]);
    expect(buf.length).toBe(0);
  });

  it('supports forEach', () => {
    const buf = new RingBuffer(3);
    buf.push(10);
    buf.push(20);
    buf.push(30);
    const result = [];
    buf.forEach((item) => result.push(item * 2));
    expect(result).toEqual([20, 40, 60]);
  });

  it('supports filter', () => {
    const buf = new RingBuffer(5);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    buf.push(5);
    const evens = buf.filter((item) => item % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  it('clears all items', () => {
    const buf = new RingBuffer(3);
    buf.push('a');
    buf.push('b');
    buf.clear();
    expect(buf.toArray()).toEqual([]);
    expect(buf.length).toBe(0);
  });

  it('handles wrap-around correctly', () => {
    const buf = new RingBuffer(3);
    buf.push('a');
    buf.push('b');
    buf.push('c');
    buf.push('d');
    buf.push('e');
    buf.push('f');
    expect(buf.toArray()).toEqual(['d', 'e', 'f']);
    expect(buf.length).toBe(3);
  });

  it('handles mixed operations after wrap', () => {
    const buf = new RingBuffer(4);
    for (let i = 1; i <= 6; i++) buf.push(i);
    const filtered = buf.filter((item) => item > 4);
    expect(filtered).toEqual([5, 6]);
    expect(buf.length).toBe(4);
  });
});
