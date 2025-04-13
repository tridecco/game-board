/**
 * @fileoverview Tests for Deep Clone Utility
 * @description This file contains unit tests for the deepClone function.
 */

const deepClone = require('../../src/utils/deepClone');

describe('deepClone', () => {
  it('should return null for null input', () => {
    expect(deepClone(null)).toBeNull();
  });

  it('should return the same primitive value for non-object inputs', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(undefined)).toBeUndefined();
    const sym = Symbol('test');
    expect(deepClone(sym).description).toBe(sym.description);
    expect(deepClone(sym)).toBe(sym);
  });

  it('should clone plain objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, [3, 4]];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should clone Date objects', () => {
    const date = new Date();
    const cloned = deepClone(date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });

  it('should clone RegExp objects', () => {
    const regex = /test/gi;
    const cloned = deepClone(regex);
    expect(cloned).toEqual(regex);
    expect(cloned).not.toBe(regex);
  });

  it('should clone Map objects', () => {
    const map = new Map();
    map.set('key', { a: 1 });
    const cloned = deepClone(map);
    expect(cloned).not.toBe(map);
    expect(cloned.get('key')).toEqual(map.get('key'));
    expect(cloned.get('key')).not.toBe(map.get('key'));
  });

  it('should clone Set objects', () => {
    const set = new Set([{ a: 1 }, { b: 2 }]);
    const cloned = deepClone(set);
    expect(cloned).not.toBe(set);
    for (const value of set) {
      expect(cloned.has(value)).toBe(false);
    }
  });

  it('should handle circular references', () => {
    const obj = { a: 1 };
    obj.self = obj;
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.self).toBe(cloned);
  });

  it('should clone objects with custom prototypes', () => {
    const proto = { greet: () => 'hello' };
    const obj = Object.create(proto);
    obj.a = 1;
    const cloned = deepClone(obj);
    expect(Object.getPrototypeOf(cloned)).toBe(proto);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
  });

  it('should clone objects with getters and setters', () => {
    const obj = {
      _value: 42,
      get value() {
        return this._value;
      },
      set value(val) {
        this._value = val;
      },
    };
    const cloned = deepClone(obj);
    expect(cloned.value).toBe(42);
    cloned.value = 100;
    expect(cloned._value).toBe(100);
    expect(obj._value).toBe(42);
  });

  it('should clone promises', async () => {
    const promise = Promise.resolve(42);
    const cloned = deepClone(promise);
    await expect(cloned).resolves.toBe(42);
  });

  it('should clone objects with symbols as keys', () => {
    const sym = Symbol('key');
    const obj = { [sym]: 42 };
    const cloned = deepClone(obj);
    expect(cloned[sym]).toBe(42);
    expect(cloned).not.toBe(obj);
  });

  it('should clone objects with iterable properties', () => {
    const obj = {
      *[Symbol.iterator]() {
        yield 1;
        yield 2;
      },
    };
    const cloned = deepClone(obj);
    expect([...cloned]).toEqual([1, 2]);
  });

  it('should clone WeakMap objects', () => {
    const weakMap = new WeakMap();
    const key = {};
    weakMap.set(key, { a: 1 });
    const cloned = deepClone(weakMap);
    expect(cloned).not.toBe(weakMap);
  });

  it('should clone WeakSet objects', () => {
    const weakSet = new WeakSet();
    const value = {};
    weakSet.add(value);
    const cloned = deepClone(weakSet);
    expect(cloned).not.toBe(weakSet);
  });

  it('should clone objects with null prototype', () => {
    const obj = Object.create(null);
    obj.a = 1;
    const cloned = deepClone(obj);
    expect(Object.getPrototypeOf(cloned)).toBeNull();
    expect(cloned).toEqual(obj);
  });
});
