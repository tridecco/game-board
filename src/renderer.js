/**
 * @fileoverview Game Renderer
 * @description This file contains the implementation of a game board renderer for the Tridecco game.
 */

const DEFAULT_ASSETS_URL =
  'https://cdn.jsdelivr.net/gh/tridecco/game-board@0.4.2/assets/';

const Board = require('./board');
const TexturePack = require('./texturePack');

const defaultMap = require('../maps/renderer/default');

const HALF = 2;
const TWO = 2;
const ONE_SECOND = 1000;
const HALF_PI_DEGREES = 180;
const ALPHA_CHANNEL_INDEX = 3;
const NOT_FOUND = -1;
const MAX_PIECE_ID_RGB = 0xffffff;
const MAX_COLOR_COMPONENT = 0xff;
const BITS_PER_BYTE = 8;
const BITS_PER_TWO_BYTES = 16;
const COLOR_GAP_FACTOR = 10;
const FPS_TEXT_STYLE = '12px Arial';
const FPS_TEXT_COLOR = 'rgba(255, 255, 255, 0.7)';
const FPS_PADDING = 5;
const FPS_UPDATE_INTERVAL = 500; // Update FPS display every 500ms (not calculation)

/**
 * @class _FPSTracker - Helper class for tracking and displaying FPS.
 * @private
 */
class _FPSTracker {
  /**
   * @constructor
   * @param {boolean} showFPS - Whether to display the FPS counter.
   * @param {CanvasRenderingContext2D} mainContext - The main rendering context to draw FPS on.
   * @param {Object} canvasDimensions - An object with width and height of the main canvas.
   */
  constructor(showFPS, mainContext, canvasDimensions) {
    this.showFPS = showFPS;
    this.mainContext = mainContext;
    this.canvasDimensions = canvasDimensions;

    this.frameCount = 0;
    this.lastFPSTime = performance.now();
    this.currentFPS = 0;
    this.displayedFPSString = 'FPS: 0';
    this.lastFPSDisplayUpdateTime = 0;

    if (this.showFPS) {
      this.mainContext.font = FPS_TEXT_STYLE;
      this.mainContext.fillStyle = FPS_TEXT_COLOR;
    }
  }

  /**
   * @method tick - Call this on every animation frame to update FPS calculation.
   */
  tick() {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastFPSTime;

    if (delta >= ONE_SECOND) {
      this.currentFPS = (this.frameCount * ONE_SECOND) / delta;
      this.frameCount = 0;
      this.lastFPSTime = now;
    }

    if (
      this.showFPS &&
      now - this.lastFPSDisplayUpdateTime > FPS_UPDATE_INTERVAL
    ) {
      this.displayedFPSString = `FPS: ${this.currentFPS.toFixed(1)}`;
      this.lastFPSDisplayUpdateTime = now;
    }
  }

  /**
   * @method draw - Draws the FPS counter if enabled.
   */
  draw() {
    if (!this.showFPS) {
      return;
    }
    const textWidth = this.mainContext.measureText(
      this.displayedFPSString,
    ).width;
    const x = this.canvasDimensions.width - textWidth - FPS_PADDING;
    const y = this.canvasDimensions.height - FPS_PADDING;
    this.mainContext.fillStyle = FPS_TEXT_COLOR;
    this.mainContext.font = FPS_TEXT_STYLE;
    this.mainContext.fillText(this.displayedFPSString, x, y);
  }

  /**
   * @method getCurrentFPS - Returns the currently calculated FPS.
   * @returns {number} - The current FPS.
   */
  getCurrentFPS() {
    return this.currentFPS;
  }

  /**
   * @method destroy - Cleans up resources.
   */
  destroy() {
    this.mainContext = null;
    this.canvasDimensions = null;
  }
}

/**
 * @class _CanvasManager - Manages main and off-screen canvases.
 * @private
 */
class _CanvasManager {
  /**
   * @constructor
   * @param {HTMLElement} container - The DOM element to host the canvas.
   * @param {Object} map - The game map data.
   * @param {number} devicePixelRatio - The device's pixel ratio.
   */
  constructor(container, map, devicePixelRatio) {
    this.container = container;
    this.map = map;
    this.devicePixelRatio = devicePixelRatio;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.width = null;
    this.height = null;
    this.ratio = this.map.width / this.map.height;
    this.widthRatio = null;
    this.heightRatio = null;

    this.offScreenCanvases = {
      background: new OffscreenCanvas(1, 1),
      pieces: new OffscreenCanvas(1, 1),
      piecesPreview: new OffscreenCanvas(1, 1),
      mask: new OffscreenCanvas(1, 1),
      hitmap: new OffscreenCanvas(1, 1),
      temp: new OffscreenCanvas(1, 1),
    };
    this.offScreenContexts = {
      background: this.offScreenCanvases.background.getContext('2d'),
      pieces: this.offScreenCanvases.pieces.getContext('2d'),
      piecesPreview: this.offScreenCanvases.piecesPreview.getContext('2d'),
      mask: this.offScreenCanvases.mask.getContext('2d'),
      hitmap: this.offScreenCanvases.hitmap.getContext('2d', {
        willReadFrequently: true,
        initialImageSmoothingEnabled: false,
        imageSmoothingEnabled: false,
      }),
      temp: this.offScreenCanvases.temp.getContext('2d', {
        willReadFrequently: true,
        initialImageSmoothingEnabled: false,
        imageSmoothingEnabled: false,
      }),
    };

    this.container.style.position = 'relative';
  }

