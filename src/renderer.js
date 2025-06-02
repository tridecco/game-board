/**
 * @fileoverview Game Renderer
 * @description This file contains the implementation of a game board renderer for the Tridecco game with modular architecture and frame-based dirty rendering.
 */

const DEFAULT_ASSETS_URL =
  'https://cdn.jsdelivr.net/gh/tridecco/game-board@0.4.2/assets/';

const Board = require('./board');
const TexturePack = require('./texturePack');

const defaultMap = require('../maps/renderer/default');

const HALF = 2;
const TWO = 2;
const HALF_PI_DEGREES = 180;
const ALPHA_CHANNEL_INDEX = 3;
const NOT_FOUND = -1;
const MAX_PIECE_ID_RGB = 0xffffff;
const MAX_COLOR_COMPONENT = 0xff;
const BITS_PER_BYTE = 8;
const BITS_PER_TWO_BYTES = 16;
const COLOR_GAP_FACTOR = 10;
const FPS_SAMPLE_SIZE = 60;
const MILLISECONDS_PER_SECOND = 1000;

/**
 * @class CanvasLayer - Represents a single off-screen canvas layer.
 */
class CanvasLayer {
  /**
   * @constructor
   * @param {string} name - The name of the canvas layer.
   * @param {Object} options - The options for the canvas layer.
   * @param {boolean} options.willReadFrequently - Whether the canvas will be read frequently.
   * @param {boolean} options.imageSmoothingEnabled - Whether image smoothing is enabled.
   */
  constructor(name, options = {}) {
    this.name = name;
    this.canvas = new OffscreenCanvas(1, 1);
    this.context = this.canvas.getContext('2d', options);
    this.isDirty = false;
  }

  /**
   * @method resize - Resizes the canvas layer.
   * @param {number} width - The new width of the canvas.
   * @param {number} height - The new height of the canvas.
   * @param {number} devicePixelRatio - The device pixel ratio.
   */
  resize(width, height, devicePixelRatio) {
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;
    this.context.scale(devicePixelRatio, devicePixelRatio);
    this.markDirty();
  }

  /**
   * @method clear - Clears the canvas layer.
   */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.markDirty();
  }

  /**
   * @method markDirty - Marks the canvas layer as dirty, requiring re-rendering.
   */
  markDirty() {
    this.isDirty = true;
  }

  /**
   * @method markClean - Marks the canvas layer as clean, indicating it has been rendered.
   */
  markClean() {
    this.isDirty = false;
  }
}

/**
 * @class CanvasManager - Manages all off-screen canvas layers and their lifecycle.
 */
class CanvasManager {
  /**
   * @constructor
   */
  constructor() {
    this.layers = new Map();
    this.width = null;
    this.height = null;
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  /**
   * @method registerLayer - Registers a new canvas layer.
   * @param {string} name - The name of the canvas layer.
   * @param {Object} options - The options for the canvas layer.
   * @returns {CanvasLayer} - The registered canvas layer.
   */
  registerLayer(name, options = {}) {
    const layer = new CanvasLayer(name, options);
    this.layers.set(name, layer);
    if (this.width && this.height) {
      layer.resize(this.width, this.height, this.devicePixelRatio);
    }
    return layer;
  }

  /**
   * @method getLayer - Gets a canvas layer by name.
   * @param {string} name - The name of the canvas layer.
   * @returns {CanvasLayer} - The canvas layer.
   */
  getLayer(name) {
    return this.layers.get(name);
  }

  /**
   * @method resize - Resizes all canvas layers.
   * @param {number} width - The new width of the canvases.
   * @param {number} height - The new height of the canvases.
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.layers.forEach((layer) => {
      layer.resize(width, height, this.devicePixelRatio);
    });
  }

  /**
   * @method clearAll - Clears all canvas layers.
   */
  clearAll() {
    this.layers.forEach((layer) => {
      layer.clear();
    });
  }

  /**
   * @method getDirtyLayers - Gets all dirty canvas layers.
   * @returns {Array<CanvasLayer>} - Array of dirty canvas layers.
   */
  getDirtyLayers() {
    return Array.from(this.layers.values()).filter((layer) => layer.isDirty);
  }

  /**
   * @method destroy - Destroys all canvas layers and releases resources.
   */
  destroy() {
    this.layers.forEach((layer) => {
      layer.canvas = null;
      layer.context = null;
    });
    this.layers.clear();
  }
}

/**
 * @class AssetManager - Manages loading and caching of game assets.
 */
class AssetManager {
  /**
   * @constructor
   */
  constructor() {
    this.textures = null;
    this.background = null;
    this.grid = null;
  }

  /**
   * @method loadAssets - Loads textures, background, and grid images.
   * @param {string} texturesUrl - The URL of the texture pack.
   * @param {string} backgroundUrl - The URL of the background image.
   * @param {string} gridUrl - The URL of the grid image.
   * @returns {Promise<void[]>} - A promise that resolves when all assets are loaded.
   */
  async loadAssets(texturesUrl, backgroundUrl, gridUrl) {
    const loadingAssetsPromises = [
      new Promise((resolve) => {
        this.textures = new TexturePack(texturesUrl, resolve);
      }),
      new Promise((resolve) => {
        this.background = new Image();
        this.background.src = backgroundUrl;
        this.background.onload = resolve;
      }),
      new Promise((resolve) => {
        this.grid = new Image();
        this.grid.src = gridUrl;
        this.grid.onload = resolve;
      }),
    ];

    return Promise.all(loadingAssetsPromises);
  }

