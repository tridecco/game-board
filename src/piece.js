/**
 * @fileoverview Game Piece
 * @description This file contains the implementation of a Tridecco game piece.
 */

/**
 * @class Piece - A class representing the game piece.
 */
class Piece {
  /**
   * @constructor
   * @param {Array<string>} colors - The colors of the piece.
   * @param {Object} [params={}] - Optional parameters for the piece.
   * @throws {Error} If colors is not an array of 2 strings or if params is not an object.
   */
  constructor(colors, params = {}) {
    const PIECE_COLOR_COUNT = 2;

    if (!Array.isArray(colors)) {
      throw new Error('colors must be an array of strings');
    }
    if (colors.length !== PIECE_COLOR_COUNT) {
      throw new Error(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
    }
    if (colors.some((color) => typeof color !== 'string')) {
      throw new Error('colors must be an array of strings');
    }

    if (params && (typeof params !== 'object' || Array.isArray(params))) {
      throw new Error('params must be an object and not an array');
    }

    Object.assign(this, params);
    this.colors = colors;
    this.colorsKey = colors.join('-');
  }

  /**
   * @method equals - Check if two pieces are equal. (compares colors)
   * @param {Piece} other - The other piece to compare with.
   * @returns {boolean} - True if the pieces are equal, false otherwise.
   */
  equals(other) {
    if (!(other instanceof Piece)) {
      return false;
    }

    return this.colorsKey === other.colorsKey;
  }
}

module.exports = Piece;
