/**
 * @fileoverview Game Renderer
 * @description This file contains the implementation of a game board renderer for the Tridecco game.
 */

const DEFAULT_ASSETS_URL =
  'https://cdn.jsdelivr.net/gh/tridecco/game-board@0.4.2/assets/';

const Board = require('./board');
const TexturePack = require('./texturePack');

const defaultMap = require('../maps/renderer/default');

const ONE_SECOND = 1000;

const FPS_MAX_SAMPLES = 30;
const FPS_BOX_HORIZONTAL_PADDING = 12;
const FPS_TEXT_HORIZONTAL_OFFSET = 6;
const FPS_TEXT_VERTICAL_OFFSET = 4;

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
   * @param {number} layer.fps - The desired frames per second for the layer's rendering.
   * @param {number} [layer.zIndex=0] - The z-index of the layer. (negative values will not be rendered)
   * @param {Function} layer.render - The render function for the layer.
   * @returns {HTMLCanvasContext} - The context of the layer.
   * @throws {Error} - If the layer is not an object, or if the name is not a string, or if the fps is not a number, or if the render function is not a function.
   */
  addLayer(layer) {
    if (typeof layer !== 'object' || layer === null) {
      throw new Error('layer must be an object');
    }
    if (typeof layer.name !== 'string') {
      throw new Error('layer.name must be a string');
    }
    if (typeof layer.fps !== 'number') {
      throw new Error('layer.fps must be a number');
    }
    if (typeof layer.render !== 'function') {
      throw new Error('layer.render must be a function');
    }

    layer.zIndex = layer.zIndex || 0;

    layer.context = new OffscreenCanvas(
      this.context.canvas.width,
      this.context.canvas.height,
    ).getContext('2d');

    layer._frameInterval = ONE_SECOND / layer.fps;
    layer._lastRender = 0;

    this.layers.push(layer);
    this.layers.sort((a, b) => a.zIndex - b.zIndex);

    return layer.context;
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
   * @param {boolean} [force=false] - Whether to force rendering all layers. (use when resizing the canvas)
   */
  render(force = false) {
    const now = performance.now();
    this.context.clearRect(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height,
    );

    for (const layer of this.layers) {
      if (layer.zIndex < 0) continue;

      const elapsed = now - (layer._lastRender || 0);

      if (force || elapsed >= layer._frameInterval) {
        layer.context.clearRect(
          0,
          0,
          layer.context.canvas.width,
          layer.context.canvas.height,
        );

        layer.render({
          context: layer.context,
          deltaTime: elapsed,
          layer,
          timestamp: now,
        });

        layer._lastRender = now;
      }

      this.context.drawImage(layer.context.canvas, 0, 0);
    }
  }

  /**
   * @method resize - Resizes all layers to match the main canvas size.
   */
  resize() {
    for (const layer of this.layers) {
      layer.context.canvas.width = this.context.canvas.width;
      layer.context.canvas.height = this.context.canvas.height;
    }

    this.render(true); // Force render after resizing
  }
}

/**
 * @class AssetsManager - A class to manage game assets.
 */
class AssetsManager {
  /**
   * @constructor
   * @param {string} texturesIndexUrl - The URL of the texture index JSON file.
   * @param {string} texturesAtlasUrl - The URL of the atlas image file.
   * @param {string} backgroundUrl - The URL of the background image file.
   * @param {string} gridUrl - The URL of the grid image file.
   */
  constructor(texturesIndexUrl, texturesAtlasUrl, backgroundUrl, gridUrl) {
    this.urls = {
      texturesIndex: texturesIndexUrl,
      texturesAtlas: texturesAtlasUrl,
      background: backgroundUrl,
      grid: gridUrl,
    };

    this.textures = null;
    this.background = null;
    this.grid = null;
  }

  /**
   * @method load - Loads all assets required for the game.
   * @returns {Promise} - A promise that resolves when all assets are loaded.
   */
  async load() {
    const texturePromise = new Promise((resolve, reject) => {
      this.textures = new TexturePack(
        this.urls.texturesIndex,
        this.urls.texturesAtlas,
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    const backgroundPromise = new Promise((resolve, reject) => {
      this.background = new Image();
      this.background.onload = () => resolve();
      this.background.onerror = reject;
      this.background.src = this.urls.background;
    });

    const gridPromise = new Promise((resolve, reject) => {
      this.grid = new Image();
      this.grid.onload = () => resolve();
      this.grid.onerror = reject;
      this.grid.src = this.urls.grid;
    });

    return Promise.all([texturePromise, backgroundPromise, gridPromise]);
  }
}

/**
 * @class FPSTracker - A class to track and display the frames per second (FPS) of the game.
 */
class FPSTracker {
  /**
   * @constructor
   * @param {HTMLCanvasContext} context - The canvas context to draw the FPS on.
   */
  constructor(context) {
    if (!(context instanceof CanvasRenderingContext2D)) {
      throw new Error('context must be a CanvasRenderingContext2D instance');
    }

    this.context = context;
    this.samples = [];
    this.maxSamples = FPS_MAX_SAMPLES;
    this.lastTick = null;
    this.fps = 0;
  }

  /**
   * @method tick - Call this method once per frame to record a tick.
   */
  tick() {
    const now = performance.now();
    if (this.lastTick !== null) {
      const delta = now - this.lastTick;
      this.samples.push(delta);
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
      const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
      this.fps = avg > 0 ? ONE_SECOND / avg : 0;
    }
    this.lastTick = now;
  }

  /**
   * @method render - Draws the FPS counter at the bottom right corner.
   */
  render() {
    const ctx = this.context;
    const text = `FPS: ${this.fps.toFixed(1)}`;
    ctx.save();
    ctx.font = '14px monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const padding = 8;
    const x = ctx.canvas.width - padding;
    const boxWidth = metrics.width + FPS_BOX_HORIZONTAL_PADDING;
    ctx.fillRect(x - boxWidth, y - boxHeight, boxWidth, boxHeight);
    ctx.fillStyle = '#fff';
    ctx.fillText(
      text,
      x - FPS_TEXT_HORIZONTAL_OFFSET,
      y - FPS_TEXT_VERTICAL_OFFSET,
    );
    ctx.fillRect(x - boxWidth, y - boxHeight, boxWidth, boxHeight);
    ctx.fillStyle = '#fff';
    ctx.fillText(
      text,
      x - FPS_TEXT_HORIZONTAL_OFFSET,
      y - FPS_TEXT_VERTICAL_OFFSET,
    );
    ctx.restore();
  }
}