  /**
   * @method getTexture - Gets a texture by type and key.
   * @param {string} type - The texture type.
   * @param {string} key - The texture key.
   * @returns {HTMLImageElement} - The texture image.
   */
  getTexture(type, key) {
    if (!this.textures) {
      throw new Error('Textures not loaded yet');
    }
    return this.textures.get(type, key);
  }

  /**
   * @method updateTextures - Updates the texture pack.
   * @param {string} texturesUrl - The URL of the new texture pack.
   * @returns {Promise<void>} - A promise that resolves when textures are loaded.
   */
  async updateTextures(texturesUrl) {
    if (typeof texturesUrl !== 'string') {
      throw new Error(
        'texturesUrl must be a string representing the URL of the texture pack',
      );
    }

    return new Promise((resolve, reject) => {
      this.textures = new TexturePack(texturesUrl, resolve, (error) => {
        console.error('Error loading new texture pack:', error);
        reject(new Error('Failed to load new texture pack'));
      });
    });
  }

  /**
   * @method updateBackground - Updates the background image.
   * @param {string} backgroundUrl - The URL of the new background image.
   * @returns {Promise<void>} - A promise that resolves when background is loaded.
   */
  async updateBackground(backgroundUrl) {
    if (typeof backgroundUrl !== 'string') {
      throw new Error('backgroundUrl must be a string');
    }

    return new Promise((resolve, reject) => {
      const newBackground = new Image();
      newBackground.src = backgroundUrl;
      newBackground.onload = () => {
        this.background = newBackground;
        resolve();
      };
      newBackground.onerror = (error) => {
        console.error('Error loading new background image:', error);
        reject(new Error('Failed to load new background image'));
      };
    });
  }

  /**
   * @method updateGrid - Updates the grid image.
   * @param {string} gridUrl - The URL of the new grid image.
   * @returns {Promise<void>} - A promise that resolves when grid is loaded.
   */
  async updateGrid(gridUrl) {
    if (typeof gridUrl !== 'string') {
      throw new Error('gridUrl must be a string');
    }

    return new Promise((resolve, reject) => {
      const newGrid = new Image();
      newGrid.src = gridUrl;
      newGrid.onload = () => {
        this.grid = newGrid;
        resolve();
      };
      newGrid.onerror = (error) => {
        console.error('Error loading new grid image:', error);
        reject(new Error('Failed to load new grid image'));
      };
    });
  }

  /**
   * @method destroy - Destroys the asset manager and releases resources.
   */
  destroy() {
    this.textures = null;
    this.background = null;
    this.grid = null;
  }
}

/**
 * @class EventManager - Manages event listeners and event handling.
 */
class EventManager {
  /**
   * @constructor
   * @param {HTMLCanvasElement} canvas - The main canvas element.
   * @param {number} devicePixelRatio - The device pixel ratio.
   * @param {Function} getPieceFromCoordinate - Function to get piece from coordinate.
   */
  constructor(canvas, devicePixelRatio, getPieceFromCoordinate) {
    this.canvas = canvas;
    this.devicePixelRatio = devicePixelRatio;
    this.getPieceFromCoordinate = getPieceFromCoordinate;

    this.eventListeners = {
      dragover: new Set(),
      dragoverAvailable: new Set(),
      drop: new Set(),
      dropAvailable: new Set(),
      mousemove: new Set(),
      mousemoveAvailable: new Set(),
      click: new Set(),
      clickAvailable: new Set(),
      resize: new Set(),
    };

    this._initEventListeners();
  }

  /**
   * @method _initEventListeners - Initializes event listeners for the canvas.
   */
  _initEventListeners() {
    this.canvas.addEventListener('dragover', (event) => {
      const dpr = this.devicePixelRatio;
      const coords = {
        x: event.offsetX * dpr,
        y: event.offsetY * dpr,
      };
      event.preventDefault();
      this._triggerEvent(
        'dragover',
        this.getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this.getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('dragoverAvailable', availablePiece);
      }
    });

    this.canvas.addEventListener('drop', (event) => {
      const dpr = this.devicePixelRatio;
      const coords = {
        x: event.offsetX * dpr,
        y: event.offsetY * dpr,
      };
      event.preventDefault();
      this._triggerEvent(
        'drop',
        this.getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this.getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('dropAvailable', availablePiece);
      }
    });

    this.canvas.addEventListener('click', (event) => {
      const dpr = this.devicePixelRatio;
      const coords = {
        x: event.offsetX * dpr,
        y: event.offsetY * dpr,
      };
      this._triggerEvent(
        'click',
        this.getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this.getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('clickAvailable', availablePiece);
      }
    });

    this.canvas.addEventListener('mousemove', (event) => {
      const dpr = this.devicePixelRatio;
      const coords = {
        x: event.offsetX * dpr,
        y: event.offsetY * dpr,
      };
      this._triggerEvent(
        'mousemove',
        this.getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this.getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('mousemoveAvailable', availablePiece);
      }
    });
  }

  /**
   * @method _triggerEvent - Trigger an event for a specific action.
   * @param {string} eventType - The type of event to trigger.
   * @param {...*} args - The arguments to pass to the event listeners.
   */
  _triggerEvent(eventType, ...args) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach((listener) => {
        listener(...args);
      });
    }
  }

  /**
   * @method addEventListener - Adds an event listener.
   * @param {string} eventType - The event type.
   * @param {Function} listener - The listener function.
   * @param {Object} options - Optional parameters.
   */
  addEventListener(eventType, listener, options = {}) {
    if (!this.eventListeners[eventType] || eventType.endsWith('Available')) {
      throw new Error('Invalid event type');
    }

    if (eventType !== 'resize' && options.onlyAvailable) {
      this.eventListeners[`${eventType}Available`].add(listener);
    } else {
      this.eventListeners[eventType].add(listener);
    }
  }

  /**
   * @method removeEventListener - Removes an event listener.
   * @param {string} eventType - The event type.
   * @param {Function} listener - The listener function.
   */
  removeEventListener(eventType, listener) {
    if (!this.eventListeners[eventType] || eventType.endsWith('Available')) {
      throw new Error('Invalid event type');
    }

    this.eventListeners[eventType].delete(listener);
    if (eventType !== 'resize') {
      this.eventListeners[`${eventType}Available`].delete(listener);
    }
  }

  /**
   * @method destroy - Destroys the event manager and releases resources.
   */
  destroy() {
    for (const eventType in this.eventListeners) {
      this.eventListeners[eventType].clear();
    }
    this.eventListeners = null;
  }
}

