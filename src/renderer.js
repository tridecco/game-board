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
