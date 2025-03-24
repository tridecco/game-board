/**
 * @fileoverview Tests for Game Piece
 * @description This file contains unit tests for the Piece class.
 */

const Piece = require('../').Piece;

describe('Piece', () => {
  describe('constructor', () => {
    it('should create a Piece instance with valid colors', () => {
      const piece = new Piece(['red', 'blue']);
      expect(piece).toBeInstanceOf(Piece);
      expect(piece.colors).toEqual(['red', 'blue']);
      expect(piece.colorsKey).toBe('red-blue');
    });

    it('should create a Piece instance with valid colors and params', () => {
      const params = { name: 'Test Piece', value: 10 };
      const piece = new Piece(['green', 'yellow'], params);
      expect(piece).toBeInstanceOf(Piece);
      expect(piece.colors).toEqual(['green', 'yellow']);
      expect(piece.colorsKey).toBe('green-yellow');
      expect(piece.name).toBe('Test Piece');
      expect(piece.value).toBe(10);
    });

    it('should throw an error if colors is not an array', () => {
      expect(() => new Piece('red-blue')).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece({})).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece(123)).toThrowError(
        'colors must be an array of strings',
      );
    });

    it('should throw an error if colors array does not have exactly 2 elements', () => {
      expect(() => new Piece(['red'])).toThrowError(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
      expect(() => new Piece(['red', 'blue', 'green'])).toThrowError(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
      expect(() => new Piece([])).toThrowError(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
    });

    it('should throw an error if colors array contains non-string elements', () => {
      expect(() => new Piece(['red', 123])).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece([123, 'blue'])).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece([{}, 'blue'])).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece(['red', {}])).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece([null, 'blue'])).toThrowError(
        'colors must be an array of strings',
      );
      expect(() => new Piece(['red', null])).toThrowError(
        'colors must be an array of strings',
      );
    });

    it('should throw an error if params is not an object', () => {
      expect(() => new Piece(['red', 'blue'], 'string param')).toThrowError(
        'params must be an object',
      );
      expect(() => new Piece(['red', 'blue'], 123)).toThrowError(
        'params must be an object',
      );
      expect(() => new Piece(['red', 'blue'], [])).toThrowError(
        'params must be an object',
      );
      expect(() => new Piece(['red', 'blue'], null)).not.toThrowError(
        'params must be an object',
      );
    });
  });

  describe('equals', () => {
    it('should return true if two pieces have the same colors', () => {
      const piece1 = new Piece(['red', 'blue']);
      const piece2 = new Piece(['red', 'blue']);
      expect(piece1.equals(piece2)).toBe(true);
    });

    it('should return true if two pieces have the same colors in different order', () => {
      const piece1 = new Piece(['red', 'blue']);
      const piece2 = new Piece(['blue', 'red']);
      expect(piece1.equals(piece2)).toBe(false);
    });

    it('should return false if two pieces have different colors', () => {
      const piece1 = new Piece(['red', 'blue']);
      const piece2 = new Piece(['green', 'yellow']);
      expect(piece1.equals(piece2)).toBe(false);
    });

    it('should return false if other is not a Piece instance', () => {
      const piece1 = new Piece(['red', 'blue']);
      expect(piece1.equals({})).toBe(false);
      expect(piece1.equals('not a piece')).toBe(false);
      expect(piece1.equals(null)).toBe(false);
      expect(piece1.equals(undefined)).toBe(false);
    });
  });
});