/**
 * @class FPSMonitor - Monitors and calculates frames per second.
 */
class FPSMonitor {
  /**
   * @constructor
   */
  constructor() {
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.fps = 0;
  }

  /**
   * @method update - Updates FPS calculation with current frame time.
   */
  update() {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > FPS_SAMPLE_SIZE) {
      this.frameTimes.shift();
    }
    if (this.frameTimes.length > 0) {
      const averageFrameTime =
        this.frameTimes.reduce((sum, time) => sum + time, 0) /
        this.frameTimes.length;
      this.fps = Math.round(MILLISECONDS_PER_SECOND / averageFrameTime);
    }
  }

  /**
   * @method getFPS - Gets the current FPS.
   * @returns {number} - The current frames per second.
   */
  getFPS() {
    return this.fps;
  }

  /**
   * @method reset - Resets the FPS monitor.
   */
  reset() {
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.fps = 0;
  }
}

/**
 * @class RenderingEngine - Handles all rendering operations and dirty rendering logic.
 */
class RenderingEngine {
  /**
   * @constructor
   * @param {CanvasManager} canvasManager - The canvas manager instance.
   * @param {AssetManager} assetManager - The asset manager instance.
   * @param {Object} map - The game map.
   */
  constructor(canvasManager, assetManager, map) {
    this.canvasManager = canvasManager;
    this.assetManager = assetManager;
    this.map = map;

    this.widthRatio = null;
    this.heightRatio = null;

    this.isRenderingRequested = false;
    this.fpsMonitor = new FPSMonitor();

    this._isPreviewing = false;
    this._isShowingAvailablePositions = false;
    this._showingAvailablePositions = new Array();
    this._previewingPositions = new Map();
  }

  /**
   * @method setDimensions - Sets the rendering dimensions and ratios.
   * @param {number} width - The canvas width.
   * @param {number} height - The canvas height.
   */
  setDimensions(width, height) {
    this.widthRatio = width / this.map.width;
    this.heightRatio = height / this.map.height;
  }

  /**
   * @method requestRender - Requests a render frame using dirty rendering.
   * @param {HTMLCanvasElement} mainCanvas - The main canvas to render to.
   * @param {CanvasRenderingContext2D} mainContext - The main canvas context.
   */
  requestRender(mainCanvas, mainContext) {
    if (this.isRenderingRequested) {
      return;
    }

    this.isRenderingRequested = true;
    requestAnimationFrame(() => {
      this._performRender(mainCanvas, mainContext);
      this.isRenderingRequested = false;
      this.fpsMonitor.update();
    });
  }

  /**
   * @method _performRender - Performs the actual rendering of dirty layers.
   * @param {HTMLCanvasElement} mainCanvas - The main canvas to render to.
   * @param {CanvasRenderingContext2D} mainContext - The main canvas context.
   */
  _performRender(mainCanvas, mainContext) {
    const dirtyLayers = this.canvasManager.getDirtyLayers();
    if (dirtyLayers.length === 0) {
      return;
    }

    const width = mainCanvas.width / this.canvasManager.devicePixelRatio;
    const height = mainCanvas.height / this.canvasManager.devicePixelRatio;

    mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Render layers in order: background, pieces, piecesPreview, mask
    const layerOrder = ['background', 'pieces', 'piecesPreview', 'mask'];

    layerOrder.forEach((layerName) => {
      const layer = this.canvasManager.getLayer(layerName);
      if (layer) {
        mainContext.drawImage(layer.canvas, 0, 0, width, height);
        layer.markClean();
      }
    });
  }

  /**
   * @method renderBackgroundAndGrid - Renders background and grid to the background layer.
   * @param {number} width - The canvas width.
   * @param {number} height - The canvas height.
   */
  renderBackgroundAndGrid(width, height) {
    const backgroundLayer = this.canvasManager.getLayer('background');
    const backgroundContext = backgroundLayer.context;

    backgroundContext.clearRect(
      0,
      0,
      backgroundLayer.canvas.width,
      backgroundLayer.canvas.height,
    );

    // Draw the background image
    const bgWidth = this.assetManager.background.width;
    const bgHeight = this.assetManager.background.height;
    const bgRatio = bgWidth / bgHeight;

    let bgDrawWidth, bgDrawHeight, bgOffsetX, bgOffsetY;

    if (width / height > bgRatio) {
      bgDrawWidth = width;
      bgDrawHeight = width / bgRatio;
      bgOffsetX = 0;
      bgOffsetY = (height - bgDrawHeight) / HALF;
    } else {
      bgDrawHeight = height;
      bgDrawWidth = height * bgRatio;
      bgOffsetX = (width - bgDrawWidth) / HALF;
      bgOffsetY = 0;
    }

    backgroundContext.drawImage(
      this.assetManager.background,
      bgOffsetX,
      bgOffsetY,
      bgDrawWidth,
      bgDrawHeight,
    );

    // Draw the grid image
    const gridWidth = this.assetManager.grid.width;
    const gridHeight = this.assetManager.grid.height;
    const gridRatio = gridWidth / gridHeight;

    let gridDrawWidth, gridDrawHeight, gridOffsetX, gridOffsetY;

    if (width / height > gridRatio) {
      gridDrawHeight = height;
      gridDrawWidth = height * gridRatio;
      gridOffsetX = (width - gridDrawWidth) / HALF;
      gridOffsetY = 0;
    } else {
      gridDrawWidth = width;
      gridDrawHeight = width / gridRatio;
      gridOffsetX = 0;
      gridOffsetY = (height - gridDrawHeight) / HALF;
    }

    backgroundContext.drawImage(
      this.assetManager.grid,
      gridOffsetX,
      gridOffsetY,
      gridDrawWidth,
      gridDrawHeight,
    );

    backgroundLayer.markDirty();
  }

