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
    this.grid = new Array(rows);
    for (let r = 0; r < rows; r++) {
      this.grid[r] = new Array(columns).fill(null);
    }

    if (!['odd-r', 'even-r', 'odd-q', 'even-q'].includes(type)) {
      throw new Error('Invalid grid type');
    }
    this.type = type;
  }

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
    const ADD_ONE = +1;
    const SUB_ONE = -1;
    const NO_CHANGE = 0;

    let directions;
    switch (this.type) {
      case 'odd-r':
        directions = [
          [
            [SUB_ONE, SUB_ONE],
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
          ], // Even rows
          [
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [ADD_ONE, ADD_ONE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
          ], // Odd rows
        ];
        break;
      case 'even-r':
        directions = [
          [
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [ADD_ONE, ADD_ONE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
          ], // Even rows
          [
            [SUB_ONE, SUB_ONE],
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
          ], // Odd rows
        ];
        break;
      case 'odd-q':
        directions = [
          [
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
            [SUB_ONE, SUB_ONE],
          ], // Even columns
          [
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [ADD_ONE, ADD_ONE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
          ], // Odd columns
        ];
        break;
      case 'even-q':
        directions = [
          [
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [ADD_ONE, ADD_ONE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
          ], // Even columns
          [
            [NO_CHANGE, SUB_ONE],
            [ADD_ONE, SUB_ONE],
            [ADD_ONE, NO_CHANGE],
            [NO_CHANGE, ADD_ONE],
            [SUB_ONE, NO_CHANGE],
            [SUB_ONE, SUB_ONE],
          ], // Odd columns
        ];
        break;
      default:
        throw new Error('Invalid grid type');
    }

    const adjacents = [];

    const TWO = 2;
    const isOdd = (this.type.includes('r') ? row : col) % TWO !== 0;
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
