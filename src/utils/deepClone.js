/**
 * @fileoverview Deep Clone Utility
 * @description This file contains a utility function for deep cloning objects.
 */

/**
 * @function deepClone - Deep clone an object.
 * @param {Object} obj - The object to clone.
 * @param {WeakMap} [memo=new WeakMap()] - A WeakMap to keep track of already cloned objects.
 * @returns {Object} - The deep cloned object.
 */
function deepClone(obj, memo = new WeakMap()) {
  if (obj === null) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (memo.has(obj)) {
    return memo.get(obj);
  }

  const Constructor = obj.constructor;

  switch (Constructor) {
    case Date:
      return new Constructor(obj);
    case RegExp:
      return new Constructor(obj);
    case Map:
      const newMap = new Constructor();
      memo.set(obj, newMap);
      for (const [key, value] of obj) {
        newMap.set(deepClone(key, memo), deepClone(value, memo));
      }
      return newMap;
    case Set:
      const newSet = new Constructor();
      memo.set(obj, newSet);
      for (const value of obj) {
        newSet.add(deepClone(value, memo));
      }
      return newSet;
    case Array:
      const newArray = new Constructor(obj.length);
      memo.set(obj, newArray);
      for (let i = 0; i < obj.length; i++) {
        newArray[i] = deepClone(obj[i], memo);
      }
      return newArray;
    case Object:
      const proto = Object.getPrototypeOf(obj);
      const newObj = proto === null ? Object.create(null) : {};
      memo.set(obj, newObj);
      for (const key of Reflect.ownKeys(obj)) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor) {
          Object.defineProperty(newObj, key, {
            value: deepClone(descriptor.value, memo),
            writable: descriptor.writable,
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            get: descriptor.get
              ? () => deepClone(descriptor.get.call(obj), memo)
              : undefined,
            set: descriptor.set
              ? (v) => descriptor.set.call(newObj, deepClone(v, memo))
              : undefined,
          });
        }
      }
      return newObj;
    case Function:
      return obj;
    case Symbol:
      return obj;
    case WeakMap:
      return new Constructor(obj);
    case WeakSet:
      return new Constructor(obj);
    case Promise:
      return new Constructor((resolve, reject) => {
        obj.then(
          (val) => resolve(deepClone(val, memo)),
          (reason) => reject(deepClone(reason, memo)),
        );
      });
    default:
      if (typeof obj[Symbol.iterator] === 'function') {
        const iterable = obj[Symbol.iterator]();
        let result = iterable.next();
        const items = [];
        while (!result.done) {
          items.push(deepClone(result.value, memo));
          result = iterable.next();
        }
        return new Constructor(...items);
      }
      const defaultProto = Object.getPrototypeOf(obj);
      const customObj =
        defaultProto === null
          ? Object.create(null)
          : Object.create(defaultProto);
      memo.set(obj, customObj);
      for (const key of Reflect.ownKeys(obj)) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor) {
          Object.defineProperty(customObj, key, {
            value: deepClone(descriptor.value, memo),
            writable: descriptor.writable,
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            get: descriptor.get
              ? () => deepClone(descriptor.get.call(obj), memo)
              : undefined,
            set: descriptor.set
              ? (v) => descriptor.set.call(customObj, deepClone(v, memo))
              : undefined,
          });
        }
      }
      return customObj;
  }
}

module.exports = deepClone;
