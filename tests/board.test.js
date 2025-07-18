/**
 * @fileoverview Tests for Game Board
 * @description This file contains unit tests for the Board class.
 */

const Board = require('../').Board;
const Piece = require('../').Piece;

const defaultMap = require('../maps/board/default');

describe('Board', () => {
  describe('constructor', () => {
    it('should create a Board instance with default map if no map is provided', () => {
      const board = new Board();
      expect(board).toBeInstanceOf(Board);
      expect(board.map).toEqual(defaultMap);
      expect(board.grid).toBeDefined();
      expect(board.indexes).toBeDefined();
      expect(board.hexagons).toBeDefined();
      expect(board.history).toBeDefined();
    });

    it('should create a Board instance with provided map', () => {
      const customMap = {
        type: 'odd-r',
        columns: 4,
        rows: 4,
        positions: [],
      };
      const board = new Board(customMap);
      expect(board).toBeInstanceOf(Board);
      expect(board.map).toEqual(customMap);
      expect(board.grid).toBeDefined();
      expect(board.indexes).toBeDefined();
      expect(board.hexagons).toBeDefined();
      expect(board.history).toBeDefined();
    });

    it('should throw an error if map is invalid (missing type)', () => {
      const invalidMap = {
        columns: 4,
        rows: 4,
        positions: [],
      };
      expect(() => new Board(invalidMap)).toThrow('Invalid map provided');
    });

    it('should throw an error if map is invalid (missing columns)', () => {
      const invalidMap = {
        type: 'odd-r',
        rows: 4,
        positions: [],
      };
      expect(() => new Board(invalidMap)).toThrow('Invalid map provided');
    });

    it('should throw an error if map is invalid (missing rows)', () => {
      const invalidMap = {
        type: 'odd-r',
        columns: 4,
        positions: [],
      };
      expect(() => new Board(invalidMap)).toThrow('Invalid map provided');
    });

    it('should throw an error if map is invalid (missing positions)', () => {
      const invalidMap = {
        type: 'odd-r',
        columns: 4,
        rows: 4,
      };
      expect(() => new Board(invalidMap)).toThrow('Invalid map provided');
    });
  });

  describe('get', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.set(0, piece);
    });

    it('should return the piece at the specified index', () => {
      expect(board.get(0)).toBe(piece);
    });

    it('should return null if no piece at the specified index', () => {
      expect(board.get(1)).toBeNull();
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.get(-1)).toThrow('Index out of bounds');
      expect(() => board.get(board.map.positions.length)).toThrow(
        'Index out of bounds',
      );
    });
  });

  describe('set', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    it('should set a piece at the specified index', () => {
      board.set(0, piece);
      expect(board.get(0)).toBe(piece);
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.set(-1, piece)).toThrow('Index out of bounds');
      expect(() => board.set(board.map.positions.length, piece)).toThrow(
        'Index out of bounds',
      );
    });

    it('should throw an error if value is not a Piece instance', () => {
      expect(() => board.set(0, {})).toThrow(
        'Value must be an instance of Piece',
      );
      expect(() => board.set(0, 'not a piece')).toThrow(
        'Value must be an instance of Piece',
      );
    });

    it('should update grid with piece colors', () => {
      board.set(0, piece);
      const position = board.map.positions[0];
      expect(
        board.grid.get(position[1][0], position[1][1], position[1][2]),
      ).toBe('red');
      expect(
        board.grid.get(position[8][0], position[8][1], position[8][2]),
      ).toBe('blue');
    });

    it('should add to history when set a piece', () => {
      board.set(0, piece);
      expect(board.history.length).toBe(1);
      expect(board.history[0].op).toBe('set');
      expect(board.history[0].index).toBe(0);
    });
  });

  describe('place', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    it('should place a piece at the specified index if position is available', () => {
      const result = board.place(0, piece);
      expect(board.get(0)).toBe(piece);
      expect(result).toEqual([]); // No hexagons formed on the first place
    });

    it('should return formed hexagons if any', () => {
      const boardForHexagon = new Board();
      const piece1 = new Piece(['red', 'green']);

      boardForHexagon.place(0, piece1);

      const pieceForHexagon = new Piece(['green', 'blue']);
      const hexagons = boardForHexagon.place(8, pieceForHexagon);

      expect(hexagons.length).toEqual(1);
      if (hexagons.length > 0) {
        hexagons.forEach((hexagon) => {
          expect(hexagon).toBeInstanceOf(Object);
          expect(hexagon.coordinate.length).toBe(2);
          expect(hexagon.color).toBe('green');
        });
      }
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.place(-1, piece)).toThrow('Index out of bounds');
      expect(() => board.place(board.map.positions.length, piece)).toThrow(
        'Index out of bounds',
      );
    });

    it('should throw an error if position is already occupied', () => {
      board.place(0, piece);
      const anotherPiece = new Piece(['green', 'yellow']);
      expect(() => board.place(0, anotherPiece)).toThrow(
        'Position already occupied',
      );
    });

    it('should throw an error if value is not a Piece instance', () => {
      expect(() => board.place(0, {})).toThrow(
        'Value must be an instance of Piece',
      );
      expect(() => board.place(0, 'not a piece')).toThrow(
        'Value must be an instance of Piece',
      );
    });
  });

  describe('remove', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
    });

    it('should remove a piece at the specified index', () => {
      const removedPiece = board.remove(0);
      expect(removedPiece).toBe(piece);
      expect(board.get(0)).toBeNull();
    });

    it('should return null if no piece at the specified index', () => {
      expect(board.remove(1)).toBeNull();
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.remove(-1)).toThrow('Index out of bounds');
      expect(() => board.remove(board.map.positions.length)).toThrow(
        'Index out of bounds',
      );
    });

    it('should update grid after remove piece', () => {
      board.remove(0);
      const position = board.map.positions[0];
      expect(
        board.grid.get(position[1][0], position[1][1], position[1][2]),
      ).toBeNull();
      expect(
        board.grid.get(position[8][0], position[8][1], position[8][2]),
      ).toBeNull();
    });

    it('should add to history when remove a piece', () => {
      board.remove(0);
      expect(board.history.length).toBe(2); // place + remove
      expect(board.history[1].op).toBe('remove');
      expect(board.history[1].index).toBe(0);
      expect(board.history[1].value).toBe(piece);
    });
  });

  describe('getRelatedHexagons', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    it('should return related hexagons for a valid index', () => {
      const hexagons = board.getRelatedHexagons(0);
      expect(hexagons).toBeInstanceOf(Array);
      const expectedHexagons = new Set();
      const position0 = board.map.positions[0];
      for (let i = 1; i <= Board.POSITION_INDEXES.F; i++) {
        const hexagon = position0[i];
        if (hexagon) {
          expectedHexagons.add(`${hexagon[0]}-${hexagon[1]}`);
        }
      }
      expect(new Set(hexagons)).toEqual(expectedHexagons);
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.getRelatedHexagons(-1)).toThrow(
        'Index out of bounds',
      );
      expect(() =>
        board.getRelatedHexagons(board.map.positions.length),
      ).toThrow('Index out of bounds');
    });
  });

  describe('getRandomPosition', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    it('should return a random position index', () => {
      const randomIndex = board.getRandomPosition();
      expect(randomIndex).toBeGreaterThanOrEqual(0);
      expect(randomIndex).toBeLessThan(board.map.positions.length);
    });

    it('should return -1 if no valid position is found with excludedIndexes covering all positions', () => {
      const excludedIndexes = board.map.positions.map((_, index) => index); // Exclude all positions
      const randomIndex = board.getRandomPosition(false, excludedIndexes);
      expect(randomIndex).toBe(-1);
    });

    it('should not return a random edge position index if isEdge is false', () => {
      const randomIndex = board.getRandomPosition(false);
      const position = board.map.positions[randomIndex];
      expect(position.isEdge).toBe(false);
    });

    it('should respect excludedIndexes', () => {
      const excludedIndex = 0;
      const randomIndex = board.getRandomPosition(false, [excludedIndex]);
      expect(randomIndex).not.toBe(excludedIndex);
    });
  });

  describe('getEmptyPositions', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
    });

    it('should return an array of empty position indexes', () => {
      const emptyPositions = board.getEmptyPositions();
      expect(emptyPositions).toBeInstanceOf(Array);
      expect(emptyPositions).not.toContain(0);
      expect(emptyPositions.length).toBe(board.map.positions.length - 1);
    });

    it('should return all position indexes if board is empty', () => {
      board.remove(0);
      const emptyPositions = board.getEmptyPositions();
      expect(emptyPositions).toEqual(
        board.map.positions.map((_, index) => index),
      );
      expect(emptyPositions.length).toBe(board.map.positions.length);
    });
  });

  describe('getOccupiedPositions', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
      board.place(1, piece);
    });

    it('should return an array of occupied position indexes', () => {
      const occupiedPositions = board.getOccupiedPositions();
      expect(occupiedPositions).toBeInstanceOf(Array);
      expect(occupiedPositions).toContain(0);
      expect(occupiedPositions).toContain(1);
      expect(occupiedPositions.length).toBe(2);
    });

    it('should return an empty array if board is empty', () => {
      board.clear();
      const occupiedPositions = board.getOccupiedPositions();
      expect(occupiedPositions).toBeInstanceOf(Array);
      expect(occupiedPositions).toEqual([]);
      expect(occupiedPositions.length).toBe(0);
    });
  });

  describe('getAdjacentPositions', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
      board.place(2, piece);
    });

    it('should return an array of adjacent position indexes to occupied positions', () => {
      const adjacentPositions = board.getAdjacentPositions();
      expect(adjacentPositions).toBeInstanceOf(Array);
      expect(adjacentPositions).toEqual([1, 8, 3, 10, 11]);
    });

    it('should return an empty array if board is empty', () => {
      board.clear();
      const adjacentPositions = board.getAdjacentPositions();
      expect(adjacentPositions).toBeInstanceOf(Array);
      expect(adjacentPositions).toEqual([]);
      expect(adjacentPositions.length).toBe(0);
    });
  });

  describe('getAvailablePositions', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
    });

    it('should return an array of available position indexes (empty and adjacent to occupied)', () => {
      const availablePositions = board.getAvailablePositions();
      expect(availablePositions).toBeInstanceOf(Array);
      expect(availablePositions.length).toEqual(2);
      expect(availablePositions).toEqual([1, 8]);
    });

    it('should return an empty array if no positions are available', () => {
      board.clear();
      let availablePositions = board.getAvailablePositions();
      expect(availablePositions).toBeInstanceOf(Array);
      expect(availablePositions).toEqual([]);
      expect(availablePositions.length).toBe(0);
    });
  });

  describe('getHexagonPositions', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    it('should return an array of positions that can form hexagons', () => {
      const pieceForHexagon = new Piece(['blue', 'green']);
      board.place(0, piece);

      const hexagonPositions = board.getHexagonPositions(pieceForHexagon);
      expect(hexagonPositions).toBeInstanceOf(Array);
      expect(hexagonPositions.length).toEqual(1);
      expect(hexagonPositions[0][0]).toEqual(8);
      expect(hexagonPositions[0][1]).toEqual(1);
    });

    it('should throw an error if value is not a Piece instance', () => {
      expect(() => board.getHexagonPositions({})).toThrow(
        'Value must be an instance of Piece',
      );
      expect(() => board.getHexagonPositions('not a piece')).toThrow(
        'Value must be an instance of Piece',
      );
    });
  });

  describe('getHexagonsFormed', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    it('should return an array of formed hexagons when placing a piece', () => {
      const piece1 = new Piece(['red', 'green']);
      board.place(0, piece1);

      const pieceForHexagon = new Piece(['green', 'blue']);
      const hexagons = board.getHexagonsFormed(8, pieceForHexagon);

      expect(hexagons).toBeInstanceOf(Array);
      expect(hexagons.length).toEqual(1);
      if (hexagons.length > 0) {
        hexagons.forEach((hexagon) => {
          expect(hexagon).toBeInstanceOf(Object);
          expect(hexagon.coordinate.length).toBe(2);
          expect(hexagon.color).toBe('green');
        });
      }
    });

    it('should return an empty array if no hexagons are formed', () => {
      const hexagons = board.getHexagonsFormed(0, piece);
      expect(hexagons).toBeInstanceOf(Array);
      expect(hexagons).toEqual([]);
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.getHexagonsFormed(-1, piece)).toThrow(
        'Index out of bounds',
      );
      expect(() =>
        board.getHexagonsFormed(board.map.positions.length, piece),
      ).toThrow('Index out of bounds');
    });

    it('should throw an error if value is not a Piece instance', () => {
      expect(() => board.getHexagonsFormed(0, {})).toThrow(
        'Value must be an instance of Piece',
      );
      expect(() => board.getHexagonsFormed(0, 'not a piece')).toThrow(
        'Value must be an instance of Piece',
      );
    });
  });

  describe('countHexagonsFormed', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    it('should return the number of hexagons formed by placing a piece at a given index', () => {
      const hexagonsFormedCount = board.countHexagonsFormed(0, piece);
      expect(typeof hexagonsFormedCount).toBe('number');
      expect(hexagonsFormedCount).toEqual(0); // No hexagons formed on the first place
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.countHexagonsFormed(-1, piece)).toThrow(
        'Index out of bounds',
      );
      expect(() =>
        board.countHexagonsFormed(board.map.positions.length, piece),
      ).toThrow('Index out of bounds');
    });

    it('should throw an error if value is not a Piece instance', () => {
      expect(() => board.countHexagonsFormed(0, {})).toThrow(
        'Value must be an instance of Piece',
      );
      expect(() => board.countHexagonsFormed(0, 'not a piece')).toThrow(
        'Value must be an instance of Piece',
      );
    });
  });

  describe('isEmpty', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    it('should return true if position is empty', () => {
      expect(board.isEmpty(0)).toBe(true);
    });

    it('should return false if position is not empty', () => {
      board.place(0, piece);
      expect(board.isEmpty(0)).toBe(false);
    });

    it('should throw an error if index is out of bounds', () => {
      expect(() => board.isEmpty(-1)).toThrow('Index out of bounds');
      expect(() => board.isEmpty(board.map.positions.length)).toThrow(
        'Index out of bounds',
      );
    });
  });

  describe('isCompleteHexagon', () => {
    let board;

    beforeEach(() => {
      const piece1 = new Piece(['red', 'blue']);
      const piece2 = new Piece(['blue', 'green']);

      board = new Board();
      board.place(0, piece1);
      board.place(8, piece2);
    });

    it('should return true if hexagon is complete (all triangles same color)', () => {
      expect(board.isCompleteHexagon(1, 1)).toBe(true);
    });

    it('should return false if hexagon is not complete (triangles different colors)', () => {
      const testBoard = new Board();
      testBoard.grid.setHexagon(0, 0, [
        'red',
        'blue',
        'red',
        'red',
        'red',
        'red',
      ]);
      expect(testBoard.isCompleteHexagon(0, 0)).toBe(false);
    });

    it('should throw an error if column or row is out of bounds', () => {
      expect(() => board.isCompleteHexagon(-1, 0)).toThrow(
        'Column or row out of bounds',
      );
      expect(() => board.isCompleteHexagon(0, -1)).toThrow(
        'Column or row out of bounds',
      );
      expect(() => board.isCompleteHexagon(board.map.columns, 0)).toThrow(
        'Column or row out of bounds',
      );
      expect(() => board.isCompleteHexagon(0, board.map.rows)).toThrow(
        'Column or row out of bounds',
      );
    });
  });

  describe('getCompleteHexagons', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    it('should return an array of complete hexagon coordinates', () => {
      const testBoard = new Board();
      const piece1 = new Piece(['red', 'blue']);
      const piece2 = new Piece(['blue', 'green']);
      testBoard.place(0, piece1);
      testBoard.place(8, piece2);
      const completeHexagons = testBoard.getCompleteHexagons();
      expect(completeHexagons).toBeInstanceOf(Array);
      expect(completeHexagons).toEqual([
        {
          coordinate: [1, 1],
          color: 'blue',
        },
      ]);
    });

    it('should return an empty array if no complete hexagons', () => {
      const completeHexagons = board.getCompleteHexagons();
      expect(completeHexagons).toBeInstanceOf(Array);
      expect(completeHexagons).toEqual([]);
    });
  });

  describe('back', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
    });

    it('should undo the last move (place piece)', () => {
      board.back();
      expect(board.get(0)).toBeNull();
      expect(board.history.length).toBe(0);
    });

    it('should undo multiple steps if steps is specified', () => {
      const piece2 = new Piece(['green', 'yellow']);
      board.place(1, piece2);
      board.back(2);
      expect(board.get(0)).toBeNull();
      expect(board.get(1)).toBeNull();
      expect(board.history.length).toBe(0);
    });

    it('should not undo if history is empty', () => {
      board.back(2);
      const initialHistoryLength = board.history.length;
      board.back();
      expect(board.history.length).toBe(initialHistoryLength);
    });

    it('should return the number of steps undone', () => {
      expect(board.back()).toBe(1);
      expect(board.back(2)).toBe(0);
    });
  });

  describe('clone', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
    });

    it('should create a deep copy of the board', () => {
      const clonedBoard = board.clone();
      expect(clonedBoard).toBeInstanceOf(Board);
      expect(clonedBoard).not.toBe(board);
      expect(clonedBoard.map).toEqual(board.map);
      expect(clonedBoard.indexes).toEqual(board.indexes);
      expect(clonedBoard.grid).not.toBe(board.grid);
      expect(clonedBoard.grid).toEqual(board.grid);
    });

    it('should not include event listeners in the cloned board by default', () => {
      const listener = jest.fn();
      board.addEventListener('set', listener);
      const clonedBoard = board.clone();
      clonedBoard.set(1, new Piece(['green', 'yellow']));
      expect(listener).not.toHaveBeenCalled();
    });

    it('should include event listeners in the cloned board if specified', () => {
      const listener = jest.fn();
      board.addEventListener('set', listener);
      const clonedBoard = board.clone({ withListeners: true });
      clonedBoard.set(1, new Piece(['green', 'yellow']));
      expect(listener).toHaveBeenCalledWith(1, expect.any(Piece));
    });

    it('should not include history in the cloned board by default', () => {
      const clonedBoard = board.clone();
      expect(clonedBoard.history).toEqual([]);
    });

    it('should include history in the cloned board if specified', () => {
      const clonedBoard = board.clone({ withHistory: true });
      expect(clonedBoard.history).toEqual(board.history);
    });

    it('should reset the _isCountingHexagons flag in the cloned board', () => {
      board._isCountingHexagons = true;
      const clonedBoard = board.clone();
      expect(clonedBoard._isCountingHexagons).toBe(false);
    });
  });

  describe('clear', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
      board.hexagons.add('0-0');
      board.history.push({ op: 'set', index: 0 });
    });

    it('should clear the board and reset history and hexagons', () => {
      board.clear();
      expect(board.get(0)).toBeNull();
      expect(
        board.grid.getHexagon(
          board.map.positions[0][1][0],
          board.map.positions[0][1][1],
        ),
      ).toEqual([null, null, null, null, null, null]);
      expect(board.history).toEqual([]);
      expect(Array.from(board.hexagons)).toEqual([]);
    });
  });

  describe('Board Event Listeners', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
    });

    describe('addEventListener', () => {
      it('should add an event listener for a valid event type', () => {
        const listener = jest.fn();
        board.addEventListener('set', listener);
        board.set(0, piece);
        expect(listener).toHaveBeenCalledWith(0, piece);
      });

      it('should throw an error for an invalid event type', () => {
        const listener = jest.fn();
        expect(() => board.addEventListener('invalid', listener)).toThrow(
          'Invalid event type',
        );
      });
    });

    describe('removeEventListener', () => {
      it('should remove an event listener for a valid event type', () => {
        const listener = jest.fn();
        board.addEventListener('set', listener);
        board.removeEventListener('set', listener);
        board.set(0, piece);
        expect(listener).not.toHaveBeenCalled();
      });

      it('should throw an error for an invalid event type', () => {
        const listener = jest.fn();
        expect(() =>
          board.removeEventListener('invalid', listener),
        ).toThrow('Invalid event type');
      });
    });

    describe('Event Triggering', () => {
      it('should trigger "set" event when a piece is set', () => {
        const listener = jest.fn();
        board.addEventListener('set', listener);
        board.set(0, piece);
        expect(listener).toHaveBeenCalledWith(0, piece);
      });

      it('should trigger "remove" event when a piece is removed', () => {
        const listener = jest.fn();
        board.addEventListener('remove', listener);
        board.place(0, piece);
        board.remove(0);
        expect(listener).toHaveBeenCalledWith(0, piece);
      });

      it('should trigger "form" event when a hexagon is formed', () => {
        const listener = jest.fn();
        board.addEventListener('form', listener);
        const piece1 = new Piece(['red', 'green']);
        const piece2 = new Piece(['green', 'blue']);
        board.place(0, piece1);
        board.place(8, piece2);
        expect(listener).toHaveBeenCalledWith([
          { coordinate: [1, 1], color: 'green' },
        ]);
      });

      it('should trigger "destroy" event when a hexagon is destroyed', () => {
        const listener = jest.fn();
        board.addEventListener('destroy', listener);
        const piece1 = new Piece(['red', 'green']);
        const piece2 = new Piece(['green', 'blue']);
        board.place(0, piece1);
        board.place(8, piece2);
        board.remove(8);
        expect(listener).toHaveBeenCalledWith([[1, 1]]);
      });

      it('should trigger "clear" event when the board is cleared', () => {
        const listener = jest.fn();
        board.addEventListener('clear', listener);
        board.clear();
        expect(listener).toHaveBeenCalled();
      });

      it('should not trigger any events if is counting hexagons', () => {
        const piece1 = new Piece(['red', 'green']);
        board.place(0, piece1);

        const listener = jest.fn();
        board.addEventListener('set', listener);
        board.addEventListener('remove', listener);
        board.addEventListener('form', listener);
        board.addEventListener('destroy', listener);
        board.addEventListener('clear', listener);
        const piece2 = new Piece(['green', 'blue']);
        board.countHexagonsFormed(8, piece2); // This should not trigger any events
        expect(listener).not.toHaveBeenCalled();
      });
    });
  });

  describe('Board Serialization', () => {
    let board;
    let piece;

    beforeEach(() => {
      board = new Board();
      piece = new Piece(['red', 'blue']);
      board.place(0, piece);
    });

    describe('toJSON', () => {
      it('should serialize the board to JSON without history by default', () => {
        const json = board.toJSON();
        expect(json).toBeInstanceOf(Object);
        expect(json.map).toEqual(board.map);
        expect(json.grid).toEqual(board.grid);
        expect(json.indexes).toEqual(
          board.indexes.map((piece) => (piece ? piece.toJSON() : null)),
        );
        expect(json.hexagons).toEqual(Array.from(board.hexagons));
        expect(json.hexagonColors).toEqual(
          Array.from(board.hexagonColors.entries()),
        );
        expect(json.history).toEqual([]);
      });

      it('should serialize the board to JSON with history if specified', () => {
        const json = board.toJSON({ withHistory: true });
        expect(json.history).toEqual(
          board.history.map((action) => {
            if (action.op === 'remove') {
              return {
                ...action,
                value: action.value.toJSON(),
              };
            }
            return action;
          }),
        );
      });
    });

    describe('fromJSON', () => {
      it('should deserialize a board from JSON', () => {
        const json = board.toJSON({ withHistory: true });
        const deserializedBoard = Board.fromJSON(json);

        expect(deserializedBoard).toBeInstanceOf(Board);
        expect(deserializedBoard.map).toEqual(board.map);
        expect(deserializedBoard.grid).toEqual(board.grid);
        expect(deserializedBoard.indexes).toEqual(board.indexes);
        expect(deserializedBoard.hexagons).toEqual(board.hexagons);
        expect(deserializedBoard.hexagonColors).toEqual(board.hexagonColors);
        expect(deserializedBoard.history).toEqual(board.history);
      });

      it('should correctly deserialize pieces in the board', () => {
        const json = board.toJSON();
        const deserializedBoard = Board.fromJSON(json);

        expect(deserializedBoard.indexes[0]).toBeInstanceOf(Piece);
        expect(deserializedBoard.indexes[0].colors).toEqual(piece.colors);
      });
    });
  });
});
