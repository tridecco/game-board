/**
 * @fileoverview Tests for Triangular Hexagonal Grid (Based on HexGrid)
 * @description This file contains unit tests for the TriHexGrid class.
 */

const TriHexGrid = require('../').TriHexGrid;

describe('TriHexGrid', () => {
  describe('constructor', () => {
    it('should create a TriHexGrid instance', () => {
      const grid = new TriHexGrid(5, 3, 'odd-r');
      expect(grid).toBeInstanceOf(TriHexGrid);
    });

    it('should inherit properties from HexGrid', () => {
      const grid = new TriHexGrid(5, 3, 'even-r');
      expect(grid.grid.length).toBe(3);
      expect(grid.grid[0].length).toBe(5);
      expect(grid.type).toBe('even-r');
    });
  });

  describe('get', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'odd-r');
      grid.set(
        [
          [1, 1, 1],
          [1, 1, 3],
        ],
        'test value',
      );
    });

    it('should return the value at the specified column, row, and triangle', () => {
      expect(grid.get(1, 1, 1)).toBe('test value');
      expect(grid.get(1, 1, 3)).toBe('test value');
    });

    it('should return null if the triangle is not set', () => {
      expect(grid.get(1, 1, 2)).toBe(null);
    });

    it('should return null if the hex is out of bounds', () => {
      expect(grid.get(-1, 1, 1)).toBe(null);
    });

    it('should throw an error if the triangle index is invalid', () => {
      expect(() => grid.get(1, 1, 0)).toThrowError(
        'Triangle index must be between 1 and 6',
      );
      expect(() => grid.get(1, 1, 7)).toThrowError(
        'Triangle index must be between 1 and 6',
      );
    });
  });

  describe('set', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'even-r');
    });

    it('should set the value at the specified column, row, and triangle', () => {
      grid.set([[0, 0, 2]], 'new value');
      expect(grid.get(0, 0, 2)).toBe('new value');
    });

    it('should create hex object if not exist when set value', () => {
      grid.set([[0, 0, 2]], 'new value');
      expect(grid.grid[0][0]).toEqual({ triangles: { 2: 'new value' } });
    });

    it('should not set the value if the triangle index is invalid', () => {
      expect(() => grid.set([[0, 0, 0]], 'value')).toThrowError(
        'Triangle index must be between 1 and 6',
      );
      expect(() => grid.set([[0, 0, 7]], 'value')).toThrowError(
        'Triangle index must be between 1 and 6',
      );
    });

    it('should handle setting multiple positions at once', () => {
      grid.set(
        [
          [0, 0, 1],
          [0, 0, 3],
          [1, 1, 5],
        ],
        'multi value',
      );
      expect(grid.get(0, 0, 1)).toBe('multi value');
      expect(grid.get(0, 0, 3)).toBe('multi value');
      expect(grid.get(1, 1, 5)).toBe('multi value');
    });
  });

  describe('remove', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'odd-q');
      grid.set(
        [
          [2, 2, 4],
          [2, 2, 6],
        ],
        'value to remove',
      );
    });

    it('should remove the value at the specified column, row, and triangle and return it', () => {
      const removedValues = grid.remove([
        [2, 2, 4],
        [2, 2, 6],
      ]);
      expect(removedValues).toEqual(['value to remove', 'value to remove']);
      expect(grid.get(2, 2, 4)).toBe(null);
      expect(grid.get(2, 2, 6)).toBe(null);
    });

    it('should return null if the triangle is not set', () => {
      expect(grid.remove([[2, 2, 2]])).toEqual([null]);
    });

    it('should return null if the hex is out of bounds', () => {
      expect(grid.remove([[-1, 2, 4]])).toEqual([null]);
    });

    it('should not remove the entire hex object if triangles are removed', () => {
      grid.set([[2, 2, 3]], 'another value');
      grid.remove([[2, 2, 4]]);
      expect(grid.getHexagon(2, 2)).toEqual([
        null,
        null,
        'another value',
        null,
        null,
        'value to remove',
      ]);
      grid.remove([[2, 2, 6]]);
      expect(grid.getHexagon(2, 2)).toEqual([
        null,
        null,
        'another value',
        null,
        null,
        null,
      ]);
    });

    it('should throw an error if the triangle index is invalid', () => {
      expect(() => grid.remove([[2, 2, 0]])).toThrowError(
        'Triangle index must be between 1 and 6',
      );
      expect(() => grid.remove([[2, 2, 7]])).toThrowError(
        'Triangle index must be between 1 and 6',
      );
    });
  });

  describe('getHexagon', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'even-q');
      grid.setHexagon(1, 1, [
        'value1',
        'value2',
        'value3',
        'value4',
        'value5',
        'value6',
      ]);
    });

    it('should return an array of all triangle values for a hexagon', () => {
      expect(grid.getHexagon(1, 1)).toEqual([
        'value1',
        'value2',
        'value3',
        'value4',
        'value5',
        'value6',
      ]);
    });

    it('should return an array of null if the hexagon is not set', () => {
      expect(grid.getHexagon(0, 0)).toEqual([
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    });

    it('should return an array with nulls for unset triangles', () => {
      grid.removeHexagon(1, 1);
      grid.set(
        [
          [1, 1, 2],
          [1, 1, 5],
        ],
        'test value',
      );
      expect(grid.getHexagon(1, 1)).toEqual([
        null,
        'test value',
        null,
        null,
        'test value',
        null,
      ]);
    });
  });

  describe('setHexagon', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'odd-r');
    });

    it('should set all triangle values for a hexagon', () => {
      grid.setHexagon(0, 0, ['set1', 'set2', 'set3', 'set4', 'set5', 'set6']);
      expect(grid.getHexagon(0, 0)).toEqual([
        'set1',
        'set2',
        'set3',
        'set4',
        'set5',
        'set6',
      ]);
    });

    it('should create hex object if not exist when set hexagon values', () => {
      grid.setHexagon(0, 0, ['set1', 'set2', 'set3', 'set4', 'set5', 'set6']);
      expect(grid.grid[0][0]).toEqual({
        triangles: {
          1: 'set1',
          2: 'set2',
          3: 'set3',
          4: 'set4',
          5: 'set5',
          6: 'set6',
        },
      });
    });

    it('should handle setting fewer values than triangles', () => {
      grid.setHexagon(0, 0, ['set1', 'set2', 'set3']);
      expect(grid.getHexagon(0, 0)).toEqual([
        'set1',
        'set2',
        'set3',
        null,
        null,
        null,
      ]);
    });
  });

  describe('removeHexagon', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'even-r');
      grid.setHexagon(2, 2, [
        'remove1',
        'remove2',
        'remove3',
        'remove4',
        'remove5',
        'remove6',
      ]);
    });

    it('should remove all triangle values for a hexagon and return them', () => {
      const removedValues = grid.removeHexagon(2, 2);
      expect(removedValues).toEqual([
        'remove1',
        'remove2',
        'remove3',
        'remove4',
        'remove5',
        'remove6',
      ]);
      expect(grid.getHexagon(2, 2)).toEqual([
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    });

    it('should return an array of null if the hexagon is not set', () => {
      expect(grid.removeHexagon(0, 0)).toEqual([
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    });

    it('should clear triangles object after remove hexagon', () => {
      grid.removeHexagon(2, 2);
      expect(grid.grid[2][2]).toBe(null);
    });
  });

  describe('isFull', () => {
    let grid;

    beforeEach(() => {
      grid = new TriHexGrid(3, 3, 'odd-q');
    });

    it('should return true if all triangles are filled', () => {
      grid.setHexagon(0, 0, [
        'full1',
        'full2',
        'full3',
        'full4',
        'full5',
        'full6',
      ]);
      expect(grid.isFull(0, 0)).toBe(true);
    });

    it('should return false if not all triangles are filled', () => {
      grid.setHexagon(0, 0, ['full1', 'full2', 'full3']);
      expect(grid.isFull(0, 0)).toBe(false);
    });

    it('should return false if the hexagon is not set', () => {
      expect(grid.isFull(1, 1)).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the TriHexGrid', () => {
      const grid = new TriHexGrid(2, 2, 'even-r');
      grid.setHexagon(0, 0, [
        'original1',
        'original2',
        'original3',
        'original4',
        'original5',
        'original6',
      ]);
      const clonedGrid = grid.clone();

      expect(clonedGrid).toBeInstanceOf(TriHexGrid);
      expect(clonedGrid.type).toBe(grid.type);
      expect(clonedGrid.grid).toEqual(grid.grid);
      expect(clonedGrid.getHexagon(0, 0)).toEqual(grid.getHexagon(0, 0));

      clonedGrid.set([[0, 0, 1]], 'modified value');
      expect(clonedGrid.get(0, 0, 1)).toBe('modified value');
      expect(grid.get(0, 0, 1)).toBe('original1');
    });
  });
});