  /**
   * @method renderPiecesAndHexagons - Renders all pieces and hexagons.
   * @param {Board} board - The game board.
   */
  renderPiecesAndHexagons(board) {
    this.clearBoard();
    this.renderPieces(board);
    this.renderHexagons(board);
  }

  /**
   * @method renderPieces - Renders all pieces from the board.
   * @param {Board} board - The game board.
   */
  renderPieces(board) {
    const pieces = board.indexes;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (piece) {
        const flipped = this.map.tiles[i].flipped;
        this.renderPiece(i, piece.colorsKey, flipped);
      }
    }
  }

  /**
   * @method renderPiece - Renders a single game piece.
   * @param {number} index - The piece index.
   * @param {string} colorsKey - The color key.
   * @param {boolean} flipped - Whether the piece is flipped.
   * @param {string} layerName - The target layer name.
   * @param {string} fillColor - Optional fill color.
   */
  renderPiece(
    index,
    colorsKey,
    flipped,
    layerName = 'pieces',
    fillColor = null,
  ) {
    const targetLayer = this.canvasManager.getLayer(layerName);
    const targetContext = targetLayer.context;

    const tile = this.map.tiles[index];
    if (!tile) {
      throw new Error(`Tile index ${index} out of bounds`);
    }

    const textureKey = flipped ? `${colorsKey}-flipped` : colorsKey;
    const texture = this.assetManager.getTexture('tiles', textureKey);
    if (!texture) {
      throw new Error(`Texture key "${textureKey}" not found in textures`);
    }

    const x = tile.x * this.widthRatio;
    const y = tile.y * this.heightRatio;
    const imageWidth = texture.width;
    const imageHeight = texture.height;

    let width, height;
    if (tile.width !== undefined && tile.width !== null) {
      width = tile.width * this.widthRatio;
      height =
        tile.height !== undefined && tile.height !== null
          ? tile.height * this.heightRatio
          : (width * imageHeight) / imageWidth;
    } else if (tile.height !== undefined && tile.height !== null) {
      height = tile.height * this.heightRatio;
      width = (height * imageWidth) / imageHeight;
    } else {
      width = imageWidth * (this.widthRatio || 1);
      height = imageHeight * (this.heightRatio || 1);
    }

    if (!(width > 0 && height > 0)) {
      return;
    }

    const rotation = tile.rotation || 0;
    const angle = (rotation * Math.PI) / HALF_PI_DEGREES;

    targetContext.save();
    targetContext.translate(x + width / HALF, y + height / HALF);
    targetContext.rotate(angle);

    if (fillColor) {
      const tempLayer = this.canvasManager.getLayer('temp');
      const tempCanvas = tempLayer.canvas;
      const tempCtx = tempLayer.context;

      tempCanvas.width = Math.max(
        1,
        Math.ceil(width * this.canvasManager.devicePixelRatio),
      );
      tempCanvas.height = Math.max(
        1,
        Math.ceil(height * this.canvasManager.devicePixelRatio),
      );

      tempCtx.drawImage(texture, 0, 0, tempCanvas.width, tempCanvas.height);

      tempCtx.globalCompositeOperation = 'source-in';
      tempCtx.fillStyle = fillColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      tempCtx.globalCompositeOperation = 'source-over';

      targetContext.drawImage(
        tempCanvas,
        -width / HALF,
        -height / HALF,
        width,
        height,
      );
    } else {
      targetContext.drawImage(
        texture,
        -width / HALF,
        -height / HALF,
        width,
        height,
      );
    }

    targetContext.restore();
    targetLayer.markDirty();
  }

  /**
   * @method renderHexagons - Renders complete hexagons.
   * @param {Board} board - The game board.
   */
  renderHexagons(board) {
    const hexagons = board.getCompleteHexagons();
    for (const hexagon of hexagons) {
      this.renderHexagon(hexagon.coordinate, hexagon.color);
    }
  }

  /**
   * @method renderHexagon - Renders a single hexagon.
   * @param {Array<number>} coordinate - The hexagon coordinate.
   * @param {string} color - The hexagon color.
   */
  renderHexagon(coordinate, color) {
    const piecesLayer = this.canvasManager.getLayer('pieces');
    const piecesContext = piecesLayer.context;

    const hexagon = this.map.hexagons[`${coordinate[0]}-${coordinate[1]}`];
    const texture = this.assetManager.getTexture('hexagons', color);
    const x = hexagon.x * this.widthRatio;
    const y = hexagon.y * this.heightRatio;
    const imageWidth = texture.width;
    const imageHeight = texture.height;

    const width = hexagon.width
      ? hexagon.width * this.widthRatio
      : (hexagon.height * this.heightRatio * imageWidth) / imageHeight;
    const height = hexagon.height
      ? hexagon.height * this.heightRatio
      : (hexagon.width * this.widthRatio * imageHeight) / imageWidth;

    piecesContext.drawImage(texture, x, y, width, height);
    piecesLayer.markDirty();
  }

  /**
   * @method clearBoard - Clears the pieces layer.
   */
  clearBoard() {
    const piecesLayer = this.canvasManager.getLayer('pieces');
    piecesLayer.clear();
  }

  /**
   * @method previewPiece - Renders a piece preview.
   * @param {number} index - The piece index.
   * @param {Object} piece - The piece object.
   * @param {string} fillColor - The preview fill color.
   */
  previewPiece(index, piece, fillColor = 'rgba(255, 255, 255, 0.5)') {
    if (!piece || !piece.colorsKey) {
      throw new Error('Invalid piece object for preview');
    }

    const tile = this.map.tiles[index];
    if (!tile) {
      throw new Error('Tile index out of bounds for preview');
    }

    this.renderPiece(index, piece.colorsKey, tile.flipped, 'piecesPreview');
    this.renderPiece(
      index,
      piece.colorsKey,
      tile.flipped,
      'piecesPreview',
      fillColor,
    );

    this._isPreviewing = true;
    this._previewingPositions.set(index, piece);
  }

  /**
   * @method clearPreview - Clears piece previews.
   */
  clearPreview() {
    const previewLayer = this.canvasManager.getLayer('piecesPreview');
    previewLayer.clear();
    this._isPreviewing = false;
    this._previewingPositions.clear();
  }

  /**
   * @method showAvailablePositions - Shows available positions with a mask.
   * @param {Array<number>} positions - The available positions.
   * @param {string} fillColor - The mask fill color.
   */
  showAvailablePositions(positions, fillColor = 'rgba(0, 0, 0, 0.5)') {
    if (!Array.isArray(positions)) {
      throw new Error(
        'positions must be an array of available position indexes',
      );
    }

    if (this._isShowingAvailablePositions) {
      this.clearAvailablePositions();
    }

    const maskLayer = this.canvasManager.getLayer('mask');
    const maskContext = maskLayer.context;

    maskContext.fillStyle = fillColor;
    maskContext.fillRect(0, 0, maskLayer.canvas.width, maskLayer.canvas.height);

    for (const index of positions) {
      const tile = this.map.tiles[index];
      if (!tile) {
        continue;
      }

      const texture = this.assetManager.getTexture(
        'tiles',
        `${this.map.tiles[index].flipped ? 'empty-flipped' : 'empty'}`,
      );

      const x = tile.x * this.widthRatio;
      const y = tile.y * this.heightRatio;
      const imageWidth = texture.width;
      const imageHeight = texture.height;

      let width, height;
      if (tile.width !== undefined && tile.width !== null) {
        width = tile.width * this.widthRatio;
        height =
          tile.height !== undefined && tile.height !== null
            ? tile.height * this.heightRatio
            : (width * imageHeight) / imageWidth;
      } else if (tile.height !== undefined && tile.height !== null) {
        height = tile.height * this.heightRatio;
        width = (height * imageWidth) / imageHeight;
      } else {
        width = imageWidth * (this.widthRatio || 1);
        height = imageHeight * (this.heightRatio || 1);
      }

      if (!(width > 0 && height > 0)) {
        continue;
      }

      const rotation = tile.rotation || 0;
      const angle = (rotation * Math.PI) / HALF_PI_DEGREES;

      maskContext.save();
      maskContext.translate(x + width / HALF, y + height / HALF);
      maskContext.rotate(angle);

      maskContext.globalCompositeOperation = 'destination-out';
      maskContext.drawImage(
        texture,
        -width / HALF,
        -height / HALF,
        width,
        height,
      );

      maskContext.restore();
    }

    maskLayer.markDirty();
    this._isShowingAvailablePositions = true;
    this._showingAvailablePositions = positions;
  }

  /**
   * @method clearAvailablePositions - Clears available position highlights.
   */
  clearAvailablePositions() {
    const maskLayer = this.canvasManager.getLayer('mask');
    maskLayer.clear();
    this._isShowingAvailablePositions = false;
    this._showingAvailablePositions = [];
  }

  /**
   * @method setUpHitmap - Sets up the hitmap for piece detection.
   * @param {Board} board - The game board.
   */
  setUpHitmap(board) {
    const hitmapLayer = this.canvasManager.getLayer('hitmap');
    hitmapLayer.clear();

    const pieceIndices = board.map.positions.map((_, index) => index);

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

      this.renderPiece(
        index,
        'empty',
        this.map.tiles[index].flipped,
        'hitmap',
        hitColor,
      );
    }
  }

  /**
   * @method getFPS - Gets the current FPS.
   * @returns {number} - The current frames per second.
   */
  getFPS() {
    return this.fpsMonitor.getFPS();
  }

  /**
   * @method destroy - Destroys the rendering engine and releases resources.
   */
  destroy() {
    this.fpsMonitor.reset();
    this._previewingPositions.clear();
  }
}

