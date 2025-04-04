/**
 * @fileoverview Game Board
 * @description This file contains the implementation of the Tridecco game board.
 */

const TriHexGrid = require('./triHexGrid');
const Piece = require('./piece');

const defaultMap = require('../maps/board/default');

/**
 * @class Board - A class representing the game board.
 */
class Board {
  /**
   * @constructor
   * @param {Object} map - The map object containing the board configuration and positions.
   * @throws {Error} - Throws an error if the map is invalid or not provided.
   */
  constructor(map = defaultMap) {
    if (!map) {
      throw new Error('Map is required to initialize the board');
    }

    if (!map || !map.type || !map.columns || !map.rows || !map.positions) {
      throw new Error('Invalid map provided');
    }

    this.map = map;
    this.grid = new TriHexGrid(map.columns, map.rows, map.type);
    this.indexes = new Array(map.positions.length).fill(null); // Initialize indexes to null

    this.hexagons = new Set();
    this.hexagonsColor = new Map(); // Map to store hexagon colors

    this.eventListeners = {
      set: new Set(), // Listeners for set events
      remove: new Set(), // Listeners for remove events
      form: new Set(), // Listeners for form events (when a hexagon is formed)
      destroy: new Set(), // Listeners for destroy events (when a hexagon is destroyed)
      clear: new Set(), // Listeners for clear events (when the board is cleared)
    };
    this._isCountingHexagons = false; // Flag to prevent event triggering during hexagon counting

    this.history = new Array();
  }

