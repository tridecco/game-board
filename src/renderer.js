/**
 * @fileoverview Game Renderer
 * @description This file contains the implementation of a game board renderer for the Tridecco game.
 */

const DEFAULT_ASSETS_URL =
  'https://cdn.jsdelivr.net/gh/tridecco/game-board@0.4.2/assets/';

const Board = require('./board');
const TexturePack = require('./texturePack');

const defaultMap = require('../maps/renderer/default');

/**
 * @class LayersManager - A class to manage layers in the game board.
 */
class LayersManager {
  /**
   * @constructor
   * @param {HTMLCanvasContext} context - The main canvas context for rendering.
   * @throws {Error} - If the context is not a CanvasRenderingContext2D instance.
   */
  constructor(context) {
    if (!(context instanceof CanvasRenderingContext2D)) {
      throw new Error('context must be a CanvasRenderingContext2D instance');
    }
    this.context = context;
    this.layers = [];
  }

  /**
   * @method addLayer - Adds a new layer to the layers manager.
   * @param {Object} layer - The layer to be added.
   * @param {string} layer.name - The name of the layer.
   * @param {number} [layer.zIndex=0] - The z-index of the layer. (negative values will not be rendered)
   * @param {Function} layer.render - The render function for the layer.
   * @throws {Error} - If the layer is not an object, or if the render function is not a function, or if the name is not a string.
   */
  addLayer(layer) {
    if (typeof layer !== 'object' || layer === null) {
      throw new Error('layer must be an object');
    }
    if (typeof layer.render !== 'function') {
      throw new Error('layer.render must be a function');
    }
    if (typeof layer.name !== 'string') {
      throw new Error('layer.name must be a string');
    }

    layer.zIndex = layer.zIndex || 0;

    layer.context = new OffscreenCanvas(1, 1).getContext('2d');
    layer.context.canvas.width = this.context.canvas.width;
    layer.context.canvas.height = this.context.canvas.height;

    this.layers.push(layer);
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * @method removeLayer - Removes a layer from the layers manager.
   * @param {string} layerName - The name of the layer to be removed.
   * @throws {Error} - If the layerName is not a string.
   */
  removeLayer(layerName) {
    if (typeof layerName !== 'string') {
      throw new Error('layerName must be a string');
    }
    this.layers = this.layers.filter((layer) => layer.name !== layerName);
  }

  /**
   * @method render - Renders all layers in the correct order.
   */
  render() {
    this.layers.forEach((layer) => {
      if (layer.zIndex >= 0) {
        layer.render(layer.context);
        this.context.drawImage(layer.context.canvas, 0, 0);
      }
    });
  }
}
