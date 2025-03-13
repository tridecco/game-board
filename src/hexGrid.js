/**
 * @fileoverview Hexagonal Grid (Offset Coordinates)
 * @description This file contains the implementation of a hexagonal grid using offset coordinates.
 */

/**
 * @class HexGrid - A class representing a hexagonal grid.
 */
class HexGrid {
  /**
   * @constructor
   * @param {number} columns - The number of columns in the grid.
   * @param {number} rows - The number of rows in the grid.
   * @param {string} type - The type of the grid ('odd-r' or 'even-r' or 'odd-q' or 'even-q').
   */
  constructor(columns, rows, type) {
    if (!['odd-r', 'even-r', 'odd-q', 'even-q'].includes(type)) {
      throw new Error('Invalid grid type');
    }
    this.type = type;

    this.grid = new Array(rows);
    for (let r = 0; r < rows; r++) {
      this.grid[r] = new Array(columns).fill(null);
    }
  }

  /**
   * @property {Object} DIRECTIONS - The directions for adjacent hexes based on the grid type.
   */
  static DIRECTIONS = {
    'odd-r': [
      [
        [-1, -1],
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 1],
        [-1, 0],
      ], // Even rows
      [
        [0, -1],
        [1, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 0],
      ], // Odd rows
    ],
    'even-r': [
      [
        [0, -1],
        [1, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 0],
      ], // Even rows
      [
        [-1, -1],
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 1],
        [-1, 0],
      ], // Odd rows
    ],
    'odd-q': [
      [
        [0, -1],
        [1, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
        [-1, -1],
      ], // Even columns
      [
        [0, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
      ], // Odd columns
    ],
    'even-q': [
      [
        [0, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
      ], // Even columns
      [
        [0, -1],
        [1, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
        [-1, -1],
      ], // Odd columns
    ],
  };

  /**
   * @method get - Get the value at the specified column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {*} - The value at the specified position.
   */
  get(col, row) {
    if (
      row < 0 ||
      row >= this.grid.length ||
      col < 0 ||
      col >= this.grid[row].length
    ) {
      return null;
    }
    return this.grid[row][col];
  }

  /**
   * @method set - Set the value at the specified column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @param {*} value - The value to set.
   */
  set(col, row, value) {
    if (
      row < 0 ||
      row >= this.grid.length ||
      col < 0 ||
      col >= this.grid[row].length
    ) {
      return;
    }
    this.grid[row][col] = value;
  }

  /**
   * @method remove - Remove the value at the specified column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {*} - The removed value.
   */
  remove(col, row) {
    if (
      row < 0 ||
      row >= this.grid.length ||
      col < 0 ||
      col >= this.grid[row].length
    ) {
      return null;
    }
    const value = this.grid[row][col];
    this.grid[row][col] = null;
    return value;
  }

  /**
   * @method getAdjacents - Get the adjacent hexes for a given column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {Array} - An array of adjacent hexes.
   */
  getAdjacents(col, row) {
    const directions = HexGrid.DIRECTIONS[this.type];
    if (!directions) {
      throw new Error('Invalid grid type');
    }

    const adjacents = [];
    const isOdd = (this.type.includes('r') ? row : col) % 2 !== 0;
    const dirSet = isOdd ? directions[1] : directions[0];

    for (const [dCol, dRow] of dirSet) {
      const newCol = col + dCol;
      const newRow = row + dRow;
      const value = this.get(newCol, newRow);
      if (value !== null) {
        adjacents.push({ col: newCol, row: newRow, value: value });
      }
    }

    return adjacents;
  }

  /**
   * @method forEach - Iterate over each hex in the grid.
   * @param {Function} callback - The function to call for each hex.
   */
  forEach(callback) {
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        callback(this.get(c, r), c, r);
      }
    }
  }

  /**
   * @method clone - Create a deep copy of the grid.
   * @returns {HexGrid} - A new HexGrid instance with the same values.
   */
  clone() {
    const newGrid = new HexGrid(
      this.grid[0].length,
      this.grid.length,
      this.type,
    );

    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        newGrid.set(c, r, this.get(c, r));
      }
    }

    return newGrid;
  }

  /**
   * @method clear - Clear the grid.
   */
  clear() {
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        this.grid[r][c] = null;
      }
    }
  }
}

module.exports = HexGrid;