/**
 * @class Renderer - A class representing the game board renderer.
 */
class Renderer {
  /**
   * @constructor
   * @param {Object} options - The options for the renderer.
   * @param {Board} options.board - The game board to be rendered.
   * @param {HTMLElement} options.container - The DOM element to be used for rendering the board.
   * @param {Object} options.map - The map to be used for rendering the board.
   * @param {string} options.texturesUrl - The URL of the texture pack.
   * @param {string} options.backgroundUrl - The URL of the background image.
   * @param {string} options.gridUrl - The URL of the grid image.
   * @param {Function} callback - A callback function to be executed after loading the textures, background, and grid.
   * @throws {Error} - If board is not an instance of Board, if canvas is not an HTMLElement, or if map is not a valid map object, or if texturesUrl, backgroundUrl, or gridUrl are not strings, or if the callback is not a function, or if the environment is not a browser.
   */
  constructor(
    {
      board,
      container,
      map = defaultMap,
      texturesUrl = DEFAULT_ASSETS_URL + 'textures/classic/normal',
      backgroundUrl = DEFAULT_ASSETS_URL + 'backgrounds/wooden-board.jpg',
      gridUrl = DEFAULT_ASSETS_URL + 'grids/black.png',
    },
    callback = () => {},
  ) {
    if (!(board instanceof Board)) {
      throw new Error('board must be an instance of Board');
    }
    if (!(container instanceof HTMLElement)) {
      throw new Error('canvas must be an instance of HTMLElement');
    }
    if (
      !map ||
      !map.height ||
      !map.width ||
      !map.tiles ||
      !map.tiles.length ||
      !map.hexagons
    ) {
      throw new Error('map must be a valid map object');
    }
    if (typeof texturesUrl !== 'string') {
      throw new Error(
        'texturesUrl must be a string representing the URL of the texture pack',
      );
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

    this.board = board;
    this.map = map;

    this.container = container;
    this.container.style.position = 'relative';
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.width = null;
    this.height = null;
    this.ratio = this.map.width / this.map.height;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Initialize modular components
    this.canvasManager = new CanvasManager();
    this.assetManager = new AssetManager();
    this.renderingEngine = new RenderingEngine(
      this.canvasManager,
      this.assetManager,
      this.map,
    );

    // Register canvas layers
    this._registerCanvasLayers();

    this.eventManager = null; // Will be initialized after canvas setup
    this.eventHandlers = new Map();

    this.resizeObserverInitialized = false;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.resizeObserverInitialized) {
        this.resizeObserverInitialized = true;
        return;
      }

      this._setUpCanvas();
      this.renderingEngine.requestRender(this.canvas, this.context);

      this.eventManager._triggerEvent('resize', {
        canvas: {
          width: this.canvas.width,
          height: this.canvas.height,
        },
        container: {
          width: this.container.clientWidth,
          height: this.container.clientHeight,
        },
      });
    });
    this.resizeObserver.observe(this.container);

    this.mutationObserver = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach((removedNode) => {
            if (removedNode === this.canvas || removedNode === this.container) {
              this.destroy();
            }
          });
        }
      }
    });
    this.mutationObserver.observe(this.container.parentNode || this.container, {
      childList: true,
      subtree: true,
    });

    this._setUpBoard();
    this.assetManager
      .loadAssets(texturesUrl, backgroundUrl, gridUrl)
      .then(() => {
        this._setUpCanvas();
        callback(this);
      });

    this.isDestroyed = false;
  }

  /**
   * @method _registerCanvasLayers - Registers all required canvas layers.
   */
  _registerCanvasLayers() {
    this.canvasManager.registerLayer('background');
    this.canvasManager.registerLayer('pieces');
    this.canvasManager.registerLayer('piecesPreview');
    this.canvasManager.registerLayer('mask');
    this.canvasManager.registerLayer('hitmap', {
      willReadFrequently: true,
      initialImageSmoothingEnabled: false,
      imageSmoothingEnabled: false,
    });
    this.canvasManager.registerLayer('temp', {
      willReadFrequently: true,
      initialImageSmoothingEnabled: false,
      imageSmoothingEnabled: false,
    });
  }

  /**
   * @method _setUpBoard - Sets up the board event listeners for rendering.
   */
  _setUpBoard() {
    const renderPiece = function renderPiece(index, piece) {
      this.renderingEngine.renderPiece(
        index,
        piece.colorsKey,
        this.map.tiles[index].flipped,
      );
      this.renderingEngine.requestRender(this.canvas, this.context);
    }.bind(this);

    const renderPiecesAndHexagons = function renderPiecesAndHexagons() {
      this.renderingEngine.renderPiecesAndHexagons(this.board);
      this.renderingEngine.requestRender(this.canvas, this.context);
    }.bind(this);

    const renderHexagons = function renderHexagons(hexagons) {
      for (const hexagon of hexagons) {
        this.renderingEngine.renderHexagon(hexagon.coordinate, hexagon.color);
      }
      this.renderingEngine.requestRender(this.canvas, this.context);
    }.bind(this);

    const clearBoard = function clearBoard() {
      this.renderingEngine.clearBoard();
      this.renderingEngine.requestRender(this.canvas, this.context);
    }.bind(this);

    this.board.addEventListener('set', renderPiece);
    this.board.addEventListener('remove', renderPiecesAndHexagons);
    this.board.addEventListener('form', renderHexagons);
    this.board.addEventListener('destroy', renderPiecesAndHexagons);
    this.board.addEventListener('clear', clearBoard);

    this.eventHandlers.set('set', renderPiece);
    this.eventHandlers.set('remove', renderPiecesAndHexagons);
    this.eventHandlers.set('form', renderHexagons);
    this.eventHandlers.set('destroy', renderPiecesAndHexagons);
    this.eventHandlers.set('clear', clearBoard);
  }

  /**
   * @method _setUpCanvas - Sets up the canvas dimensions and renders initial elements, applying device pixel ratio (DPR) for high-DPI displays.
   */
  _setUpCanvas() {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const mapRatio = this.ratio;
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > mapRatio) {
      canvasHeight = containerHeight;
      canvasWidth = canvasHeight * mapRatio;
    } else {
      canvasWidth = containerWidth;
      canvasHeight = canvasWidth / mapRatio;
    }

    const dpr = this.devicePixelRatio;
    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    const leftOffset = (containerWidth - canvasWidth) / HALF;
    const topOffset = (containerHeight - canvasHeight) / HALF;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${leftOffset}px`;
    this.canvas.style.top = `${topOffset}px`;

    if (!this.canvas.parentNode) {
      this.container.appendChild(this.canvas);
    }

    this.context.scale(dpr, dpr);

    this.width = canvasWidth;
    this.height = canvasHeight;

    // Update canvas manager and rendering engine
    this.canvasManager.resize(canvasWidth, canvasHeight);
    this.renderingEngine.setDimensions(canvasWidth, canvasHeight);

    // Initialize event manager if not already done
    if (!this.eventManager) {
      this.eventManager = new EventManager(
        this.canvas,
        this.devicePixelRatio,
        this._getPieceFromCoordinate.bind(this),
      );
    }

    this.canvasManager.clearAll();
    this.renderingEngine.renderBackgroundAndGrid(canvasWidth, canvasHeight);
    if (this.board.indexes.length) {
      this.renderingEngine.renderPiecesAndHexagons(this.board);
    }
    if (this.renderingEngine._isShowingAvailablePositions) {
      this.showAvailablePositions(
        this.renderingEngine._showingAvailablePositions,
      );
    }
    if (this.renderingEngine._isPreviewing) {
      this.renderingEngine._previewingPositions.forEach((piece, index) => {
        this.previewPiece(index, piece);
      });
    }
    this.renderingEngine.setUpHitmap(this.board);
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method _getPieceFromCoordinate - Retrieves the index of a piece at a given canvas coordinate using the hitmap.
   * @param {number} x - The x coordinate on the canvas.
   * @param {number} y - The y coordinate on the canvas.
   * @param {boolean} [onlyAvailable=false] - Optional flag to only consider available positions.
   * @returns {number} - The index of the piece at the coordinate, or -1 if no piece is found.
   */
  _getPieceFromCoordinate(x, y, onlyAvailable = false) {
    const hitmapLayer = this.canvasManager.getLayer('hitmap');
    const imageData = hitmapLayer.context.getImageData(x, y, 1, 1);
    const pixelData = imageData.data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[TWO];
    const alpha = pixelData[ALPHA_CHANNEL_INDEX];

    if (alpha === 0) {
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
    if (!(pieceIndex >= 0 && pieceIndex < this.board.map.positions.length)) {
      return NOT_FOUND;
    }

    if (onlyAvailable) {
      const availablePositions = new Set(this.board.getAvailablePositions());
      if (!availablePositions.has(pieceIndex)) {
        return NOT_FOUND;
      }
    }

    return pieceIndex;
  }

  /**
   * @method previewPiece - Renders a preview of a piece at a given index with a semi-transparent overlay.
   * @param {number} index - The index of the board position where the piece preview is to be rendered.
   * @param {Piece} piece - The Piece object to be previewed.
   * @param {string} [fillColor='rgba(255, 255, 255, 0.5)'] - Optional fill color for the preview overlay, default is semi-transparent white.
   * @throws {Error} - If the piece is invalid or if the index is out of bounds.
   */
  previewPiece(index, piece, fillColor = 'rgba(255, 255, 255, 0.5)') {
    this.renderingEngine.previewPiece(index, piece, fillColor);
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method clearPreview - Clears any piece previews currently rendered on the piecesPreview off-screen canvas.
   */
  clearPreview() {
    this.renderingEngine.clearPreview();
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method showAvailablePositions - Highlights available positions on the board using a mask on the mask off-screen canvas.
   * @param {Array<number>} [positions=this.board.getAvailablePositions()] - An array of position indexes to highlight as available.
   * @param {string} [fillColor='rgba(0, 0, 0, 0.5)'] - Optional fill color for the highlight mask, default is semi-transparent black.
   * @throws {Error} - If positions is not an array.
   */
  showAvailablePositions(
    positions = this.board.getAvailablePositions(),
    fillColor = 'rgba(0, 0, 0, 0.5)',
  ) {
    this.renderingEngine.showAvailablePositions(positions, fillColor);
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method clearAvailablePositions - Clears the highlight mask from the mask off-screen canvas, removing highlights of available positions.
   */
  clearAvailablePositions() {
    this.renderingEngine.clearAvailablePositions();
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method getTexture - Retrieves a texture from the loaded texture pack by type and key.
   * @param {string} type - The texture type (e.g., 'tiles', 'hexagons').
   * @param {string} key - The key of the texture image within the texture type.
   * @returns {HTMLImageElement} - The requested texture image element.
   * @throws {Error} - If textures have not been loaded yet, indicating assets are not ready.
   */
  getTexture(type, key) {
    return this.assetManager.getTexture(type, key);
  }

  /**
   * @method getFPS - Gets the current frames per second.
   * @returns {number} - The current FPS value.
   */
  getFPS() {
    return this.renderingEngine.getFPS();
  }

  /**
   * @method updateBoard - Updates the board instance used by the renderer, re-initializing the canvas and re-rendering the board.
   * @param {Board} newBoard - The new board instance to replace the current board.
   * @throws {Error} - If newBoard is not a valid board instance.
   */
  updateBoard(newBoard) {
    if (!(newBoard instanceof Board)) {
      throw new Error('newBoard must be a valid board instance');
    }

    this.board.removeEventListener('set', this.eventHandlers.get('set'));
    this.board.removeEventListener('remove', this.eventHandlers.get('remove'));
    this.board.removeEventListener('form', this.eventHandlers.get('form'));
    this.board.removeEventListener(
      'destroy',
      this.eventHandlers.get('destroy'),
    );
    this.board.removeEventListener('clear', this.eventHandlers.get('clear'));
    this.eventHandlers.clear();

    this.board = newBoard;
    this._setUpBoard();
    this._setUpCanvas();
  }

  /**
   * @method updateMap - Updates the game board map, re-initializes the canvas, and re-renders the board.
   * @param {Object} newMap - The new map configuration object to replace the current map.
   * @throws {Error} - If newMap is not a valid map object, validation checks for required map properties.
   */
  updateMap(newMap) {
    if (
      !newMap ||
      !newMap.height ||
      !newMap.width ||
      !newMap.tiles ||
      !newMap.tiles.length ||
      !newMap.hexagons
    ) {
      throw new Error('newMap must be a valid map object');
    }

    this.map = newMap;
    this.ratio = this.map.width / this.map.height;
    this.renderingEngine.map = newMap;

    this.board.removeEventListener('set', this.eventHandlers.get('set'));
    this.board.removeEventListener('remove', this.eventHandlers.get('remove'));
    this.board.removeEventListener('form', this.eventHandlers.get('form'));
    this.board.removeEventListener(
      'destroy',
      this.eventHandlers.get('destroy'),
    );
    this.board.removeEventListener('clear', this.eventHandlers.get('clear'));
    this.eventHandlers.clear();
    this._setUpBoard();
    this._setUpCanvas();
  }

  /**
   * @method updateTextures - Updates the texture pack used by the renderer, loading new textures from a given URL.
   * @param {string} texturesUrl - The URL from which to load the new texture pack.
   * @returns {Promise<void>} - A promise that resolves when the new texture pack is loaded, pieces and hitmap are re-rendered.
   * @throws {Error} - If texturesUrl is not a string or if loading the texture pack fails.
   */
  async updateTextures(texturesUrl) {
    await this.assetManager.updateTextures(texturesUrl);
    this.renderingEngine.renderPiecesAndHexagons(this.board);
    this.renderingEngine.setUpHitmap(this.board);

    if (this.renderingEngine._isPreviewing) {
      const previewingPositions = [
        ...this.renderingEngine._previewingPositions,
      ];
      this.clearPreview();
      previewingPositions.forEach(([index, piece]) => {
        this.previewPiece(index, piece);
      });
    }

    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method updateBackground - Updates the background image of the renderer with a new image from the provided URL.
   * @param {string} backgroundUrl - The URL of the new background image to load.
   * @returns {Promise<void>} - A promise that resolves when the new background image is loaded and the canvas is re-rendered.
   * @throws {Error} - If backgroundUrl is not a string or if loading the background image fails.
   */
  async updateBackground(backgroundUrl) {
    await this.assetManager.updateBackground(backgroundUrl);
    this.renderingEngine.renderBackgroundAndGrid(this.width, this.height);
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method updateGrid - Updates the grid image of the renderer with a new image from the provided URL.
   * @param {string} gridUrl - The URL of the new grid image to load.
   * @returns {Promise<void>} - A promise that resolves when the new grid image is loaded and the canvas is re-rendered.
   * @throws {Error} - If gridUrl is not a string or if loading the grid image fails.
   */
  async updateGrid(gridUrl) {
    await this.assetManager.updateGrid(gridUrl);
    this.renderingEngine.renderBackgroundAndGrid(this.width, this.height);
    this.renderingEngine.requestRender(this.canvas, this.context);
  }

  /**
   * @method addEventListener - Adds a listener for specific renderer events, enabling custom actions on events like piece placement.
   * @param {string} eventType - The event type to listen for (dragover, drop, mousemove, click, resize).
   * @param {Function} listener - The function to execute when the event is triggered; receives event-specific arguments.
   * @param {Object} [options] - Optional parameters, including `onlyAvailable: true` to filter events to available positions only.
   * @throws {Error} - If eventType is not a valid event type.
   */
  addEventListener(eventType, listener, options = {}) {
    this.eventManager.addEventListener(eventType, listener, options);
  }

  /**
   * @method removeEventListener - Removes a previously added event listener for a given event type, preventing further execution on that event.
   * @param {string} eventType - The event type from which to remove the listener.
   * @param {Function} listener - The listener function to be removed.
   * @throws {Error} - If eventType is not a valid event type, indicating an attempt to remove listener from a non-existent event.
   */
  removeEventListener(eventType, listener) {
    this.eventManager.removeEventListener(eventType, listener);
  }

  /**
   * @method destroy - Tears down the renderer, releasing resources, removing listeners, and detaching the canvas from the DOM.
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.board.removeEventListener('set', this.eventHandlers.get('set'));
    this.board.removeEventListener('remove', this.eventHandlers.get('remove'));
    this.board.removeEventListener('form', this.eventHandlers.get('form'));
    this.board.removeEventListener(
      'destroy',
      this.eventHandlers.get('destroy'),
    );
    this.board.removeEventListener('clear', this.eventHandlers.get('clear'));

    this.eventHandlers.clear();

    if (this.eventManager) {
      this.eventManager.destroy();
    }

    this.canvasManager.clearAll();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    if (this.canvas.parentNode) {
      this.container.removeChild(this.canvas);
    }

    this.canvas = null;
    this.context = null;
    this.canvasManager.destroy();
    this.assetManager.destroy();
    this.renderingEngine.destroy();

    this.board = null;
    this.map = null;
    this.container = null;

    this.resizeObserverInitialized = false;
    this.eventHandlers = null;
    this.canvasManager = null;
    this.assetManager = null;
    this.renderingEngine = null;
    this.eventManager = null;

    this.isDestroyed = true;
  }
}

module.exports = Renderer;
