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
const PI_DEGREES = 180;
const HALF = 0.5;

const FPS_UPDATE_FPS = 30;

const FPS_MAX_SAMPLES = 30;
const FPS_BOX_HORIZONTAL_PADDING = 12;
const FPS_TEXT_HORIZONTAL_OFFSET = 6;
const FPS_TEXT_VERTICAL_OFFSET = 4;

const NOT_FOUND = -1;

const DEFAULT_PREVIEW_FILL_COLOR = 'rgba(255, 255, 255, 0.5)';
const DEFAULT_AVAILABLE_POSITIONS_OVERLAY_FILL_COLOR = 'rgba(0, 0, 0, 0.5)';

const MAX_PIECE_ID_RGB = 0xffffff;
const MAX_COLOR_COMPONENT = 0xff;
const BITS_PER_BYTE = 8;
const BITS_PER_TWO_BYTES = 16;
const COLOR_GAP_FACTOR = 10;

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
   * @param {number} layer.fps - The desired frames per second for the layer's rendering. (0 means only render when requested)
   * @param {number} [layer.zIndex=0] - The z-index of the layer. (negative values will not be rendered in the main canvas)
   * @param {Function} layer.render - The render function for the layer.
   * @param {Object} [layer.options] - Additional options for the layer.
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
    ).getContext('2d', layer.options || {});

    layer._frameInterval = layer.fps === 0 ? 0 : ONE_SECOND / layer.fps;
    layer._lastRender = 0;
    layer._firstRender = 0;

    this.layers.push(layer);
    this.layers.sort((a, b) => a.zIndex - b.zIndex);

    this.frameRequested = {};

    return layer.context;
  }

  /**
   * @method getLayer - Retrieves a layer by its name.
   * @param {string} layerName - The name of the layer to retrieve.
   * @returns {Object|null} - The layer object if found, otherwise null.
   * @throws {Error} - If the layerName is not a string.
   */
  getLayer(layerName) {
    if (typeof layerName !== 'string') {
      throw new Error('layerName must be a string');
    }

    const layer = this.layers.find((l) => l.name === layerName);
    return layer || null;
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
    delete this.frameRequested[layerName];
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
      const elapsed = now - (layer._lastRender || 0);

      if (force || elapsed >= layer._frameInterval) {
        if (force || layer._frameInterval !== 0) {
          layer.context.clearRect(
            0,
            0,
            layer.context.canvas.width,
            layer.context.canvas.height,
          );

          layer.render({
            context: layer.context,
            deltaTime: elapsed,
            elapsed: now - layer._firstRender,
            layer,
            timestamp: now,
          });

          layer._lastRender = now;
          if (layer._firstRender === 0) {
            layer._firstRender = now;
          }
        }

        this.frameRequested[layer.name]?.forEach((callback) => {
          if (typeof callback === 'function') {
            callback(layer.context);
          }
        });
        this.frameRequested[layer.name]?.clear();
      }

      if (layer.zIndex < 0) continue;

      this.context.drawImage(layer.context.canvas, 0, 0);
    }
  }

  /**
   * @method requestAnimationFrame - Requests the next animation frame for a specific layer.
   * @param {string} layerName - The name of the layer to render.
   * @param {Function} callback - The callback to be executed on the next frame.
   * @throws {Error} - If the layer does not exist or if the callback is not a function.
   */
  requestAnimationFrame(layerName, callback) {
    if (typeof layerName !== 'string') {
      throw new Error('layerName must be a string');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    const layer = this.layers.find((l) => l.name === layerName);
    if (!layer) {
      throw new Error(`Layer "${layerName}" does not exist`);
    }

    if (!this.frameRequested[layerName]) {
      this.frameRequested[layerName] = new Set();
    }
    this.frameRequested[layerName].add(callback);
  }

  /**
   * @method clear - Clears a specific layer's context.
   * @param {string} layerName - The name of the layer to clear.
   * @throws {Error} - If the layerName is not a string or if the layer does not exist.
   */
  clear(layerName) {
    if (typeof layerName !== 'string') {
      throw new Error('layerName must be a string');
    }
    const layer = this.layers.find((l) => l.name === layerName);
    if (!layer) {
      throw new Error(`Layer "${layerName}" does not exist`);
    }

    layer.context.clearRect(
      0,
      0,
      layer.context.canvas.width,
      layer.context.canvas.height,
    );
  }

  /**
   * @method clearAll - Clears all layers' contexts.
   */
  clearAll() {
    for (const layer of this.layers) {
      layer.context.clearRect(
        0,
        0,
        layer.context.canvas.width,
        layer.context.canvas.height,
      );
    }
  }

  /**
   * @method resize - Resizes all layers to match the main canvas size.
   */
  resize() {
    for (const layer of this.layers) {
      layer.context.canvas.width = this.context.canvas.width;
      layer.context.canvas.height = this.context.canvas.height;
      layer.context.scale(
        window.devicePixelRatio || 1,
        window.devicePixelRatio || 1,
      );
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

  /**
   * @method updateTextures - Updates the texture pack.
   * @param {string} texturesIndexUrl - The new URL of the texture index JSON file.
   * @param {string} texturesAtlasUrl - The new URL of the atlas image file.
   * @returns {Promise} - A promise that resolves when the texture pack is updated.
   */
  async updateTextures(texturesIndexUrl, texturesAtlasUrl) {
    this.urls.texturesIndex = texturesIndexUrl;
    this.urls.texturesAtlas = texturesAtlasUrl;

    return new Promise((resolve, reject) => {
      this.textures = new TexturePack(
        texturesIndexUrl,
        texturesAtlasUrl,
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });
  }

  /**
   * @method updateBackground - Updates the background image.
   * @param {string} backgroundUrl - The new URL of the background image file.
   * @returns {Promise} - A promise that resolves when the background is updated.
   */
  async updateBackground(backgroundUrl) {
    this.urls.background = backgroundUrl;

    return new Promise((resolve, reject) => {
      this.background = new Image();
      this.background.onload = () => resolve();
      this.background.onerror = reject;
      this.background.src = backgroundUrl;
    });
  }

  /**
   * @method updateGrid - Updates the grid image.
   * @param {string} gridUrl - The new URL of the grid image file.
   * @returns {Promise} - A promise that resolves when the grid is updated.
   */
  async updateGrid(gridUrl) {
    this.urls.grid = gridUrl;

    return new Promise((resolve, reject) => {
      this.grid = new Image();
      this.grid.onload = () => resolve();
      this.grid.onerror = reject;
      this.grid.src = gridUrl;
    });
  }
}

/**
 * @class FPSTracker - A class to track and display the frames per second (FPS) of the game.
 */
class FPSTracker {
  /**
   * @constructor
   * @param {HTMLCanvasContext} context - The canvas context to draw the FPS on.
   * @throws {Error} - If the context is not a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D instance.
   */
  constructor(context) {
    if (
      !(
        context instanceof CanvasRenderingContext2D ||
        context instanceof OffscreenCanvasRenderingContext2D
      )
    ) {
      throw new Error(
        'context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D instance',
      );
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
    const y = ctx.canvas.height - padding;
    const metrics = ctx.measureText(text);
    const boxWidth = metrics.width + FPS_BOX_HORIZONTAL_PADDING;
    const boxHeight = 24;
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

/**
 * @class Renderer - The main game renderer class.
 */
class Renderer {
  /**
   * @constructor
   * @param {Object} options - Options for the renderer.
   * @param {Board} options.board - The game board instance.
   * @param {HTMLElement} options.container - The DOM element to be used for rendering the board.
   * @param {Object} options.map - The map to be used for rendering the board.
   * @param {string} options.texturesIndexUrl - The URL of the texture index JSON file.
   * @param {string} options.texturesAtlasUrl - The URL of the atlas image file.
   * @param {string} options.backgroundUrl - The URL of the background image file.
   * @param {string} options.gridUrl - The URL of the grid image file.
   * @param {boolean} [options.showFPS=false] - Whether to show the FPS counter.
   * @throws {Error} - If board is not an instance of Board, if container is not an HTMLElement, or if map is not a valid map object, or if texturesIndexUrl, texturesAtlasUrl, backgroundUrl, or gridUrl are not strings, or if the callback is not a function, or if the environment is not a browser.
   */
  constructor(
    {
      board,
      container,
      map = defaultMap,
      texturesIndexUrl = DEFAULT_ASSETS_URL +
        'textures-bundle/classic/normal/index.json',
      texturesAtlasUrl = DEFAULT_ASSETS_URL +
        'textures-bundle/classic/normal/atlas.webp',
      backgroundUrl = DEFAULT_ASSETS_URL + 'backgrounds/wooden-board.jpg',
      gridUrl = DEFAULT_ASSETS_URL + 'grids/black.png',
      showFPS = false,
    },
    callback = () => {},
  ) {
    if (!(board instanceof Board)) {
      throw new Error('board must be an instance of Board');
    }
    if (!(container instanceof HTMLElement)) {
      throw new Error('container must be an HTMLElement');
    }
    if (typeof map !== 'object' || map === null) {
      throw new Error('map must be a valid map object');
    }
    if (typeof texturesIndexUrl !== 'string') {
      throw new Error('texturesIndexUrl must be a string');
    }
    if (typeof texturesAtlasUrl !== 'string') {
      throw new Error('texturesAtlasUrl must be a string');
    }
    if (typeof backgroundUrl !== 'string') {
      throw new Error('backgroundUrl must be a string');
    }
    if (typeof gridUrl !== 'string') {
      throw new Error('gridUrl must be a string');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    if (typeof window === 'undefined') {
      throw new Error('Renderer can only be used in a browser environment');
    }

    this._showFPS = showFPS;

    this._board = board;
    this._layersManager;
    this._assetsManager;
    this._fpsTracker;

    this._map = map;

    this._container = container;
    this._canvas;
    this._context;

    this._renderingLoopId = null;

    this._width;
    this._height;
    this._ratio;
    this._widthRatio;
    this._heightRatio;
    this._dpr;

    this._resizeObserverInitialized = false;
    this._resizeObserver = new ResizeObserver(() => {
      if (!this._resizeObserverInitialized) {
        this._resizeObserverInitialized = true;
        return; // Skip the first call to avoid unnecessary rendering
      }

      this._triggerEventListeners('resize', {
        canvas: {
          width: this._canvas.width,
          height: this._canvas.height,
        },
        container: {
          width: this._container.clientWidth,
          height: this._container.clientHeight,
        },
      });

      this._initDimensions(true); // Reinitialize dimensions on resize
    });
    this._resizeObserver.observe(this._container);

    this._mutationObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach((removedNode) => {
            if (
              removedNode === this._canvas ||
              removedNode === this._container
            ) {
              this.destroy();
            }
          });
        }
      }
    });
    this._mutationObserver.observe(
      this._container.parentNode || this._container,
      {
        childList: true,
        subtree: true,
      },
    );

    this._eventListeners = {
      dragover: new Set(), // Listeners for dragover events
      dragoverAvailable: new Set(), // Listeners for dragover events with available positions
      drop: new Set(), // Listeners for drop events
      dropAvailable: new Set(), // Listeners for drop events with available positions
      mousemove: new Set(), // Listeners for hover events
      mousemoveAvailable: new Set(), // Listeners for hover events with available positions
      click: new Set(), // Listeners for click events
      clickAvailable: new Set(), // Listeners for click events with available positions
      resize: new Set(), // Listeners for resize events
    };

    this._eventHandlers = new Map();

    this._flashingPositions = new Map();

    this._previewingPositions = new Map();
    this._previewingHexagonPositions = new Map();
    this._showingAvailablePositions = new Set();
    this._showingAvailablePositionsOverlayFillColor;

    this._isDestroyed = false;

    this._init({
      texturesIndexUrl,
      texturesAtlasUrl,
      backgroundUrl,
      gridUrl,
    })
      .then(() => {
        callback(null, this);
      })
      .catch((error) => {
        console.error('Error initializing Renderer:', error);
        callback(error, null);
      });
  }

  /**
   * @method _init - Initializes the renderer by setting up assets, event listeners, dimensions, layers, and FPS tracking.
   * @param {Object} assetsUrls - An object containing the URLs of the assets to be loaded.
   * @returns {Promise} - A promise that resolves when all initialization steps are complete.
   */
  async _init(assetsUrls) {
    await this._initAssets(assetsUrls);
    this._initDimensions();
    this._initEventListeners();
    this._initEventHandlers();
    this._initLayers();
    this._initFPS();

    this._layersManager.render(true); // Force render all layers to initialize the canvas
    this._startRenderingLoop();
  }

  /**
   * @method _initAssets - Initializes the assets manager and loads all required assets.
   * @param {Object} assetsUrls - An object containing the URLs of the assets to be loaded.
   * @returns {Promise} - A promise that resolves when all assets are loaded.
   * @throws {Error} - If there is an error loading the assets.
   */
  async _initAssets(assetsUrls) {
    this._assetsManager = new AssetsManager(
      assetsUrls.texturesIndexUrl,
      assetsUrls.texturesAtlasUrl,
      assetsUrls.backgroundUrl,
      assetsUrls.gridUrl,
    );

    try {
      await this._assetsManager.load();
    } catch (error) {
      console.error('Error loading assets:', error);
      throw error;
    }
  }

  /**
   * @method _initEventListeners - Initializes event listeners for the renderer.
   */
  _initEventListeners() {
    const eventConfigs = [
      { type: 'dragover', preventDefault: true },
      { type: 'drop', preventDefault: true },
      { type: 'click', preventDefault: false },
      { type: 'mousemove', preventDefault: false },
    ];

    eventConfigs.forEach(({ type, preventDefault }) => {
      this._canvas.addEventListener(type, (event) => {
        const dpr = this._dpr;
        const coords = {
          x: event.offsetX * dpr,
          y: event.offsetY * dpr,
        };

        if (preventDefault) {
          event.preventDefault();
        }

        const positionIndex = this._getPositionFromHitmap(
          this._layersManager.getLayer('hitmap').context,
          coords.x,
          coords.y,
        );
        this._triggerEventListeners(type, positionIndex);

        const availablePositionIndex = this._getPositionFromHitmap(
          this._layersManager.getLayer('hitmap').context,
          coords.x,
          coords.y,
          true,
        );
        if (availablePositionIndex !== NOT_FOUND) {
          this._triggerEventListeners(
            `${type}Available`,
            availablePositionIndex,
          );
        }
      });
    });
  }

  /**
   * @method _triggerEventListeners - Triggers all event listeners for a specific event type.
   * @param {string} eventType - The type of the event to trigger.
   * @param {...*} args - Additional arguments to pass to the event listeners.
   */
  _triggerEventListeners(eventType, ...args) {
    if (this._eventListeners[eventType]) {
      this._eventListeners[eventType].forEach((listener) => {
        listener(...args);
      });
    }
  }

  /**
   * @method _initEventHandlers - Sets up the board event listeners for rendering.
   */
  _initEventHandlers() {
    const renderPiece = function renderPiece(index, piece) {
      this._layersManager.requestAnimationFrame('pieces', (context) => {
        this._renderPiece(
          context,
          index,
          piece.colorsKey,
          this._map.tiles[index].flipped,
        );
      });
    }.bind(this);

    const reRenderPieces = function reRenderPieces() {
      this._layersManager.requestAnimationFrame('pieces', (context) => {
        this._layersManager.clear('pieces');
        this._renderPlacedPieces(context);
      });
    }.bind(this);

    const clearBoard = function clearBoard() {
      this._layersManager.requestAnimationFrame('pieces', () => {
        this._layersManager.clear('pieces');
      });
      this._layersManager.requestAnimationFrame('hexagons', () => {
        this._layersManager.clear('hexagons');
      });
      this._layersManager.requestAnimationFrame('preview-pieces', () => {
        this._layersManager.clear('available-positions');
      });
    }.bind(this);

    this._board.addEventListener('set', renderPiece);
    this._board.addEventListener('remove', reRenderPieces);
    this._board.addEventListener('clear', clearBoard);

    this._eventHandlers.set('set', renderPiece);
    this._eventHandlers.set('remove', reRenderPieces);
    this._eventHandlers.set('clear', clearBoard);
  }

  /**
   * @method _initDimensions - Initializes the dimensions of the canvas and container.
   * @param {boolean} [isResizing=false] - Whether the dimensions are being initialized during a resize event.
   */
  _initDimensions(isResizing = false) {
    if (!isResizing) {
      this._canvas = document.createElement('canvas');
      this._container.appendChild(this._canvas);
      this._container.style.position = 'relative';
      this._context = this._canvas.getContext('2d');
    }

    const containerWidth = this._container.clientWidth;
    const containerHeight = this._container.clientHeight;
    const mapRatio = this._map.width / this._map.height;
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > mapRatio) {
      canvasHeight = containerHeight;
      canvasWidth = canvasHeight * mapRatio;
    } else {
      canvasWidth = containerWidth;
      canvasHeight = canvasWidth / mapRatio;
    }

    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = canvasWidth * dpr;
    this._canvas.height = canvasHeight * dpr;
    this._canvas.style.width = `${canvasWidth}px`;
    this._canvas.style.height = `${canvasHeight}px`;

    this._context.scale(dpr, dpr);

    const leftOffset = (containerWidth - canvasWidth) / HALF;
    const topOffset = (containerHeight - canvasHeight) / HALF;
    this._canvas.style.position = 'absolute';
    this._canvas.style.left = `${leftOffset}px`;
    this._canvas.style.top = `${topOffset}px`;

    if (isResizing) {
      this._layersManager.resize();
    }

    this._width = canvasWidth;
    this._height = canvasHeight;
    this._ratio = mapRatio;
    this._widthRatio = canvasWidth / this._map.width;
    this._heightRatio = canvasHeight / this._map.height;
    this._dpr = dpr;
  }

  /**
   * @method _initLayers - Initializes the layers manager and adds all necessary layers.
   */
  _initLayers() {
    this._layersManager = new LayersManager(this._context);

    this._layersManager.addLayer({
      name: 'background',
      fps: 0,
      zIndex: 1,
      render: ({ context }) => {
        this._renderBackground(context);
      },
    });

    this._layersManager.addLayer({
      name: 'grid',
      fps: 0,
      zIndex: 2,
      render: ({ context }) => {
        this._renderGrid(context);
      },
    });

    this._layersManager.addLayer({
      name: 'pieces',
      fps: 0,
      zIndex: 3,
      render: ({ context }) => {
        this._renderPlacedPieces(context);
      },
    });

    this._layersManager.addLayer({
      name: 'hexagons',
      fps: this._assetsManager.textures.get('hexagons', 'loop').fps,
      zIndex: 4,
      render: ({ context, elapsed }) => {
        this._layersManager.clear('hexagons');
        this._renderFormedHexagonsFrame(context, elapsed);
      },
    });

    this._layersManager.addLayer({
      name: 'preview-pieces',
      fps: 0,
      zIndex: 5,
      render: ({ context }) => {
        this._renderPreviewingPiecePositions(context);
      },
    });

    this._layersManager.addLayer({
      name: 'preview-hexagons',
      fps: 0,
      zIndex: 6,
      render: ({ context }) => {
        this._renderPreviewingHexagonPositions(context);
      },
    });

    this._layersManager.addLayer({
      name: 'preview-hexagons-partial',
      fps: this._assetsManager.textures.get('hexagons', 'partial').fps,
      zIndex: 7,
      render: ({ context, elapsed }) => {
        this._layersManager.clear('preview-hexagons-partial');
        this._renderPreviewingHexagonPartialPositionsFrame(context, elapsed);
      },
    });

    this._layersManager.addLayer({
      name: 'available-positions',
      fps: 0,
      zIndex: 8,
      render: ({ context }) => {
        this._renderShowingAvailablePositions(context);
      },
    });

    this._layersManager.addLayer({
      name: 'fps',
      fps: this._showFPS ? FPS_UPDATE_FPS : 0,
      zIndex: 9,
      render: () => {
        if (this._showFPS && this._fpsTracker) {
          this._layersManager.clear('fps');
          this._fpsTracker.render();
        }
      },
    });

    this._layersManager.addLayer({
      name: 'hitmap',
      fps: 0,
      zIndex: -1, // Negative zIndex to not render in the main canvas
      render: ({ context }) => {
        this._renderHitmap(context);
      },
    });

    this._layersManager.addLayer({
      name: 'temporary',
      fps: 0,
      zIndex: -1, // Negative zIndex to not render in the main canvas,
    });
  }

  /**
   * @method _initFPS - Initializes the FPS tracker.
   */
  _initFPS() {
    this._fpsTracker = new FPSTracker(
      this._layersManager.getLayer('fps').context,
    );
  }

  /**
   * @method _startRenderingLoop - Starts the rendering loop for the game.
   */
  _startRenderingLoop() {
    if (this._renderingLoopId) {
      return; // Rendering loop already started
    }

    const render = () => {
      this._layersManager.render();
      this._fpsTracker.tick();
      this._renderingLoopId = requestAnimationFrame(render);
    };
    this._renderingLoopId = requestAnimationFrame(render);
  }

  /**
   * @method _stopRenderingLoop - Stops the rendering loop for the game.
   */
  _stopRenderingLoop() {
    if (this._renderingLoopId) {
      cancelAnimationFrame(this._renderingLoopId);
      this._renderingLoopId = null;
    }
  }

  /**
   * @method _renderBackground - Renders the background image on a canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the background on.
   */
  _renderBackground(context) {
    const bgWidth = this._assetsManager.background.width;
    const bgHeight = this._assetsManager.background.height;
    const bgRatio = bgWidth / bgHeight;

    let bgDrawWidth, bgDrawHeight, bgOffsetX, bgOffsetY;

    if (this._width / this._height > bgRatio) {
      bgDrawWidth = this._width;
      bgDrawHeight = this._width / bgRatio;
      bgOffsetX = 0;
      bgOffsetY = (this._height - bgDrawHeight) * HALF;
    } else {
      bgDrawHeight = this._height;
      bgDrawWidth = this._height * bgRatio;
      bgOffsetX = (this._width - bgDrawWidth) * HALF;
      bgOffsetY = 0;
    }

    context.drawImage(
      this._assetsManager.background,
      bgOffsetX,
      bgOffsetY,
      bgDrawWidth,
      bgDrawHeight,
    );
  }

  /**
   * @method _renderGrid - Renders the grid image on a canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the grid on.
   */
  _renderGrid(context) {
    const gridWidth = this._assetsManager.grid.width;
    const gridHeight = this._assetsManager.grid.height;
    const gridRatio = gridWidth / gridHeight;

    let gridDrawWidth, gridDrawHeight, gridOffsetX, gridOffsetY;

    if (this._width / this._height > gridRatio) {
      gridDrawHeight = this._height;
      gridDrawWidth = this._height * gridRatio;
      gridOffsetX = (this._width - gridDrawWidth) / HALF;
      gridOffsetY = 0;
    } else {
      gridDrawWidth = this._width;
      gridDrawHeight = this._width / gridRatio;
      gridOffsetX = 0;
      gridOffsetY = (this._height - gridDrawHeight) / HALF;
    }

    context.drawImage(
      this._assetsManager.grid,
      gridOffsetX,
      gridOffsetY,
      gridDrawWidth,
      gridDrawHeight,
    );
  }

  /**
   * @method _renderPiece - Renders a piece on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the piece on.
   * @param {number} index - The index of the piece to render, corresponding to its position in the board's index array.
   * @param {string} colorsKey - The color key of the piece, used to retrieve the correct texture.
   * @param {boolean} flipped - A boolean indicating if the piece should be rendered flipped.
   * @param {string} [fillColor] - Optional fill color to override texture colors, used for hitmap rendering.
   * @throws {Error} - If the index is out of bounds or if the texture for the piece is not found.
   */
  _renderPiece(context, colorsKey, flipped, fillColor) {
    const tile = this._map.tiles[index];
    if (!tile) {
      throw new Error(`Tile index ${index} out of bounds`);
    }

    const textureKey = flipped ? `${colorsKey}-flipped` : colorsKey;
    const texture = this._assetsManager.textures.get('tiles', textureKey);
    if (!texture) {
      throw new Error(`Texture key "${textureKey}" not found in textures`);
    }
    const { image: textureImage, definition } = texture;

    const x = tile.x * this._widthRatio;
    const y = tile.y * this._heightRatio;
    const imageWidth = definition.w;
    const imageHeight = definition.h;

    let width, height;
    if (tile.width !== undefined && tile.width !== null) {
      width = tile.width * this._widthRatio;
      tile.height !== undefined && tile.height !== null
        ? tile.height * this._heightRatio
        : (width * imageHeight) / imageWidth;
    } else if (tile.height !== undefined && tile.height !== null) {
      height = tile.height * this._heightRatio;
      width = (height * imageWidth) / imageHeight;
    } else {
      width = imageWidth * this._widthRatio;
      height = imageHeight * this._heightRatio;
    }

    const rotation = tile.rotation || 0;
    const angle = (rotation * Math.PI) / PI_DEGREES;

    context.save();
    context.translate(x + width * HALF, y + height * HALF);
    context.rotate(angle);

    if (fillColor) {
      const tempContext = this._layersManager.getLayer('temporary').context;

      tempContext.drawImage(
        textureImage,
        definition.x,
        definition.y,
        definition.w,
        definition.h,
        -width * HALF,
        -height * HALF,
        width,
        height,
      );

      tempContext.globalCompositeOperation = 'source-in';
      tempContext.fillStyle = fillColor;
      tempContext.fillRect(-width * HALF, -height * HALF, width, height);

      tempContext.globalCompositeOperation = 'source-over';

      context.drawImage(
        tempContext.canvas,
        -width * HALF,
        -height * HALF,
        width,
        height,
      );
    } else {
      context.drawImage(
        textureImage,
        definition.x,
        definition.y,
        definition.w,
        definition.h,
        -width * HALF,
        -height * HALF,
        width,
        height,
      );
    }

    context.restore();
  }

  /**
   * @method _renderHexagon - Renders a hexagon on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the hexagon on.
   * @param {Array<number>} coordinate - The column and row coordinate of the hexagon to render.
   * @param {Object} texture - The texture object containing the hexagon texture image and its definition.
   * @param {number} [scale=1] - The scale factor for the hexagon size.
   * @throws {Error} - If the hexagon coordinate is not found in the map.
   */
  _renderHexagon(context, coordinate, texture, scale = 1) {
    const hexagon = this._map.hexagons[`${coordinate[0]}-${coordinate[1]}`];
    if (!hexagon) {
      throw new Error(`Hexagon coordinate ${coordinate} not found in map`);
    }

    const { textureImage: image, definition } = texture;

    const x = hexagon.x * this._widthRatio;
    const y = hexagon.y * this._heightRatio;
    const imageWidth = definition.w;
    const imageHeight = definition.h;

    const width = hexagon.width
      ? hexagon.width * this._widthRatio * scale
      : (hexagon.height * this._heightRatio * scale * imageWidth) / imageHeight;
    const height = hexagon.height
      ? hexagon.height * this._heightRatio * scale
      : (hexagon.width * this._widthRatio * scale * imageHeight) / imageWidth;

    context.drawImage(
      image,
      definition.x,
      definition.y,
      definition.w,
      definition.h,
      x - width * HALF,
      y - height * HALF,
      width,
      height,
    );
  }

  /**
   * @method _renderPreviewPiece - Renders a preview piece on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the preview piece on.
   * @param {number} index - The index of the piece to render, corresponding to its position in the board's index array.
   * @param {Piece} piece - The Piece object to be previewed.
   * @param {string} [fillColor] - Optional fill color to override texture colors, used for preview rendering.
   * @throws {Error} - If the piece object is invalid or if the tile index is out of bounds.
   */
  _renderPreviewPiece(
    context,
    index,
    piece,
    fillColor = DEFAULT_PREVIEW_FILL_COLOR,
  ) {
    if (!piece || !piece.colorsKey) {
      throw new Error('Invalid piece object for preview');
    }

    const tile = this._map.tiles[index];
    if (!tile) {
      throw new Error('Tile index out of bounds for preview');
    }

    this._renderPiece(context, index, piece.colorsKey, tile.flipped);
    this._renderPiece(context, index, piece.colorsKey, tile.flipped, fillColor);
  }

  /**
   * @method _renderPlacedPieces - Renders all placed pieces on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the pieces on.
   */
  _renderPlacedPieces(context) {
    const pieces = this._board.indexes;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (piece) {
        const colorsKey = piece.colorsKey;
        const flipped = this._map.tiles[i].flipped;
        this._renderPiece(context, i, colorsKey, flipped);
      }
    }
  }

  /**
   * @method _renderFormedHexagonsFrame - Renders the formed hexagons on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the hexagons on.
   * @param {number} elapsed - The elapsed time since the last render, used for animation.
   */
  _renderFormedHexagonsFrame(context, elapsed) {
    const hexagonTextures = this._assetsManager.textures.get(
      'hexagons',
      'loop',
    );
    const flashingHexagonTextures = this._assetsManager.textures.get(
      'hexagons',
      'flash',
    );

    const formedHexagons = this._board.getCompleteHexagons();
    for (const hexagon of formedHexagons) {
      const coordinate = hexagon.coordinate;
      const color = hexagon.color;

      let texture;
      if (
        this._flashingPositions.has(`${coordinate[0]}-${coordinate[1]}`) &&
        !(
          date.now() >
          this._flashingPositions.get(`${coordinate[0]}-${coordinate[1]}`) +
            (flashingHexagonTextures.definition.range[1] -
              flashingHexagonTextures.definition.range[0] +
              1) /
              flashingHexagonTextures.fps
        )
      ) {
        const frameCount =
          flashingHexagonTextures.definition.range[1] -
          flashingHexagonTextures.definition.range[0] +
          1;
        const fps = flashingHexagonTextures.definition.fps;
        const currentFrame = Math.floor(
          ((elapsed * fps) / ONE_SECOND) % frameCount,
        );
        texture = {
          image: flashingHexagonTextures.image,
          definition:
            flashingHexagonTextures.definition.variants[color].frames[
              currentFrame
            ],
        };
      } else {
        this._flashingPositions.delete(`${coordinate[0]}-${coordinate[1]}`);

        const frameCount =
          hexagonTextures.definition.range[1] -
          hexagonTextures.definition.range[0] +
          1;
        const fps = hexagonTextures.definition.fps;
        const currentFrame = Math.floor(
          ((elapsed * fps) / ONE_SECOND) % frameCount,
        );
        texture = {
          image: hexagonTextures.image,
          definition:
            hexagonTextures.definition.variants[color].frames[currentFrame],
        };
      }

      this._renderHexagon(context, coordinate, texture);
    }
  }

  /**
   * @method _renderPreviewingPiecePositions - Renders all previewing piece positions on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the preview pieces on.
   */
  _renderPreviewingPiecePositions(context) {
    for (const [index, piece, fillColor = DEFAULT_PREVIEW_FILL_COLOR] of this
      ._previewingPositions) {
      this._renderPreviewPiece(context, index, piece, fillColor);
    }
  }

  /**
   * @method _renderPreviewingHexagonPositions - Renders all previewing hexagon positions on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the preview hexagons on.
   */
  _renderPreviewingHexagonPositions(context) {
    for (const [coordinate, color] of this._previewingHexagonPositions) {
      const textures = this._assetsManager.textures.get('hexagons', 'glow');
      const texture = {
        image: textures.image,
        definition: textures.definition.variants[color],
      };
      this._renderHexagon(context, coordinate, texture);
    }
  }

  /**
   * @method _renderPreviewingHexagonPartialPositionsFrame - Renders the previewing hexagon partial positions frame on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the preview hexagon partial positions on.
   * @param {number} elapsed - The elapsed time since the last render, used for animation.
   */
  _renderPreviewingHexagonPartialPositionsFrame(context, elapsed) {
    const textures = this._assetsManager.textures.get('hexagons', 'partial');
    const frameCount =
      textures.definition.range[1] - textures.definition.range[0] + 1;
    const fps = textures.definition.fps;
    const currentFrame = Math.floor(
      ((elapsed * fps) / ONE_SECOND) % frameCount,
    );

    for (const [coordinate] of this._previewingHexagonPositions) {
      const texture = {
        image: textures.image,
        definition: textures.definition.frames[currentFrame],
      };
      this._renderHexagon(context, coordinate, texture);
    }
  }

  /**
   * @method _renderShowingAvailablePositions - Renders the available positions on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the available positions on.
   * @throws {Error} - If positions is not an array or if any position index is out of bounds.
   */
  _renderShowingAvailablePositions(context) {
    if (!Array.isArray(positions)) {
      throw new Error(
        'positions must be an array of available position indexes',
      );
    }

    context.fillStyle =
      this._showingAvailablePositionsOverlayFillColor ||
      DEFAULT_AVAILABLE_POSITIONS_OVERLAY_FILL_COLOR;
    context.fillRect(0, 0, this._width, this._height);

    for (const index of positions) {
      const tile = this._map.tiles[index];
      if (!tile) {
        console.warn(
          `Tile index ${index} out of bounds for available positions`,
        );
        continue;
      }

      const texture = this._assetsManager.textures.get(
        'tiles',
        tile.flipped ? 'empty-flipped' : 'empty',
      );

      const x = tile.x * this._widthRatio;
      const y = tile.y * this._heightRatio;
      const imageWidth = texture.definition.w;
      const imageHeight = texture.definition.h;

      let width, height;
      if (tile.width !== undefined && tile.width !== null) {
        width = tile.width * this._widthRatio;
        height =
          tile.height !== undefined && tile.height !== null
            ? tile.height * this._heightRatio
            : (width * imageHeight) / imageWidth;
      } else if (tile.height !== undefined && tile.height !== null) {
        height = tile.height * this._heightRatio;
        width = (height * imageWidth) / imageHeight;
      } else {
        width = imageWidth * this._widthRatio;
        height = imageHeight * this._heightRatio;
      }

      const rotation = tile.rotation || 0;
      const angle = (rotation * Math.PI) / PI_DEGREES;

      context.save();
      context.translate(x + width * HALF, y + height * HALF);
      context.rotate(angle);

      context.globalCompositeOperation = 'destination-out';
      context.drawImage(
        texture.image,
        texture.definition.x,
        texture.definition.y,
        texture.definition.w,
        texture.definition.h,
        -width * HALF,
        -height * HALF,
        width,
        height,
      );

      context.restore();
    }
  }

  /**
   * @method _renderHitmap - Renders the hitmap on the canvas context.
   * @param {CanvasRenderingContext2D} context - The canvas context to render the hitmap on.
   */
  _renderHitmap(context) {
    const pieceIndices = this._board.map.positions.map((_, index) => index);

    for (const index of pieceIndices) {
      const gappedPieceId = index * COLOR_GAP_FACTOR + 1;

      if (gappedPieceId > MAX_PIECE_ID_RGB) {
        console.warn(
          `Gapped ID ${gappedPieceId} for index ${index} exceeds limit.`,
        );
        continue;
      }

      const r = gappedPieceId & MAX_COLOR_COMPONENT;
      const g = (gappedPieceId >> BITS_PER_BYTE) & MAX_COLOR_COMPONENT;
      const b = (gappedPieceId >> BITS_PER_TWO_BYTES) & MAX_COLOR_COMPONENT;
      const hitColor = `rgb(${r}, ${g}, ${b})`;

      this._renderPiece(
        context,
        index,
        'empty',
        this._map.tiles[index].flipped,
        hitColor,
      );
    }
  }

  /**
   * @method _getPositionFromHitmap - Retrieves the position index from the hitmap based on the pixel coordinates.
   * @param {CanvasRenderingContext2D} context - The canvas context to retrieve the hitmap data from.
   * @param {number} x - The x-coordinate of the pixel to check.
   * @param {number} y - The y-coordinate of the pixel to check.
   * @param {boolean} [onlyAvailable=false] - Whether to only return positions that are available.
   * @returns {number} - The position index if found, or -1 if not found.
   */
  _getPositionFromHitmap(context, x, y, onlyAvailable = false) {
    const imageData = context.getImageData(x, y, 1, 1).data;
    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[1 + 1];
    const a = imageData[1 + 1 + 1];

    if (a === 0) {
      return NOT_FOUND;
    }

    const decodedGappedId =
      r | (g << BITS_PER_BYTE) | (b << BITS_PER_TWO_BYTES);

    if (decodedGappedId === 0) {
      return NOT_FOUND;
    }

    if ((decodedGappedId - 1) % COLOR_GAP_FACTOR !== 0) {
      return NOT_FOUND;
    }

    const pieceIndex = (decodedGappedId - 1) / COLOR_GAP_FACTOR;
    if (!(pieceIndex >= 0 && pieceIndex < this._board.map.positions.length)) {
      return NOT_FOUND;
    }

    if (onlyAvailable) {
      const availablePositions = new Set(this._board.getAvailablePositions());
      if (!availablePositions.has(pieceIndex)) {
        return NOT_FOUND;
      }
    }

    return pieceIndex;
  }

  // Public methods

  // Preview methods
  previewPiece(index, piece, fillColor, clearPrevious = true) {}
  clearPreview() {}

  // Available positions methods
  showAvailablePositions(positions, fillColor, clearPrevious = true) {}
  clearAvailablePositions() {}

  // Texture methods
  getTexture(type, key) {}

  // Update methods
  updateBackground(backgroundUrl) {}
  updateGrid(gridUrl) {}
  updateTextures(texturesIndexUrl, texturesAtlasUrl) {}
  updateMap(newMap) {}
  updateBoard(newBoard) {}

  // Event listeners methods
  addEventListener(eventType, listener, options) {}
  removeEventListener(eventType, listener) {}

  // FPS methods
  getFPS() {}

  // Cleanup methods
  destroy() {}
}

module.exports = Renderer;