  /**
   * @method setupSizes - Sets up the canvas dimensions and scales contexts.
   */
  setupSizes() {
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

    for (const key in this.offScreenCanvases) {
      this.offScreenCanvases[key].width = canvasWidth * dpr;
      this.offScreenCanvases[key].height = canvasHeight * dpr;
    }

    this.context.scale(dpr, dpr);
    for (const key in this.offScreenContexts) {
      this.offScreenContexts[key].scale(dpr, dpr);
    }

    this.width = canvasWidth;
    this.height = canvasHeight;
    this.widthRatio = canvasWidth / this.map.width;
    this.heightRatio = canvasHeight / this.map.height;
  }

  /**
   * @method getMainCanvas - Gets the main canvas element.
   * @returns {HTMLCanvasElement} - The main canvas element.
   */
  getMainCanvas() {
    return this.canvas;
  }

  /**
   * @method getMainContext - Gets the main canvas rendering context.
   * @returns {CanvasRenderingContext2D} - The main canvas context.
   */
  getMainContext() {
    return this.context;
  }

  /**
   * @method getOffscreenCanvas - Gets a specific off-screen canvas.
   * @param {string} name - Name of the off-screen canvas.
   * @returns {OffscreenCanvas} - The requested off-screen canvas.
   */
  getOffscreenCanvas(name) {
    return this.offScreenCanvases[name];
  }

  /**
   * @method getOffscreenContext - Gets a specific off-screen canvas context.
   * @param {string} name - Name of the off-screen canvas context.
   * @returns {CanvasRenderingContext2D} - The requested off-screen canvas context.
   */
  getOffscreenContext(name) {
    return this.offScreenContexts[name];
  }

  /**
   * @method getDimensions - Returns the logical width and height of the main canvas.
   * @returns {{width: number, height: number}} - The dimensions of the main canvas.
   */
  getDimensions() {
    return { width: this.width, height: this.height };
  }

  /**
   * @method getRatios - Returns rendering ratios.
   * @returns {{widthRatio: number, heightRatio: number, devicePixelRatio: number}} - The rendering ratios.
   */
  getRatios() {
    return {
      widthRatio: this.widthRatio,
      heightRatio: this.heightRatio,
      devicePixelRatio: this.devicePixelRatio,
    };
  }

  /**
   * @method clearAllCanvases - Clears all canvases.
   */
  clearAllCanvases() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); // Scaled coords
    for (const key in this.offScreenCanvases) {
      this.offScreenContexts[key].clearRect(
        0,
        0,
        this.offScreenCanvases[key].width, // Scaled coords
        this.offScreenCanvases[key].height,
      );
    }
  }

  /**
   * @method updateMap - Updates the map and recalculates ratios.
   * @param {Object} newMap - The new map object.
   */
  updateMap(newMap) {
    this.map = newMap;
    this.ratio = this.map.width / this.map.height;
  }

  /**
   * @method destroy - Cleans up canvas resources.
   */
  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.context = null;
    for (const key in this.offScreenCanvases) {
      this.offScreenCanvases[key] = null;
      this.offScreenContexts[key] = null;
    }
    this.offScreenCanvases = null;
    this.offScreenContexts = null;
    this.container = null;
    this.map = null;
  }
}

/**
 * @class _AssetLoader - Handles loading of game assets.
 * @private
 */
class _AssetLoader {
  /**
   * @constructor
   * @param {string} texturesUrl - URL for textures.
   * @param {string} backgroundUrl - URL for background image.
   * @param {string} gridUrl - URL for grid image.
   */
  constructor(texturesUrl, backgroundUrl, gridUrl) {
    this.texturesUrl = texturesUrl;
    this.backgroundUrl = backgroundUrl;
    this.gridUrl = gridUrl;

    this.textures = null;
    this.background = null;
    this.grid = null;
  }

  /**
   * @method loadAll - Loads all assets.
   * @returns {Promise<void>} - Resolves when all assets are loaded.
   */
  async loadAll() {
    const loadingAssetsPromises = [
      new Promise((resolve, reject) => {
        this.textures = new TexturePack(this.texturesUrl, resolve, reject);
      }),
      new Promise((resolve, reject) => {
        this.background = new Image();
        this.background.src = this.backgroundUrl;
        this.background.onload = resolve;
        this.background.onerror = reject;
      }),
      new Promise((resolve, reject) => {
        this.grid = new Image();
        this.grid.src = this.gridUrl;
        this.grid.onload = resolve;
        this.grid.onerror = reject;
      }),
    ];
    return Promise.all(loadingAssetsPromises);
  }

  /**
   * @method getTexture - Gets a specific texture.
   * @param {string} type - Texture type.
   * @param {string} key - Texture key.
   * @returns {HTMLImageElement} - The requested texture image.
   * @throws {Error} - If textures are not loaded yet.
   */
  getTexture(type, key) {
    if (!this.textures) {
      throw new Error('Textures not loaded yet');
    }
    return this.textures.get(type, key);
  }

  /**
   * @method getBackground - Gets the background image.
   * @returns {HTMLImageElement} - The background image.
   */
  getBackground() {
    return this.background;
  }

  /**
   * @method getGrid - Gets the grid image.
   * @returns {HTMLImageElement} - The grid image.
   */
  getGrid() {
    return this.grid;
  }

  /**
   * @method updateTextures - Updates textures from a new URL.
   * @param {string} newTexturesUrl - The new URL for textures.
   * @returns {Promise<void>} - Resolves when new textures are loaded.
   */
  async updateTextures(newTexturesUrl) {
    this.texturesUrl = newTexturesUrl;
    return new Promise((resolve, reject) => {
      this.textures = new TexturePack(this.texturesUrl, resolve, reject);
    });
  }

