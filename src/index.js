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
    board: {
      default: require('../maps/board/default'),
    },
    renderer: {
      default: require('../maps/renderer/default'),
    },
  },
  TexturePack: require('./texturePack'),
  Renderer: require('./renderer'),
};
