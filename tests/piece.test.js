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
      expect(() => new Piece('red-blue')).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece({})).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece(123)).toThrow(
        'colors must be an array of strings',
      );
    });

    it('should throw an error if colors array does not have exactly 2 elements', () => {
      expect(() => new Piece(['red'])).toThrow(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
      expect(() => new Piece(['red', 'blue', 'green'])).toThrow(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
      expect(() => new Piece([])).toThrow(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
    });

    it('should throw an error if colors array contains non-string elements', () => {
      expect(() => new Piece(['red', 123])).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece([123, 'blue'])).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece([{}, 'blue'])).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece(['red', {}])).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece([null, 'blue'])).toThrow(
        'colors must be an array of strings',
      );
      expect(() => new Piece(['red', null])).toThrow(
        'colors must be an array of strings',
      );
    });

    it('should throw an error if params is not an object', () => {
      expect(() => new Piece(['red', 'blue'], 'string param')).toThrow(
        'params must be an object',
      );
      expect(() => new Piece(['red', 'blue'], 123)).toThrow(
        'params must be an object',
      );
      expect(() => new Piece(['red', 'blue'], [])).toThrow(
        'params must be an object',
      );
      expect(() => new Piece(['red', 'blue'], null)).not.toThrow(
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

  describe('clone', () => {
    it('should create a deep copy of the piece', () => {
      const params = { name: 'Original Piece', value: 20 };
      const piece = new Piece(['red', 'blue'], params);
      const clonedPiece = piece.clone();

      expect(clonedPiece).toBeInstanceOf(Piece);
      expect(clonedPiece).not.toBe(piece);
      expect(clonedPiece.colors).toEqual(piece.colors);
      expect(clonedPiece.colorsKey).toBe(piece.colorsKey);
      expect(clonedPiece.name).toBe(piece.name);
      expect(clonedPiece.value).toBe(piece.value);
    });

    it('should not affect the original piece when modifying the clone', () => {
      const params = { name: 'Original Piece', value: 20 };
      const piece = new Piece(['red', 'blue'], params);
      const clonedPiece = piece.clone();

      clonedPiece.name = 'Modified Piece';
      clonedPiece.colors[0] = 'green';

      expect(piece.name).toBe('Original Piece');
      expect(piece.colors).toEqual(['red', 'blue']);
    });
  });

  describe('toJSON', () => {
    it('should return a JSON representation of the piece', () => {
      const params = { name: 'Test Piece', value: 15 };
      const piece = new Piece(['red', 'blue'], params);
      const json = piece.toJSON();

      expect(json).toEqual({
        colors: ['red', 'blue'],
        customProperties: { name: 'Test Piece', value: 15 },
      });
    });

    it('should not include colorsKey in the JSON representation', () => {
      const piece = new Piece(['green', 'yellow']);
      const json = piece.toJSON();

      expect(json).not.toHaveProperty('colorsKey');
    });
  });

  describe('fromJSON', () => {
    it('should create a Piece instance from a valid JSON representation', () => {
      const json = {
        colors: ['red', 'blue'],
        customProperties: { name: 'Test Piece', value: 15 },
      };
      const piece = Piece.fromJSON(json);

      expect(piece).toBeInstanceOf(Piece);
      expect(piece.colors).toEqual(['red', 'blue']);
      expect(piece.colorsKey).toBe('red-blue');
      expect(piece.name).toBe('Test Piece');
      expect(piece.value).toBe(15);
    });

    it('should throw an error if colors is missing in the JSON representation', () => {
      const json = { customProperties: { name: 'Test Piece', value: 15 } };
      expect(() => Piece.fromJSON(json)).toThrow(
        'colors must be an array of strings',
      );
    });

    it('should throw an error if colors in the JSON representation is invalid', () => {
      const json = {
        colors: ['red'],
        customProperties: { name: 'Test Piece', value: 15 },
      };
      expect(() => Piece.fromJSON(json)).toThrow(
        'colors must be an array of 2 strings representing the colors of the piece',
      );
    });

    it('should handle an empty customProperties object in the JSON representation', () => {
      const json = { colors: ['red', 'blue'], customProperties: {} };
      const piece = Piece.fromJSON(json);

      expect(piece).toBeInstanceOf(Piece);
      expect(piece.colors).toEqual(['red', 'blue']);
      expect(piece.colorsKey).toBe('red-blue');
    });
  });
});