  /**
   * @method updateBackground - Updates the background image from a new URL.
   * @param {string} newBackgroundUrl - The new URL for the background.
   * @returns {Promise<void>} - Resolves when the new background is loaded.
   */
  async updateBackground(newBackgroundUrl) {
    this.backgroundUrl = newBackgroundUrl;
    return new Promise((resolve, reject) => {
      const newBackground = new Image();
      newBackground.src = this.backgroundUrl;
      newBackground.onload = () => {
        this.background = newBackground;
        resolve();
      };
      newBackground.onerror = reject;
    });
  }

  /**
   * @method updateGrid - Updates the grid image from a new URL.
   * @param {string} newGridUrl - The new URL for the grid.
   * @returns {Promise<void>} - Resolves when the new grid is loaded.
   */
  async updateGrid(newGridUrl) {
    this.gridUrl = newGridUrl;
    return new Promise((resolve, reject) => {
      const newGrid = new Image();
      newGrid.src = this.gridUrl;
      newGrid.onload = () => {
        this.grid = newGrid;
        resolve();
      };
      newGrid.onerror = reject;
    });
  }

  /**
   * @method destroy - Cleans up asset references.
   */
  destroy() {
    this.textures = null;
    this.background = null;
    this.grid = null;
  }
}

/**
 * @class _RenderLoop - Manages the animation frame loop and dirty rendering.
 * @private
 */
class _RenderLoop {
  /**
   * @constructor
   * @param {CanvasRenderingContext2D} mainContext - Main canvas context.
   * @param {Object<string, OffscreenCanvas>} offScreenCanvases - All off-screen canvases.
   * @param {_FPSTracker} fpsTracker - FPS tracker instance.
   * @param {function} getCanvasDimensions - Function to get current canvas dimensions.
   * @param {Renderer} rendererRef - Reference to the main Renderer instance for drawing methods.
   */
  constructor(
    mainContext,
    offScreenCanvases,
    fpsTracker,
    getCanvasDimensions,
    rendererRef,
  ) {
    this.mainContext = mainContext;
    this.offScreenCanvases = offScreenCanvases;
    this.fpsTracker = fpsTracker;
    this.getCanvasDimensions = getCanvasDimensions;
    this.rendererRef = rendererRef;

    this.animationFrameId = null;
    this.isLooping = false;

    this.dirtyCanvases = {
      background: true, // Initially dirty to draw background and grid
      pieces: true, // Initially dirty if there are pieces
      piecesPreview: false,
      mask: false,
      // Hitmap is not rendered to main, temp is for utility
    };
    this.isAnyDirty = true; // Combined dirty flag
  }

  /**
   * @method markDirty - Marks a specific off-screen canvas as dirty.
   * @param {string} canvasName - The name of the canvas to mark dirty.
   */
  markDirty(canvasName) {
    if (this.dirtyCanvases.hasOwnProperty(canvasName)) {
      this.dirtyCanvases[canvasName] = true;
      this.isAnyDirty = true;
    }
  }

  /**
   * @method markAllDirty - Marks all renderable off-screen canvases as dirty.
   */
  markAllDirty() {
    this.dirtyCanvases.background = true;
    this.dirtyCanvases.pieces = true;
    this.dirtyCanvases.piecesPreview = true;
    this.dirtyCanvases.mask = true;
    this.isAnyDirty = true;
  }

  /**
   * @method _loop - The main animation loop.
   */
  _loop() {
    if (!this.isLooping) return;

    this.fpsTracker.tick();

    if (this.isAnyDirty) {
      const { width, height } = this.getCanvasDimensions();
      this.mainContext.clearRect(
        0,
        0,
        width * this.rendererRef._canvasManager.devicePixelRatio,
        height * this.rendererRef._canvasManager.devicePixelRatio,
      ); // Use physical pixels for clearRect

      // Draw layers, order matters
      if (this.dirtyCanvases.background || true) {
        // Always draw background for now or if it's dirty
        this.mainContext.drawImage(
          this.offScreenCanvases.background,
          0,
          0,
          width,
          height,
        );
      }
      if (this.dirtyCanvases.pieces || true) {
        // Always draw pieces
        this.mainContext.drawImage(
          this.offScreenCanvases.pieces,
          0,
          0,
          width,
          height,
        );
      }
      if (this.dirtyCanvases.piecesPreview || this.rendererRef._isPreviewing) {
        this.mainContext.drawImage(
          this.offScreenCanvases.piecesPreview,
          0,
          0,
          width,
          height,
        );
      }
      if (
        this.dirtyCanvases.mask ||
        this.rendererRef._isShowingAvailablePositions
      ) {
        this.mainContext.drawImage(
          this.offScreenCanvases.mask,
          0,
          0,
          width,
          height,
        );
      }

      this.fpsTracker.draw(); // Draw FPS only when canvas is updated

      // Reset dirty flags after rendering
      this.dirtyCanvases.background = false;
      this.dirtyCanvases.pieces = false;
      this.dirtyCanvases.piecesPreview = false;
      this.dirtyCanvases.mask = false;
      this.isAnyDirty = false;
    }

    this.animationFrameId = requestAnimationFrame(this._loop.bind(this));
  }

  /**
   * @method start - Starts the rendering loop.
   */
  start() {
    if (!this.isLooping) {
      this.isLooping = true;
      this.markAllDirty(); // Ensure first frame renders everything
      this._loop();
    }
  }

