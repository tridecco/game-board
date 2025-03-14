/**
 * @fileoverview Triangular Hexagonal Grid (Based on HexGrid)
 * @description This file contains the implementation of a triangular hexagonal grid based on the HexGrid class.
 */

const HexGrid = require('./hexGrid');

const TRIANGLE_COUNT = 6; // Number of triangles in a hexagon

/**
 * @class TriHexGrid - A class representing a triangular hexagonal grid.
 */
class TriHexGrid extends HexGrid {
  /**
   * @constructor
   * @param {number} columns - The number of columns in the grid.
   * @param {number} rows - The number of rows in the grid.
   * @param {string} type - The type of the grid ('odd-r' or 'even-r' or 'odd-q' or 'even-q').
   */
  constructor(columns, rows, type) {
    super(columns, rows, type);
  }

  /**
   * @method get - Get the value at the specified column, row, and triangle.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @param {number} triangle - The triangle index (1-6).
   * @returns {*} - The value at the specified position and triangle.
   */
  get(col, row, triangle) {
    if (triangle < 1 || triangle > TRIANGLE_COUNT) {
      throw new Error('Triangle index must be between 1 and 6');
    }

    const hex = super.get(col, row);
    return hex ? hex.triangles[String(triangle)] || null : null;
  }

  /**
   * @method set - Set the value at the specified column, row, and triangles.
   * @param {Array<Array<number>>} positions - The positions to set the value, each position is [col, row, triangle].
   * @param {*} value - The value to set.
   */
  set(positions, value) {
    positions.forEach(([col, row, triangle]) => {
      if (triangle < 1 || triangle > TRIANGLE_COUNT) {
        throw new Error('Triangle index must be between 1 and 6');
      }

      const hex = super.get(col, row) || { triangles: {} };
      hex.triangles[String(triangle)] = value;
      super.set(col, row, hex);
    });
  }

  /**
   * @method remove - Remove the value at the specified column, row, and triangles.
   * @param {Array<Array<number>>} positions - The positions to remove the value, each position is [col, row, triangle].
   * @returns {Array<*>} - The removed values.
   */
  remove(positions) {
    return positions.map(([col, row, triangle]) => {
      if (triangle < 1 || triangle > TRIANGLE_COUNT) {
        throw new Error('Triangle index must be between 1 and 6');
      }

      const hex = super.get(col, row);
      if (!hex) {
        return null;
      }

      const value = hex.triangles[String(triangle)] || null;
      delete hex.triangles[String(triangle)];
      if (Object.keys(hex.triangles).length === 0) {
        super.set(col, row, null);
      } else {
        super.set(col, row, hex);
      }
      return value;
    });
  }

  /**
   * @method getHexagon - Get all the values of the hexagon at the specified column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {Array<*>} - The values of the hexagon.
   */
  getHexagon(col, row) {
    const hex = super.get(col, row);
    if (!hex) {
      return Array(TRIANGLE_COUNT).fill(null);
    }

    return Array.from(
      { length: TRIANGLE_COUNT },
      (_, i) => hex.triangles[String(i + 1)] || null,
    );
  }

  /**
   * @method setHexagon - Set the values of the hexagon at the specified column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @param {Array<*>} values - The values of the hexagon.
   */
  setHexagon(col, row, values) {
    const hex = super.get(col, row) || { triangles: {} };
    values.forEach((value, i) => {
      hex.triangles[String(i + 1)] = value;
    });
    super.set(col, row, hex);
  }

  /**
   * @method removeHexagon - Remove all the values of the hexagon at the specified column and row.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {Array<*>} - The removed values.
   */
  removeHexagon(col, row) {
    const hex = super.get(col, row);
    if (!hex) {
      return Array(TRIANGLE_COUNT).fill(null);
    }

    const values = Array.from(
      { length: TRIANGLE_COUNT },
      (_, i) => hex.triangles[String(i + 1)] || null,
    );
    super.set(col, row, null);
    return values;
  }

  /**
   * @method isFull - Check if all the triangles of the hexagon at the specified column and row are filled.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {boolean} - True if all the triangles are filled, false otherwise.
   */
  isFull(col, row) {
    const hex = super.get(col, row);
    return hex ? Object.keys(hex.triangles).length === TRIANGLE_COUNT : false;
  }

  /**
   * @method clone - Create a deep copy of the grid.
   * @returns {TriHexGrid} - A new instance of TriHexGrid with the same values as the current grid.
   */
  clone() {
    const newGrid = new TriHexGrid(this.columns, this.rows, this.type);

    newGrid.grid = this.grid.map((row) => {
      return row.map((hex) => {
        if (!hex) {
          return null;
        }

        const newHex = { triangles: {} };
        Object.keys(hex.triangles).forEach((triangle) => {
          newHex.triangles[triangle] = hex.triangles[triangle];
        });

        return newHex;
      });
    });

    return newGrid;
  }
}

module.exports = TriHexGrid;