  /**
   * @property {Object} POSITION_INDEXES - The indexes for the position in the map.
   */
  static POSITION_INDEXES = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
  };

  /**
   * @method _triggerEvent - Trigger an event for a specific action.
   * @param {string} eventType - The type of event to trigger (set, remove, form, destroy, clear).
   * @param {...any} args - The arguments to pass to the event listeners.
   */
  _triggerEvent(eventType, ...args) {
    if (this.eventListeners[eventType]) {
      if (this._isCountingHexagons) {
        // Prevent triggering events when counting hexagons
        return;
      }

      this.eventListeners[eventType].forEach((listener) => {
        listener(...args);
      });
    }
  }

  /**
   * @method get - Get the value at the specified position in the map.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @returns {Piece} - The value at the specified position or null if not found.
   * @throws {Error} - Throws an error if the index is out of bounds.
   */
  get(index) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    return this.indexes[index];
  }

  /**
   * @method set - Set the value at the specified position in the map.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @param {Piece} value - The value to set at the specified position.
   * @throws {Error} - Throws an error if the index is out of bounds or if the value is not an instance of Piece.
   */
  set(index, value) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    if (!(value instanceof Piece)) {
      throw new Error('Value must be an instance of Piece');
    }

    const position = this.map.positions[index];

    this.indexes[index] = value;

    const relatedHexagons = this.getRelatedHexagons(index);

    this.grid.set(
      [
        position[Board.POSITION_INDEXES.A],
        position[Board.POSITION_INDEXES.B],
        position[Board.POSITION_INDEXES.C],
        position[Board.POSITION_INDEXES.D],
      ],
      value.colors[0],
    );
    this.grid.set(
      [
        position[Board.POSITION_INDEXES.E],
        position[Board.POSITION_INDEXES.F],
        position[Board.POSITION_INDEXES.G],
        position[Board.POSITION_INDEXES.H],
      ],
      value.colors[1],
    );

    relatedHexagons.forEach((hexagon) => {
      const [col, row] = hexagon.split('-').map(Number);
      if (this.isCompleteHexagon(col, row)) {
        this.hexagons.add(`${col}-${row}`);
        this.hexagonsColor.set(
          `${col}-${row}`,
          this.grid.getHexagon(col, row)[0],
        );
      }
    });

    this.history.push({
      op: 'set',
      index: index,
    });

    this._triggerEvent('set', index, value); // Trigger set event
  }

  /**
   * @method place - Place a piece at the specified position in the map.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @param {Piece} value - The piece to place at the specified position.
   * @returns {Array<Object>} - An array of objects representing the hexagons formed, each with coordinate and color.
   * @throws {Error} - Throws an error if the index is out of bounds, the position is occupied, or the value is not an instance of Piece.
   */
  place(index, value) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    if (this.indexes[index]) {
      throw new Error('Position already occupied');
    }

    if (!(value instanceof Piece)) {
      throw new Error('Value must be an instance of Piece');
    }

    const hexagonsBefore = new Set(this.hexagons);

    this.set(index, value);

    const newHexagons = Array.from(this.hexagons).filter(
      (hexagon) => !hexagonsBefore.has(hexagon),
    );

    const hexagonsFormed = newHexagons.map((hexagon) => {
      return {
        coordinate: hexagon.split('-').map(Number),
        color: this.hexagonsColor.get(hexagon), // Get the color of the hexagon
      };
    });

    if (newHexagons.length > 0) {
      // If new hexagons are formed, trigger the form event
      this._triggerEvent('form', hexagonsFormed); // Trigger form event for new hexagons formed
    }

    return hexagonsFormed;
  }

  /**
   * @method remove - Remove the value at the specified position in the map.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @returns {Piece} - The removed value at the specified position or null if not found.
   * @throws {Error} - Throws an error if the index is out of bounds.
   */
  remove(index) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    const position = this.map.positions[index];

    const removedHexagons = this.getRelatedHexagons(index); // All related hexagons will be removed

    this.grid.remove([
      position[Board.POSITION_INDEXES.A],
      position[Board.POSITION_INDEXES.B],
      position[Board.POSITION_INDEXES.C],
      position[Board.POSITION_INDEXES.D],
      position[Board.POSITION_INDEXES.E],
      position[Board.POSITION_INDEXES.F],
      position[Board.POSITION_INDEXES.G],
      position[Board.POSITION_INDEXES.H],
    ]);

    removedHexagons.forEach((hexagon) => {
      const destroyedHexagon = hexagon.split('-').map(Number);

      this.hexagons.delete(destroyedHexagon);
      this.hexagonsColor.delete(hexagon); // Remove the color of the hexagon

      this._triggerEvent('destroy', destroyedHexagon); // Trigger destroy event for each hexagon removed
    });

    const removedValue = this.indexes[index];

    this.history.push({
      op: 'remove',
      index: index,
      value: removedValue,
    });

    this.indexes[index] = null;

    this._triggerEvent('remove', index, removedValue); // Trigger remove event

    return removedValue;
  }

  /**
   * @method getRelatedHexagons - Get all the related hexagons for a given position.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @returns {Array<string>} - An array of related hexagons, each represented as a string in the format "col-row" (key).
   * @throws {Error} - Throws an error if the index is out of bounds.
   */
  getRelatedHexagons(index) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    const position = this.map.positions[index];

    const hexagons = new Set();
    for (let i = 1; i <= Board.POSITION_INDEXES.F; i++) {
      const hexagon = position[i];
      if (hexagon) {
        const hexagonKey = `${hexagon[0]}-${hexagon[1]}`;
        hexagons.add(hexagonKey);
      }
    }

    return Array.from(hexagons);
  }

  /**
   * @method getRandomPosition - Get a random position from the map.
   * @param {boolean} [isEdge=false] - Whether to include edge positions.
   * @param {Array} [excludedIndexes=[]] - An array of indexes to exclude from the random selection.
   * @returns {number} - A random index from the map. If no valid position is found, returns -1.
   */
  getRandomPosition(isEdge = false, excludedIndexes = []) {
    const excludedSet = new Set(excludedIndexes);
    const validIndexes = [];

    this.map.positions.forEach((position, index) => {
      if (!excludedSet.has(index) && (!isEdge || position.isEdge)) {
        validIndexes.push(index);
      }
    });

    if (validIndexes.length === 0) {
      const NOT_FOUND = -1;
      return NOT_FOUND;
    }

    return validIndexes[Math.floor(Math.random() * validIndexes.length)];
  }

  /**
   * @method getEmptyPositions - Get all empty positions from the map.
   * @returns {Array<number>} - An array of indexes representing empty positions.
   */
  getEmptyPositions() {
    const emptyPositions = [];
    this.indexes.forEach((value, index) => {
      if (value === null) {
        emptyPositions.push(index);
      }
    });

    return emptyPositions;
  }

  /**
   * @method getOccupiedPositions - Get all occupied positions from the map.
   * @returns {Array<number>} - An array of indexes representing occupied positions.
   */
  getOccupiedPositions() {
    const emptyPositions = this.getEmptyPositions();
    const emptySet = new Set(emptyPositions);
    const occupiedPositions = [];
    this.indexes.forEach((_, index) => {
      if (!emptySet.has(index)) {
        occupiedPositions.push(index);
      }
    });

    return occupiedPositions;
  }

  /**
   * @method getAdjacentPositions - Get all adjacent positions for a given position.
   * @returns {Array<number>} - An array of indexes representing adjacent positions.
   */
  getAdjacentPositions() {
    const occupiedPositions = this.getOccupiedPositions();

    const adjacentPositions = new Set();
    occupiedPositions.forEach((index) => {
      const position = this.map.positions[index];
      position.adjacents.forEach((adjacentIndex) => {
        adjacentPositions.add(adjacentIndex);
      });
    });

    return Array.from(adjacentPositions);
  }

  /**
   * @method getAvailablePositions - Get all available positions from the map. (empty && adjacent)
   * @returns {Array<number>} - An array of indexes representing available positions.
   */
  getAvailablePositions() {
    const emptyPositions = this.getEmptyPositions();
    const adjacentPositionsSet = new Set(this.getAdjacentPositions());

    return emptyPositions.filter((index) => adjacentPositionsSet.has(index));
  }

  /**
   * @method getHexagonPositions - Get positions that can form a hexagon.
   * @param {Piece} piece - The piece to place at the specified position.
   * @returns {Array<Array<number>>} - An array of positions (indexes) that can form a hexagon with how many hexagons can be formed.
   * @throws {Error} - Throws an error if the piece is not an instance of Piece or if the index is out of bounds.
   */
  getHexagonPositions(piece) {
    if (!(piece instanceof Piece)) {
      throw new Error('Value must be an instance of Piece');
    }

    const availablePositions = this.getAvailablePositions();

    const HEXAGON_FORMED_INDEX = 1;

    return availablePositions
      .map((index) => {
        const hexagonsFormed = this.countHexagonsFormed(index, piece);
        return [index, hexagonsFormed]; // Return index and how many hexagons can be formed
      })
      .filter((position) => position[HEXAGON_FORMED_INDEX] > 0) // Filter out positions that cannot form a hexagon
      .sort((a, b) => {
        return b[HEXAGON_FORMED_INDEX] - a[HEXAGON_FORMED_INDEX]; // Sort by the number of hexagons formed
      }); // Sort by the number of hexagons formed
  }

  /**
   * @method countHexagonsFormed - Count how many hexagons can be formed with a piece at the specified position.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @param {Piece} piece - The piece to place at the specified position.
   * @returns {number} - The number of hexagons that can be formed.
   * @throws {Error} - Throws an error if the index is out of bounds or if the piece is not an instance of Piece.
   */
  countHexagonsFormed(index, piece) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    if (!(piece instanceof Piece)) {
      throw new Error('Value must be an instance of Piece');
    }

    this._isCountingHexagons = true; // Set a flag to indicate we are counting hexagons to avoid triggering events

    const hexagonsFormed = this.place(index, piece);

    this.back(1); // Undo the placement to avoid side effects

    this._isCountingHexagons = false; // Reset the flag

    return hexagonsFormed.length;
  }

  /**
   * @method isEmpty - Check if the specified position is empty.
   * @param {number} index - The index of the position in the map. (0-based index)
   * @returns {boolean} - True if the position is empty, false otherwise.
   * @throws {Error} - Throws an error if the index is out of bounds.
   */
  isEmpty(index) {
    if (index < 0 || index >= this.map.positions.length) {
      throw new Error('Index out of bounds');
    }

    return this.indexes[index] === null;
  }

  /**
   * @method isCompleteHexagon - Check if the specified hexagon is complete (same color).
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {boolean} - True if the hexagon is complete, false otherwise.
   * @throws {Error} - Throws an error if the column or row is out of bounds.
   */
  isCompleteHexagon(col, row) {
    if (col < 0 || col >= this.map.columns || row < 0 || row >= this.map.rows) {
      throw new Error('Column or row out of bounds');
    }

    const hexagonColors = this.grid.getHexagon(col, row);

    for (let i = 1; i < hexagonColors.length; i++) {
      if (
        hexagonColors[i] === null ||
        hexagonColors[i - 1] === null ||
        hexagonColors[i] !== hexagonColors[i - 1]
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * @method getCompleteHexagons - Get all complete hexagons on the board.
   * @returns {Array<Object>} - An array of objects representing complete hexagons, each with coordinate and color.
   */
  getCompleteHexagons() {
    return Array.from(this.hexagons).map((hexagon) => {
      return {
        coordinate: hexagon.split('-').map(Number),
        color: this.hexagonsColor.get(hexagon), // Get the color of the hexagon
      };
    });
  }

  /**
   * @method addEventListener - Add an event listener for a specific event type.
   * @param {string} eventType - The type of event to listen for (set, remove, form, destroy).
   * @param {Function} listener - The listener function to be called when the event is triggered.
   * @throws {Error} - Throws an error if the event type is invalid.
   */
  addEventListener(eventType, listener) {
    if (!this.eventListeners[eventType]) {
      throw new Error('Invalid event type');
    }

    this.eventListeners[eventType].add(listener);
  }

  /**
   * @method removeEventListener - Remove an event listener for a specific event type.
   * @param {string} eventType - The type of event to stop listening for (set, remove, form, destroy).
   * @param {Function} listener - The listener function to remove.
   * @throws {Error} - Throws an error if the event type is invalid.
   */
  removeEventListener(eventType, listener) {
    if (!this.eventListeners[eventType]) {
      throw new Error('Invalid event type');
    }

    this.eventListeners[eventType].delete(listener);
  }

  /**
   * @method back - Undo the last move.
   * @param {number} [steps=1] - The number of steps to undo.
   * @returns {number} - The number of steps undone.
   */
  back(steps = 1) {
    if (steps <= 0) {
      return 0;
    }

    steps = Math.min(steps, this.history.length);

    for (let i = 0; i < steps; i++) {
      const lastAction = this.history.pop();
      if (!lastAction) {
        break;
      }

      if (lastAction.op === 'set') {
        this.remove(lastAction.index);
        this.history.pop(); // Remove the remove action from the history
      } else if (lastAction.op === 'remove') {
        this.set(lastAction.index, lastAction.value);
      }
    }
    return steps;
  }

  /**
   * @method clear - Clear the board and reset the history.
   */
  clear() {
    this.grid.clear();
    this.indexes.fill(null);
    this.hexagons.clear();
    this.hexagonsColor.clear(); // Clear the hexagon colors
    this.history = [];

    this._triggerEvent('clear'); // Trigger clear event
  }
}

module.exports = Board;