  /**
   * @method stop - Stops the rendering loop.
   */
  stop() {
    if (this.isLooping) {
      this.isLooping = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  /**
   * @method destroy - Cleans up.
   */
  destroy() {
    this.stop();
    this.mainContext = null;
    this.offScreenCanvases = null;
    if (this.fpsTracker) this.fpsTracker.destroy();
    this.fpsTracker = null;
    this.getCanvasDimensions = null;
    this.rendererRef = null;
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
   * @param {boolean} [options.showFPS=false] - Whether to display FPS counter.
   * @param {Function} callback - A callback function to be executed after loading the textures, background, and grid.
   * @throws {Error} - If board is not an instance of Board, if container is not an HTMLElement, or if map is not a valid map object, or if texturesUrl, backgroundUrl, or gridUrl are not strings, or if the callback is not a function, or if the environment is not a browser.
   */
  constructor(
    {
      board,
      container,
      map = defaultMap,
      texturesUrl = DEFAULT_ASSETS_URL + 'textures/classic/normal',
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
      // Corrected error message from 'canvas' to 'container'
      throw new Error('container must be an instance of HTMLElement');
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
    this.map = map; // Initial map
    this.container = container;

    // Initialize helper modules
    this._canvasManager = new _CanvasManager(
      container,
      this.map,
      window.devicePixelRatio || 1,
    );
    this._assetLoader = new _AssetLoader(texturesUrl, backgroundUrl, gridUrl);
    this._fpsTracker = new _FPSTracker(
      showFPS,
      this._canvasManager.getMainContext(),
      this._canvasManager.getDimensions(),
    );
    this._renderLoop = new _RenderLoop(
      this._canvasManager.getMainContext(),
      this._canvasManager.offScreenCanvases, // Pass all offScreenCanvases
      this._fpsTracker,
      this._canvasManager.getDimensions.bind(this._canvasManager),
      this,
    );

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
    this.eventHandlers = new Map(); // For board events

    this._isPreviewing = false;
    this._isShowingAvailablePositions = false;
    this._showingAvailablePositions = new Array();
    this._previewingPositions = new Map();

    this.isDestroyed = false;
    this.resizeObserverInitialized = false;

    this._initResizeObserver();
    this._initMutationObserver();
    this._initEventListeners();
    this._setUpBoardEventHandlers();

    this._assetLoader.loadAll().then(() => {
      this._setUpCanvasAndInitialRender();
      this._renderLoop.start();
      callback(this);
    });
  }

  /**
   * @method _setUpCanvasAndInitialRender - Sets up canvas and performs initial render operations.
   */
  _setUpCanvasAndInitialRender() {
    this._canvasManager.setupSizes();
    this._fpsTracker.mainContext = this._canvasManager.getMainContext(); // Re-assign context if it was scaled
    this._fpsTracker.canvasDimensions = this._canvasManager.getDimensions(); // Update dimensions ref

    this._canvasManager.clearAllCanvases();
    this._renderBackgroundAndGrid(); // Renders to off-screen, marks dirty
    if (this.board.indexes.length) {
      this._renderPiecesAndHexagons(); // Renders to off-screen, marks dirty
    }

    this._setUpHitmap(); // Renders to off-screen (hitmap)
  }

  /**
   * @method _initResizeObserver - Initializes the ResizeObserver.
   */
  _initResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.resizeObserverInitialized) {
        this.resizeObserverInitialized = true;
        return;
      }

      this._canvasManager.setupSizes();
      this._fpsTracker.mainContext = this._canvasManager.getMainContext();
      this._fpsTracker.canvasDimensions = this._canvasManager.getDimensions();

      // Mark all relevant off-screen canvases dirty for redraw
      this._renderBackgroundAndGrid(); // Re-renders background/grid to its off-screen
      this._renderPiecesAndHexagons(); // Re-renders pieces to its off-screen
      this._setUpHitmap(); // Re-renders hitmap

      if (this._isShowingAvailablePositions) {
        // Re-apply mask based on current state
        const positions = [...this._showingAvailablePositions];
        this.clearAvailablePositions(false); // Clear without triggering render loop immediately
        this.showAvailablePositions(positions, undefined, false); // Show without triggering render loop immediately
      }
      if (this._isPreviewing) {
        const previews = new Map(this._previewingPositions);
        this.clearPreview(false);
        previews.forEach((piece, index) => {
          this.previewPiece(index, piece, undefined, false);
        });
      }
      this._renderLoop.markAllDirty(); // Ensure the loop picks up all changes

      this._triggerEvent('resize', {
        canvas: {
          width: this._canvasManager.getMainCanvas().width,
          height: this._canvasManager.getMainCanvas().height,
        },
        container: {
          width: this.container.clientWidth,
          height: this.container.clientHeight,
        },
      });
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * @method _initMutationObserver - Initializes the MutationObserver.
   */
  _initMutationObserver() {
    this.mutationObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach((removedNode) => {
            if (
              removedNode === this._canvasManager.getMainCanvas() ||
              removedNode === this.container
            ) {
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
  }

  /**
   * @method _initEventListeners - Initializes event listeners for the main canvas.
   */
  _initEventListeners() {
    const canvas = this._canvasManager.getMainCanvas();
    const getEventCoords = (event) => {
      const dpr = this._canvasManager.getRatios().devicePixelRatio;
      return { x: event.offsetX * dpr, y: event.offsetY * dpr };
    };

    canvas.addEventListener('dragover', (event) => {
      const coords = getEventCoords(event);
      event.preventDefault();
      this._triggerEvent(
        'dragover',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );
      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('dragoverAvailable', availablePiece);
      }
    });

    canvas.addEventListener('drop', (event) => {
      const coords = getEventCoords(event);
      event.preventDefault();
      this._triggerEvent(
        'drop',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );
      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('dropAvailable', availablePiece);
      }
    });

    canvas.addEventListener('click', (event) => {
      const coords = getEventCoords(event);
      this._triggerEvent(
        'click',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );
      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      );
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('clickAvailable', availablePiece);
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      const coords = getEventCoords(event);
      this._triggerEvent(
        'mousemove',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );
      const availablePiece = this._getPieceFromCoordinate(
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
   * @method _setUpBoardEventHandlers - Sets up board event listeners for rendering.
   */
  _setUpBoardEventHandlers() {
    const renderPieceHandler = (index, piece) => {
      this._renderPieceToOfflineCanvas(
        index,
        piece.colorsKey,
        this.map.tiles[index].flipped,
      );
      this._renderLoop.markDirty('pieces');
    };

    const renderPiecesAndHexagonsHandler = () => {
      this._renderPiecesAndHexagons(); // This internally marks 'pieces' dirty via its sub-calls
    };

    const renderHexagonsHandler = (hexagons) => {
      for (const hexagon of hexagons) {
        this._renderHexagonToOfflineCanvas(hexagon.coordinate, hexagon.color);
      }
      this._renderLoop.markDirty('pieces');
    };

    const clearBoardHandler = () => {
      this._clearBoardOfflineCanvas();
      this._renderLoop.markDirty('pieces');
    };

    this._registerBoardEventHandler('set', renderPieceHandler);
    this._registerBoardEventHandler('remove', renderPiecesAndHexagonsHandler);
    this._registerBoardEventHandler('form', renderHexagonsHandler);
    this._registerBoardEventHandler('destroy', renderPiecesAndHexagonsHandler);
    this._registerBoardEventHandler('clear', clearBoardHandler);
  }

  /**
   * @method _registerBoardEventHandler - Helper to add event listener to board and store handler.
   * @param {string} eventName - Name of the board event.
   * @param {Function} handler - The handler function.
   */
  _registerBoardEventHandler(eventName, handler) {
    const boundHandler = handler.bind(this);
    this.board.addEventListener(eventName, boundHandler);
    this.eventHandlers.set(eventName, boundHandler);
  }

  /**
   * @method _removeBoardEventHandlers - Removes all registered board event handlers.
   */
  _removeBoardEventHandlers() {
    this.eventHandlers.forEach((handler, eventName) => {
      this.board.removeEventListener(eventName, handler);
    });
    this.eventHandlers.clear();
  }

  /**
   * @method _renderBackgroundAndGrid - Renders background and grid to their off-screen canvas.
   */
  _renderBackgroundAndGrid() {
    const backgroundContext =
      this._canvasManager.getOffscreenContext('background');
    const { width: canvasWidth, height: canvasHeight } =
      this._canvasManager.getDimensions();

    backgroundContext.clearRect(
      0,
      0,
      canvasWidth * this._canvasManager.devicePixelRatio,
      canvasHeight * this._canvasManager.devicePixelRatio,
    );

    const bg = this._assetLoader.getBackground();
    const grid = this._assetLoader.getGrid();

    if (!bg || !grid) return; // Assets not loaded

    const bgWidth = bg.width;
    const bgHeight = bg.height;
    const bgRatio = bgWidth / bgHeight;
    let bgDrawWidth, bgDrawHeight, bgOffsetX, bgOffsetY;
    if (canvasWidth / canvasHeight > bgRatio) {
      bgDrawWidth = canvasWidth;
      bgDrawHeight = canvasWidth / bgRatio;
      bgOffsetX = 0;
      bgOffsetY = (canvasHeight - bgDrawHeight) / HALF;
    } else {
      bgDrawHeight = canvasHeight;
      bgDrawWidth = canvasHeight * bgRatio;
      bgOffsetX = (canvasWidth - bgDrawWidth) / HALF;
      bgOffsetY = 0;
    }
    backgroundContext.drawImage(
      bg,
      bgOffsetX,
      bgOffsetY,
      bgDrawWidth,
      bgDrawHeight,
    );

    const gridWidth = grid.width;
    const gridHeight = grid.height;
    const gridRatio = gridWidth / gridHeight;
    let gridDrawWidth, gridDrawHeight, gridOffsetX, gridOffsetY;
    if (canvasWidth / canvasHeight > gridRatio) {
      gridDrawHeight = canvasHeight;
      gridDrawWidth = canvasHeight * gridRatio;
      gridOffsetX = (canvasWidth - gridDrawWidth) / HALF;
      gridOffsetY = 0;
    } else {
      gridDrawWidth = canvasWidth;
      gridDrawHeight = canvasWidth / gridRatio;
      gridOffsetX = 0;
      gridOffsetY = (canvasHeight - gridDrawHeight) / HALF;
    }
    backgroundContext.drawImage(
      grid,
      gridOffsetX,
      gridOffsetY,
      gridDrawWidth,
      gridDrawHeight,
    );
    this._renderLoop.markDirty('background');
  }

  /**
   * @method _renderPiecesAndHexagons - Clears and re-renders all pieces and hexagons on the pieces off-screen canvas.
   */
  _renderPiecesAndHexagons() {
    this._clearBoardOfflineCanvas(); // Clears pieces off-screen
    this._renderAllPiecesToOfflineCanvas();
    this._renderAllHexagonsToOfflineCanvas();

    this._renderLoop.markDirty('pieces');
  }

  /**
   * @method _renderAllPiecesToOfflineCanvas - Renders all pieces from board to off-screen.
   */
  _renderAllPiecesToOfflineCanvas() {
    const pieces = this.board.indexes;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (piece) {
        const flipped = this.map.tiles[i].flipped;
        this._renderPieceToOfflineCanvas(i, piece.colorsKey, flipped);
      }
    }
  }

  /**
   * @method _renderPieceToOfflineCanvas - Renders a single piece to a specified off-screen canvas or default 'pieces'.
   * @param {number} index - The index of the piece.
   * @param {string} colorsKey - The color key.
   * @param {boolean} flipped - If the piece is flipped.
   * @param {string} [targetCanvasName='pieces'] - Name of the off-screen canvas ('pieces' or 'piecesPreview').
   * @param {string} [fillColor] - Optional fill color for hitmap or preview.
   * @throws {Error} - If the tile index is out of bounds or texture key is not found.
   */
  _renderPieceToOfflineCanvas(
    index,
    colorsKey,
    flipped,
    targetCanvasName = 'pieces',
    fillColor,
  ) {
    const tile = this.map.tiles[index];
    if (!tile) throw new Error(`Tile index ${index} out of bounds`);

    const textureKey = flipped ? `${colorsKey}-flipped` : colorsKey;
    const texture = this._assetLoader.getTexture('tiles', textureKey);
    if (!texture) {
      throw new Error(`Texture key "${textureKey}" not found in textures`);
    }

    const { widthRatio, heightRatio } = this._canvasManager.getRatios();
    const targetContext =
      this._canvasManager.getOffscreenContext(targetCanvasName);

    const x = tile.x * widthRatio;
    const y = tile.y * heightRatio;
    const imageWidth = texture.width;
    const imageHeight = texture.height;

    let width, height;
    if (tile.width !== undefined && tile.width !== null) {
      width = tile.width * widthRatio;
      height =
        tile.height !== undefined && tile.height !== null
          ? tile.height * heightRatio
          : (width * imageHeight) / imageWidth;
    } else if (tile.height !== undefined && tile.height !== null) {
      height = tile.height * heightRatio;
      width = (height * imageWidth) / imageHeight;
    } else {
      width = imageWidth * (widthRatio || 1);
      height = imageHeight * (heightRatio || 1);
    }

    if (!(width > 0 && height > 0)) return;

    const rotation = tile.rotation || 0;
    const angle = (rotation * Math.PI) / HALF_PI_DEGREES;

    targetContext.save();
    targetContext.translate(x + width / HALF, y + height / HALF);
    targetContext.rotate(angle);

    if (fillColor) {
      const tempCanvas = this._canvasManager.getOffscreenCanvas('temp');
      const tempCtx = this._canvasManager.getOffscreenContext('temp');
      tempCanvas.width = Math.max(1, Math.ceil(width));
      tempCanvas.height = Math.max(1, Math.ceil(height));

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

    if (targetCanvasName !== 'hitmap') {
      // Hitmap doesn't get rendered to main display
      this._renderLoop.markDirty(targetCanvasName);
    }
  }

  /**
   * @method _renderAllHexagonsToOfflineCanvas - Renders all complete hexagons to pieces off-screen.
   */
  _renderAllHexagonsToOfflineCanvas() {
    const hexagons = this.board.getCompleteHexagons();
    for (const hexagon of hexagons) {
      this._renderHexagonToOfflineCanvas(hexagon.coordinate, hexagon.color);
    }
  }

  /**
   * @method _renderHexagonToOfflineCanvas - Renders a single hexagon to pieces off-screen.
   * @param {Array<number>} coordinate - The hexagon coordinate.
   * @param {string} color - The color key.
   */
  _renderHexagonToOfflineCanvas(coordinate, color) {
    const hexagonMapData =
      this.map.hexagons[`${coordinate[0]}-${coordinate[1]}`];
    const texture = this._assetLoader.getTexture('hexagons', color);
    const { widthRatio, heightRatio } = this._canvasManager.getRatios();
    const piecesContext = this._canvasManager.getOffscreenContext('pieces');

    const x = hexagonMapData.x * widthRatio;
    const y = hexagonMapData.y * heightRatio;
    const imageWidth = texture.width;
    const imageHeight = texture.height;

    const width = hexagonMapData.width
      ? hexagonMapData.width * widthRatio
      : (hexagonMapData.height * heightRatio * imageWidth) / imageHeight;
    const height = hexagonMapData.height
      ? hexagonMapData.height * heightRatio
      : (hexagonMapData.width * widthRatio * imageHeight) / imageWidth;

    piecesContext.drawImage(texture, x, y, width, height);
    this._renderLoop.markDirty('pieces');
  }

  /**
   * @method _clearBoardOfflineCanvas - Clears the pieces off-screen canvas.
   */
  _clearBoardOfflineCanvas() {
    const piecesContext = this._canvasManager.getOffscreenContext('pieces');
    const { width, height } = this._canvasManager.getOffscreenCanvas('pieces');
    piecesContext.clearRect(0, 0, width, height);
    this._renderLoop.markDirty('pieces');
  }

  /**
   * @method _setUpHitmap - Sets up the hitmap off-screen canvas.
   */
  _setUpHitmap() {
    const hitmapContext = this._canvasManager.getOffscreenContext('hitmap');
    const { width, height } = this._canvasManager.getOffscreenCanvas('hitmap');
    hitmapContext.clearRect(0, 0, width, height);

    const pieceIndices = this.board.map.positions.map((_, index) => index);
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

      this._renderPieceToOfflineCanvas(
        index,
        'empty',
        this.map.tiles[index].flipped,
        'hitmap',
        hitColor,
      );
    }
  }

  /**
   * @method _getPieceFromCoordinate - Retrieves piece index from coordinate using hitmap.
   * @param {number} x - X coordinate (physical pixels).
   * @param {number} y - Y coordinate (physical pixels).
   * @param {boolean} [onlyAvailable=false] - Only consider available positions.
   * @returns {number} - Piece index or NOT_FOUND.
   */
  _getPieceFromCoordinate(x, y, onlyAvailable = false) {
    const hitmapContext = this._canvasManager.getOffscreenContext('hitmap');
    const imageData = hitmapContext.getImageData(x, y, 1, 1);
    const pixelData = imageData.data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[TWO]; // Index 2
    const alpha = pixelData[ALPHA_CHANNEL_INDEX];

    if (alpha === 0) return NOT_FOUND;

    const decodedGappedId =
      r | (g << BITS_PER_BYTE) | (b << BITS_PER_TWO_BYTES);
    if (decodedGappedId === 0) return NOT_FOUND;
    if ((decodedGappedId - 1) % COLOR_GAP_FACTOR !== 0) return NOT_FOUND;

    const pieceIndex = (decodedGappedId - 1) / COLOR_GAP_FACTOR;
    if (!(pieceIndex >= 0 && pieceIndex < this.board.map.positions.length)) {
      return NOT_FOUND;
    }

    if (onlyAvailable) {
      const availablePositions = new Set(this.board.getAvailablePositions());
      if (!availablePositions.has(pieceIndex)) return NOT_FOUND;
    }
    return pieceIndex;
  }

  /**
   * @method previewPiece - Renders a preview of a piece.
   * @param {number} index - Board position index.
   * @param {Piece} piece - Piece object.
   * @param {string} [fillColor='rgba(255, 255, 255, 0.5)'] - Preview overlay color.
   * @param {boolean} [markDirty=true] - Whether to mark the render loop dirty.
   * @throws {Error} - If the piece is invalid or if the index is out of bounds.
   */
  previewPiece(
    index,
    piece,
    fillColor = 'rgba(255, 255, 255, 0.5)',
    markDirty = true,
  ) {
    if (!piece || !piece.colorsKey) {
      throw new Error('Invalid piece object for preview');
    }

    const tile = this.map.tiles[index];
    if (!tile) throw new Error('Tile index out of bounds for preview');

    this._renderPieceToOfflineCanvas(
      index,
      piece.colorsKey,
      tile.flipped,
      'piecesPreview',
    );
    this._renderPieceToOfflineCanvas(
      index,
      piece.colorsKey,
      tile.flipped,
      'piecesPreview',
      fillColor,
    );

    this._isPreviewing = true;
    this._previewingPositions.set(index, piece);
    if (markDirty) this._renderLoop.markDirty('piecesPreview');
  }

  /**
   * @method clearPreview - Clears piece previews.
   * @param {boolean} [markDirty=true] - Whether to mark the render loop dirty.
   */
  clearPreview(markDirty = true) {
    const previewContext =
      this._canvasManager.getOffscreenContext('piecesPreview');
    const { width, height } =
      this._canvasManager.getOffscreenCanvas('piecesPreview');
    previewContext.clearRect(0, 0, width, height);

    this._isPreviewing = false;
    this._previewingPositions.clear();
    if (markDirty) this._renderLoop.markDirty('piecesPreview');
  }

  /**
   * @method showAvailablePositions - Highlights available positions.
   * @param {Array<number>} [positions=this.board.getAvailablePositions()] - Positions to highlight.
   * @param {string} [fillColor='rgba(0, 0, 0, 0.5)'] - Highlight mask color.
   * @param {boolean} [markDirty=true] - Whether to mark the render loop dirty.
   * @throws {Error} - If positions is not an array.
   */
  showAvailablePositions(
    positions = this.board.getAvailablePositions(),
    fillColor = 'rgba(0, 0, 0, 0.5)',
    markDirty = true,
  ) {
    if (!Array.isArray(positions)) {
      throw new Error(
        'positions must be an array of available position indexes',
      );
    }

    if (this._isShowingAvailablePositions) {
      this.clearAvailablePositions(false); // Clear without immediate render trigger
    }

    const maskContext = this._canvasManager.getOffscreenContext('mask');
    const { width: canvasPhysicalWidth, height: canvasPhysicalHeight } =
      this._canvasManager.getOffscreenCanvas('mask');

    maskContext.fillStyle = fillColor;
    maskContext.fillRect(0, 0, canvasPhysicalWidth, canvasPhysicalHeight);

    const { widthRatio, heightRatio } = this._canvasManager.getRatios();

    for (const index of positions) {
      const tile = this.map.tiles[index];
      if (!tile) continue;
      const texture = this._assetLoader.getTexture(
        'tiles',
        `${tile.flipped ? 'empty-flipped' : 'empty'}`,
      );
      if (!texture) continue;

      const x = tile.x * widthRatio;
      const y = tile.y * heightRatio;
      const imageWidth = texture.width;
      const imageHeight = texture.height;
      let width, height;
      if (tile.width !== undefined && tile.width !== null) {
        width = tile.width * widthRatio;
        height =
          tile.height !== undefined && tile.height !== null
            ? tile.height * heightRatio
            : (width * imageHeight) / imageWidth;
      } else if (tile.height !== undefined && tile.height !== null) {
        height = tile.height * heightRatio;
        width = (height * imageWidth) / imageHeight;
      } else {
        width = imageWidth * (widthRatio || 1);
        height = imageHeight * (heightRatio || 1);
      }
      if (!(width > 0 && height > 0)) continue;

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

    this._isShowingAvailablePositions = true;
    this._showingAvailablePositions = positions;
    if (markDirty) this._renderLoop.markDirty('mask');
  }

  /**
   * @method clearAvailablePositions - Clears highlights of available positions.
   * @param {boolean} [markDirty=true] - Whether to mark the render loop dirty.
   */
  clearAvailablePositions(markDirty = true) {
    const maskContext = this._canvasManager.getOffscreenContext('mask');
    const { width, height } = this._canvasManager.getOffscreenCanvas('mask');
    maskContext.clearRect(0, 0, width, height);

    this._isShowingAvailablePositions = false;
    this._showingAvailablePositions = [];
    if (markDirty) this._renderLoop.markDirty('mask');
  }

  /**
   * @method getTexture - Retrieves a texture.
   * @param {string} type - Texture type.
   * @param {string} key - Texture key.
   * @returns {HTMLImageElement} - The requested texture image element.
   * @throws {Error} - If textures have not been loaded yet, indicating assets are not ready.
   */
  getTexture(type, key) {
    return this._assetLoader.getTexture(type, key);
  }

  /**
   * @method updateBoard - Updates the board instance.
   * @param {Board} newBoard - The new board instance.
   * @throws {Error} - If newBoard is not a valid board instance.
   */
  updateBoard(newBoard) {
    if (!(newBoard instanceof Board)) {
      throw new Error('newBoard must be a valid board instance');
    }
    this._removeBoardEventHandlers();
    this.board = newBoard;
    this._setUpBoardEventHandlers();

    // Re-render based on new board
    this._canvasManager.setupSizes();
    this._renderPiecesAndHexagons();
    this._setUpHitmap();
  }

  /**
   * @method updateMap - Updates the game board map.
   * @param {Object} newMap - The new map object.
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
    this._canvasManager.updateMap(newMap); // Inform CanvasManager
    this._canvasManager.setupSizes(); // Recalculate sizes and ratios

    this._renderBackgroundAndGrid();
    this._renderPiecesAndHexagons();
    this._setUpHitmap();

    if (this._isShowingAvailablePositions) {
      const currentPositions = [...this._showingAvailablePositions];
      this.clearAvailablePositions(false);
      this.showAvailablePositions(currentPositions, undefined, false);
    }
    if (this._isPreviewing) {
      const currentPreviews = new Map(this._previewingPositions);
      this.clearPreview(false);
      currentPreviews.forEach((piece, index) =>
        this.previewPiece(index, piece, undefined, false),
      );
    }
    this._renderLoop.markAllDirty();
  }

  /**
   * @method updateTextures - Updates the texture pack.
   * @param {string} texturesUrl - URL of the new texture pack.
   * @returns {Promise<void>} - A promise that resolves when the new texture pack is loaded, pieces and hitmap are re-rendered.
   * @throws {Error} - If texturesUrl is not a string or if loading the texture pack fails.
   */
  async updateTextures(texturesUrl) {
    if (typeof texturesUrl !== 'string') {
      throw new Error('texturesUrl must be a string');
    }
    await this._assetLoader.updateTextures(texturesUrl);
    this._renderPiecesAndHexagons();
    this._setUpHitmap();
    if (this._isPreviewing) {
      const previews = new Map(this._previewingPositions);
      this.clearPreview(false); // Clear old preview with old textures
      previews.forEach((piece, index) =>
        this.previewPiece(index, piece, undefined, false),
      ); // Re-preview with new textures
    }
    if (this._isShowingAvailablePositions) {
      const positions = [...this._showingAvailablePositions];
      this.clearAvailablePositions(false);
      this.showAvailablePositions(positions, undefined, false);
    }
    this._renderLoop.markAllDirty();
  }

  /**
   * @method updateBackground - Updates the background image.
   * @param {string} backgroundUrl - URL of the new background image.
   * @returns {Promise<void>} - A promise that resolves when the new background image is loaded and the canvas is re-rendered.
   * @throws {Error} - If backgroundUrl is not a string or if loading the background image fails.
   */
  async updateBackground(backgroundUrl) {
    if (typeof backgroundUrl !== 'string') {
      throw new Error('backgroundUrl must be a string');
    }
    await this._assetLoader.updateBackground(backgroundUrl);
    this._renderBackgroundAndGrid(); // Re-renders to off-screen and marks dirty
  }

  /**
   * @method updateGrid - Updates the grid image.
   * @param {string} gridUrl - URL of the new grid image.
   * @returns {Promise<void>} - A promise that resolves when the new grid image is loaded and the canvas is re-rendered.
   * @throws {Error} - If gridUrl is not a string or if loading the grid image fails.
   */
  async updateGrid(gridUrl) {
    if (typeof gridUrl !== 'string') {
      throw new Error('gridUrl must be a string');
    }
    await this._assetLoader.updateGrid(gridUrl);
    this._renderBackgroundAndGrid(); // Re-renders to off-screen and marks dirty
  }

  /**
   * @method addEventListener - Adds an event listener.
   * @param {string} eventType - Event type.
   * @param {Function} listener - Listener function.
   * @param {Object} [options] - Options, e.g., { onlyAvailable: true }.
   * @throws {Error} - If eventType is not a valid event type.
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
   * @param {string} eventType - Event type.
   * @param {Function} listener - Listener function.
   * @throws {Error} - If eventType is not a valid event type, indicating an attempt to remove listener from a non-existent event.
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
   * @method getFPS - Returns the current FPS.
   * @returns {number} - The current frames per second.
   */
  getFPS() {
    return this._fpsTracker.getCurrentFPS();
  }

  /**
   * @method destroy - Tears down the renderer.
   */
  destroy() {
    if (this.isDestroyed) return;

    this._renderLoop.stop();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.mutationObserver) this.mutationObserver.disconnect();

    this._removeBoardEventHandlers();

    // Destroy helper modules
    if (this._canvasManager) this._canvasManager.destroy();
    if (this._assetLoader) this._assetLoader.destroy();
    if (this._renderLoop) this._renderLoop.destroy();

    // Clear event listeners sets
    for (const eventType in this.eventListeners) {
      this.eventListeners[eventType].clear();
    }

    // Nullify references
    this.board = null;
    this.map = null;
    this.container = null;
    this._canvasManager = null;
    this._assetLoader = null;
    this._fpsTracker = null;
    this._renderLoop = null;
    this.eventListeners = null;
    this.eventHandlers = null;
    this._showingAvailablePositions = null;
    this._previewingPositions = null;

    this.isDestroyed = true;
  }
}

module.exports = Renderer;
