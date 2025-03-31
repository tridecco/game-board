/**
 * @fileoverview Entry Point
 * @description This file serves as the entry point for the library.
 */

module.exports = {
  HexGrid: require('./hexGrid'),
  TriHexGrid: require('./triHexGrid'),
  Board: require('./board'),
  Piece: require('./piece'),
  maps: {
    default: require('../maps/default'),
  },
  TexturePack: require('./texturePack'),
};
