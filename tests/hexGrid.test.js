/**
 * @fileoverview Tests for Hexagonal Grid (Offset Coordinates)
 * @description This file contains unit tests for the HexGrid class.
 */

const HexGrid = require('../').HexGrid;

describe('HexGrid', () => {
  describe('constructor', () => {
    it('should create a grid with the specified dimensions and type', () => {
      const grid = new HexGrid(5, 3, 'odd-r');
      expect(grid.grid.length).toBe(3);
      expect(grid.grid[0].length).toBe(5);
      expect(grid.type).toBe('odd-r');
    });

    it('should initialize the grid with null values', () => {
      const grid = new HexGrid(2, 2, 'even-r');
      expect(grid.get(0, 0)).toBe(null);
      expect(grid.get(1, 0)).toBe(null);
      expect(grid.get(0, 1)).toBe(null);
      expect(grid.get(1, 1)).toBe(null);
    });

    it('should throw an error if the grid type is invalid', () => {
      expect(() => new HexGrid(2, 2, 'invalid-type')).toThrowError(
        'Invalid grid type',
      );
    });
  });

  describe('get', () => {
    let grid;

    beforeEach(() => {
      grid = new HexGrid(3, 3, 'odd-r');
      grid.set(1, 1, 'test value');
    });

    it('should return the value at the specified column and row', () => {
      expect(grid.get(1, 1)).toBe('test value');
    });

    it('should return null if the coordinates are out of bounds', () => {
      expect(grid.get(-1, 1)).toBe(null);
      expect(grid.get(1, -1)).toBe(null);
      expect(grid.get(3, 1)).toBe(null);
      expect(grid.get(1, 3)).toBe(null);
    });
  });

  describe('set', () => {
    let grid;

    beforeEach(() => {
      grid = new HexGrid(3, 3, 'even-r');
    });

    it('should set the value at the specified column and row', () => {
      grid.set(0, 0, 'new value');
      expect(grid.get(0, 0)).toBe('new value');
    });

    it('should not set the value if the coordinates are out of bounds', () => {
      grid.set(-1, 0, 'value');
      grid.set(0, -1, 'value');
      grid.set(3, 0, 'value');
      grid.set(0, 3, 'value');
      expect(grid.get(-1, 0)).toBe(null);
      expect(grid.get(0, -1)).toBe(null);
      expect(grid.get(3, 0)).toBe(null);
      expect(grid.get(0, 3)).toBe(null);
    });
  });

  describe('remove', () => {
    let grid;

    beforeEach(() => {
      grid = new HexGrid(3, 3, 'odd-q');
      grid.set(2, 2, 'value to remove');
    });

    it('should remove the value at the specified column and row and return it', () => {
      const removedValue = grid.remove(2, 2);
      expect(removedValue).toBe('value to remove');
      expect(grid.get(2, 2)).toBe(null);
    });

    it('should return null if the coordinates are out of bounds', () => {
      expect(grid.remove(-1, 2)).toBe(null);
      expect(grid.remove(2, -1)).toBe(null);
      expect(grid.remove(3, 2)).toBe(null);
      expect(grid.remove(2, 3)).toBe(null);
    });

    it('should return null if there is no value to remove at the specified coordinates', () => {
      expect(grid.remove(0, 0)).toBe(null);
    });
  });

  describe('getAdjacents', () => {
    describe('odd-r type', () => {
      it('should return correct adjacents for even row', () => {
        const grid = new HexGrid(5, 5, 'odd-r');
        grid.set(2, 2, 'center');
        grid.set(1, 1, 'adjacent1');
        grid.set(2, 1, 'adjacent2');
        grid.set(3, 2, 'adjacent3');
        grid.set(2, 3, 'adjacent4');
        grid.set(1, 3, 'adjacent5');
        grid.set(1, 2, 'adjacent6');

        const adjacents = grid.getAdjacents(2, 2);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 1, row: 1, value: 'adjacent1' },
            { col: 2, row: 1, value: 'adjacent2' },
            { col: 3, row: 2, value: 'adjacent3' },
            { col: 2, row: 3, value: 'adjacent4' },
            { col: 1, row: 3, value: 'adjacent5' },
            { col: 1, row: 2, value: 'adjacent6' },
          ]),
        );
      });

      it('should return correct adjacents for odd row', () => {
        const grid = new HexGrid(5, 5, 'odd-r');
        grid.set(2, 3, 'center');
        grid.set(2, 2, 'adjacent1');
        grid.set(3, 2, 'adjacent2');
        grid.set(3, 3, 'adjacent3');
        grid.set(3, 4, 'adjacent4');
        grid.set(2, 4, 'adjacent5');
        grid.set(1, 3, 'adjacent6');

        const adjacents = grid.getAdjacents(2, 3);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 2, row: 2, value: 'adjacent1' },
            { col: 3, row: 2, value: 'adjacent2' },
            { col: 3, row: 3, value: 'adjacent3' },
            { col: 3, row: 4, value: 'adjacent4' },
            { col: 2, row: 4, value: 'adjacent5' },
            { col: 1, row: 3, value: 'adjacent6' },
          ]),
        );
      });
    });

    describe('even-r type', () => {
      it('should return correct adjacents for even row', () => {
        const grid = new HexGrid(5, 5, 'even-r');
        grid.set(2, 2, 'center');
        grid.set(2, 1, 'adjacent1');
        grid.set(3, 1, 'adjacent2');
        grid.set(3, 2, 'adjacent3');
        grid.set(3, 3, 'adjacent4');
        grid.set(2, 3, 'adjacent5');
        grid.set(1, 2, 'adjacent6');

        const adjacents = grid.getAdjacents(2, 2);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 2, row: 1, value: 'adjacent1' },
            { col: 3, row: 1, value: 'adjacent2' },
            { col: 3, row: 2, value: 'adjacent3' },
            { col: 3, row: 3, value: 'adjacent4' },
            { col: 2, row: 3, value: 'adjacent5' },
            { col: 1, row: 2, value: 'adjacent6' },
          ]),
        );
      });

      it('should return correct adjacents for odd row', () => {
        const grid = new HexGrid(5, 5, 'even-r');
        grid.set(2, 3, 'center');
        grid.set(1, 2, 'adjacent1');
        grid.set(2, 2, 'adjacent2');
        grid.set(3, 3, 'adjacent3');
        grid.set(2, 4, 'adjacent4');
        grid.set(1, 4, 'adjacent5');
        grid.set(1, 3, 'adjacent6');

        const adjacents = grid.getAdjacents(2, 3);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 1, row: 2, value: 'adjacent1' },
            { col: 2, row: 2, value: 'adjacent2' },
            { col: 3, row: 3, value: 'adjacent3' },
            { col: 2, row: 4, value: 'adjacent4' },
            { col: 1, row: 4, value: 'adjacent5' },
            { col: 1, row: 3, value: 'adjacent6' },
          ]),
        );
      });
    });

    describe('odd-q type', () => {
      it('should return correct adjacents for even column', () => {
        const grid = new HexGrid(5, 5, 'odd-q');
        grid.set(3, 2, 'center');
        grid.set(3, 1, 'adjacent1');
        grid.set(4, 2, 'adjacent2');
        grid.set(4, 3, 'adjacent3');
        grid.set(3, 3, 'adjacent4');
        grid.set(2, 3, 'adjacent5');
        grid.set(2, 2, 'adjacent6');

        const adjacents = grid.getAdjacents(3, 2);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 3, row: 1, value: 'adjacent1' },
            { col: 4, row: 2, value: 'adjacent2' },
            { col: 4, row: 3, value: 'adjacent3' },
            { col: 3, row: 3, value: 'adjacent4' },
            { col: 2, row: 3, value: 'adjacent5' },
            { col: 2, row: 2, value: 'adjacent6' },
          ]),
        );
      });

      it('should return correct adjacents for odd column', () => {
        const grid = new HexGrid(5, 5, 'odd-q');
        grid.set(2, 3, 'center');
        grid.set(2, 2, 'adjacent1');
        grid.set(3, 2, 'adjacent2');
        grid.set(3, 3, 'adjacent3');
        grid.set(2, 4, 'adjacent4');
        grid.set(1, 3, 'adjacent5');
        grid.set(1, 2, 'adjacent6');

        const adjacents = grid.getAdjacents(2, 3);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 2, row: 2, value: 'adjacent1' },
            { col: 3, row: 2, value: 'adjacent2' },
            { col: 3, row: 3, value: 'adjacent3' },
            { col: 2, row: 4, value: 'adjacent4' },
            { col: 1, row: 3, value: 'adjacent5' },
            { col: 1, row: 2, value: 'adjacent6' },
          ]),
        );
      });
    });

    describe('even-q type', () => {
      it('should return correct adjacents for even column', () => {
        const grid = new HexGrid(5, 5, 'even-q');
        grid.set(3, 2, 'center');
        grid.set(3, 1, 'adjacent1');
        grid.set(4, 1, 'adjacent2');
        grid.set(4, 2, 'adjacent3');
        grid.set(3, 3, 'adjacent4');
        grid.set(2, 2, 'adjacent5');
        grid.set(2, 1, 'adjacent6');

        const adjacents = grid.getAdjacents(3, 2);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 3, row: 1, value: 'adjacent1' },
            { col: 4, row: 1, value: 'adjacent2' },
            { col: 4, row: 2, value: 'adjacent3' },
            { col: 3, row: 3, value: 'adjacent4' },
            { col: 2, row: 2, value: 'adjacent5' },
            { col: 2, row: 1, value: 'adjacent6' },
          ]),
        );
      });

      it('should return correct adjacents for odd column', () => {
        const grid = new HexGrid(5, 5, 'even-q');
        grid.set(2, 2, 'center');
        grid.set(2, 1, 'adjacent1');
        grid.set(3, 2, 'adjacent2');
        grid.set(3, 3, 'adjacent3');
        grid.set(2, 3, 'adjacent4');
        grid.set(1, 3, 'adjacent5');
        grid.set(1, 2, 'adjacent6');

        const adjacents = grid.getAdjacents(2, 2);
        expect(adjacents.length).toBe(6);
        expect(adjacents).toEqual(
          expect.arrayContaining([
            { col: 2, row: 1, value: 'adjacent1' },
            { col: 3, row: 2, value: 'adjacent2' },
            { col: 3, row: 3, value: 'adjacent3' },
            { col: 2, row: 3, value: 'adjacent4' },
            { col: 1, row: 3, value: 'adjacent5' },
            { col: 1, row: 2, value: 'adjacent6' },
          ]),
        );
      });
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the grid', () => {
      const grid = new HexGrid(2, 2, 'odd-r');
      grid.set(0, 0, 'original value');
      const clonedGrid = grid.clone();

      expect(clonedGrid).toBeInstanceOf(HexGrid);
      expect(clonedGrid.type).toBe(grid.type);
      expect(clonedGrid.grid).toEqual(grid.grid);

      clonedGrid.set(0, 0, 'modified value');
      expect(clonedGrid.get(0, 0)).toBe('modified value');
      expect(grid.get(0, 0)).toBe('original value');
    });
  });

  describe('clear', () => {
    it('should clear all values in the grid', () => {
      const grid = new HexGrid(3, 3, 'even-q');
      grid.set(0, 0, 'value1');
      grid.set(1, 1, 'value2');
      grid.clear();
      expect(grid.get(0, 0)).toBe(null);
      expect(grid.get(1, 1)).toBe(null);
      expect(grid.get(2, 2)).toBe(null);
    });
  });
});
