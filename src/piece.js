/**
 * @fileoverview Game Piece
 * @description This file contains the implementation of a Tridecco game piece.
 */

const deepClone = require('./utils/deepClone');

/**
 * @class Piece - A class representing the game piece.
 */
class Piece {
  /**
   * @constructor
   * @param {Array<string>} colors - The colors of the piece.
   * @param {Object} [params={}] - Optional parameters for the piece.
   * @throws {Error} - If colors is not an array of 2 strings or if params is not an object.
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

  /**
   * @method clone - Create a deep copy of the piece.
   * @returns {Piece} - A new instance of Piece with the same properties.
   */
  clone() {
    return deepClone(this);
  }

  /**
   * @method toJSON - Convert the piece to a JSON representation.
   * @returns {Object} - The JSON representation of the piece.
   */
  toJSON() {
    const newPiece = this.clone();
    const { colors, colorsKey, ...customProperties } = newPiece;
    return { colors, customProperties };
  }

  /**
   * @method fromJSON - Create a piece from a JSON representation.
   * @param {Object} json - The JSON representation of the piece.
   * @returns {Piece} - A new instance of Piece.
   */
  static fromJSON(json) {
    const { colors, customProperties } = json;
    return new Piece(colors, customProperties);
  }
}

module.exports = Piece;
