/**
 * @fileoverview Game Renderer
 * @description This file contains the implementation of a game board renderer for the Tridecco game.
 */

const DEFAULT_ASSETS_URL =
  'https://cdn.jsdelivr.net/gh/tridecco/game-board@0.2.3/assets/';

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
    this.ratio = this.map.width / this.map.height; // Ratio of the map width to the map height
    this.widthRatio = null; // Ratio of the canvas width to the map width
    this.heightRatio = null; // Ratio of the canvas height to the map height

    this.offScreenCanvases = {
      background: new OffscreenCanvas(1, 1), // Background Image + Grid Image
      pieces: new OffscreenCanvas(1, 1), // Pieces + Hexagons
      piecesPreview: new OffscreenCanvas(1, 1), // Preview of pieces
      mask: new OffscreenCanvas(1, 1), // Mask for displaying avilable positions
      hitmap: new OffscreenCanvas(1, 1), // Hitmap for detecting pieces
      temp: new OffscreenCanvas(1, 1), // Temporary canvas for rendering
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

    this.background = null;
    this.grid = null;
    this.textures = null;

    this.requestedFrames = new Set(); // Store requested frames to avoid duplicate rendering

    this.resizeObserverInitialized = false;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.resizeObserverInitialized) {
        this.resizeObserverInitialized = true;
        return; // Skip the first call to avoid unnecessary rendering
      }
      if (this.requestedFrames.has('resize')) {
        return; // Skip if a frame is already requested
      }

      this.requestedFrames.add('resize');
      requestAnimationFrame(() => {
        this._setUpCanvas();
        this.requestedFrames.delete('resize');
      });

      this._triggerEvent('resize', {
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

    this.eventListeners = {
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
    this._initEventListeners(); // Initialize event listeners
    this.eventHandlers = new Map();

    this.isDestroyed = false; // Flag to check if the renderer is destroyed
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

    this._isPreviewing = false; // Flag to check if a piece is being previewed
    this._isShowingAvailablePositions = false; // Flag to check if available positions are being shown
    this._showingAvailablePositions = new Array(); // Store currently shown available positions
    this._previewingPositions = new Set(); // Store currently shown previewing positions

    this._setUpBoard();
    this._loadAssets(texturesUrl, backgroundUrl, gridUrl).then(() => {
      this._setUpCanvas();
      callback(this); // Call the callback function after loading assets and setting up the canvas
    });
  }

  /**
   * @method _initEventListeners - Initializes event listeners for the canvas.
   */
  _initEventListeners() {
    this.canvas.addEventListener('dragover', (event) => {
      const coords = {
        x: event.offsetX,
        y: event.offsetY,
      };
      event.preventDefault(); // Prevent default behavior to allow dropping
      this._triggerEvent(
        'dragover',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      ); // Only consider available pieces
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('dragoverAvailable', availablePiece);
      }
    });

    this.canvas.addEventListener('drop', (event) => {
      const coords = {
        x: event.offsetX,
        y: event.offsetY,
      };
      event.preventDefault(); // Prevent default behavior to allow dropping
      this._triggerEvent(
        'drop',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      ); // Only consider available pieces
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('dropAvailable', availablePiece);
      }
    });

    this.canvas.addEventListener('click', (event) => {
      const coords = {
        x: event.offsetX,
        y: event.offsetY,
      };
      this._triggerEvent(
        'click',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      ); // Only consider available pieces
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('clickAvailable', availablePiece);
      }
    });

    this.canvas.addEventListener('mousemove', (event) => {
      const coords = {
        x: event.offsetX,
        y: event.offsetY,
      };
      this._triggerEvent(
        'mousemove',
        this._getPieceFromCoordinate(coords.x, coords.y),
      );

      const availablePiece = this._getPieceFromCoordinate(
        coords.x,
        coords.y,
        true,
      ); // Only consider available pieces
      if (availablePiece !== NOT_FOUND) {
        this._triggerEvent('mousemoveAvailable', availablePiece);
      }
    });
  }

  /**
   * @method _triggerEvent - Trigger an event for a specific action.
   * @param {string} eventType - The type of event to trigger (dragover, dragoverAvailable, drop, dropAvailable, mousemove, mousemoveAvailable, click, clickAvailable, resize).
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
   * @method _setUpBoard - Sets up the board event listeners for rendering.
   */
  _setUpBoard() {
    const renderPiece = function renderPiece(index, piece) {
      this._renderPiece(index, piece.colorsKey, this.map.tiles[index].flipped);
      this._render();
    }.bind(this);

    const renderPiecesAndHexagons = function renderPiecesAndHexagons() {
      this._renderPiecesAndHexagons();
      this._render();
    }.bind(this);

    const renderHexagons = function renderHexagons(hexagons) {
      for (const hexagon of hexagons) {
        this._renderHexagon(hexagon.coordinate, hexagon.color);
      }
      this._render();
    }.bind(this);

    const clearBoard = function clearBoard() {
      this._clearBoard();
      this._render();
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
   * @method _loadAssets - Loads textures, background, and grid images.
   * @param {string} texturesUrl - The URL of the texture pack.
   * @param {string} backgroundUrl - The URL of the background image.
   * @param {string} gridUrl - The URL of the grid image.
   * @returns {Promise<void[]>} - A promise that resolves when all assets are loaded.
   */
  async _loadAssets(texturesUrl, backgroundUrl, gridUrl) {
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
   * @method _setUpCanvas - Sets up the canvas dimensions and renders initial elements.
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

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    const leftOffset = (containerWidth - canvasWidth) / HALF;
    const topOffset = (containerHeight - canvasHeight) / HALF;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${leftOffset}px`;
    this.canvas.style.top = `${topOffset}px`;

    if (!this.canvas.parentNode) {
      this.container.appendChild(this.canvas);
    }

    for (const key in this.offScreenCanvases) {
      this.offScreenCanvases[key].width = canvasWidth;
      this.offScreenCanvases[key].height = canvasHeight;
    }

    this.width = canvasWidth;
    this.height = canvasHeight;
    this.widthRatio = canvasWidth / this.map.width;
    this.heightRatio = canvasHeight / this.map.height;

    this._clearAllCanvases();
    this._renderBackgroundAndGrid();
    if (this.board.indexes.length) {
      this._renderPiecesAndHexagons();
    }
    if (this._isShowingAvailablePositions) {
      this.showAvailablePositions(this._showingAvailablePositions);
    }
    if (this._isPreviewing) {
      this._previewingPositions.forEach((index) => {
        const piece = this.board.get(index);
        if (piece) {
          this.previewPiece(index, piece);
        }
      });
    }
    this._setUpHitmap();
    this._render();
  }

  /**
   * @method _render - Renders the main canvas by drawing layers from off-screen canvases.
   */
  _render() {
    if (this.requestedFrames.has('render')) {
      return;
    }

    requestAnimationFrame(() => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(
        this.offScreenCanvases.background,
        0,
        0,
        this.width,
        this.height,
      );
      this.context.drawImage(
        this.offScreenCanvases.pieces,
        0,
        0,
        this.width,
        this.height,
      );
      this.context.drawImage(
        this.offScreenCanvases.piecesPreview,
        0,
        0,
        this.width,
        this.height,
      );
      this.context.drawImage(
        this.offScreenCanvases.mask,
        0,
        0,
        this.width,
        this.height,
      );

      this.requestedFrames.delete('render');
    });

    this.requestedFrames.add('render');
  }

  /**
   * @method _renderBackgroundAndGrid - Renders the background and grid images onto the background off-screen canvas.
   */
  _renderBackgroundAndGrid() {
    // Clear the background canvas
    const backgroundContext = this.offScreenContexts.background;
    backgroundContext.clearRect(
      0,
      0,
      this.offScreenCanvases.background.width,
      this.offScreenCanvases.background.height,
    );

    // Draw the background image (centered and fully covering the canvas)
    const bgWidth = this.background.width;
    const bgHeight = this.background.height;
    const bgRatio = bgWidth / bgHeight;

    let bgDrawWidth, bgDrawHeight, bgOffsetX, bgOffsetY;

    if (this.width / this.height > bgRatio) {
      // Canvas is wider than the background image ratio
      bgDrawWidth = this.width;
      bgDrawHeight = this.width / bgRatio;
      bgOffsetX = 0;
      bgOffsetY = (this.height - bgDrawHeight) / HALF;
    } else {
      // Canvas is taller than the background image ratio
      bgDrawHeight = this.height;
      bgDrawWidth = this.height * bgRatio;
      bgOffsetX = (this.width - bgDrawWidth) / HALF;
      bgOffsetY = 0;
    }

    backgroundContext.drawImage(
      this.background,
      bgOffsetX,
      bgOffsetY,
      bgDrawWidth,
      bgDrawHeight,
    );

    // Draw the grid image (centered and filling as much as possible without overflow)
    const gridWidth = this.grid.width;
    const gridHeight = this.grid.height;
    const gridRatio = gridWidth / gridHeight;

    let gridDrawWidth, gridDrawHeight, gridOffsetX, gridOffsetY;

    if (this.width / this.height > gridRatio) {
      // Canvas is wider than the grid image ratio
      gridDrawHeight = this.height;
      gridDrawWidth = this.height * gridRatio;
      gridOffsetX = (this.width - gridDrawWidth) / HALF;
      gridOffsetY = 0;
    } else {
      // Canvas is taller than the grid image ratio
      gridDrawWidth = this.width;
      gridDrawHeight = this.width / gridRatio;
      gridOffsetX = 0;
      gridOffsetY = (this.height - gridDrawHeight) / HALF;
    }

    backgroundContext.drawImage(
      this.grid,
      gridOffsetX,
      gridOffsetY,
      gridDrawWidth,
      gridDrawHeight,
    );
  }

  /**
   * @method _renderPiecesAndHexagons - Clears and re-renders all pieces and hexagons on the pieces off-screen canvas.
   */
  _renderPiecesAndHexagons() {
    this._clearBoard();
    this._renderPieces();
    this._renderHexagons();
  }

  /**
   * @method _renderPieces - Renders all pieces from the board's indexes onto the pieces off-screen canvas.
   */
  _renderPieces() {
    const pieces = this.board.indexes;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (piece) {
        const flipped = this.map.tiles[i].flipped;
        this._renderPiece(i, piece.colorsKey, flipped);
      }
    }
  }

  /**
   * @method _renderPiece - Renders a single game piece onto a specified canvas context.
   * @param {number} index - The index of the piece to render, corresponding to its position in the board's index array.
   * @param {string} colorsKey - The color key of the piece, used to retrieve the correct texture.
   * @param {boolean} flipped - A boolean indicating if the piece should be rendered flipped.
   * @param {CanvasRenderingContext2D} targetContext - The 2D rendering context of the canvas to draw onto.
   * @param {string} [fillColor] - Optional fill color to override texture colors, used for hitmap rendering.
   * @throws {Error} - If the index is out of bounds or if the texture for the piece is not found.
   */
  _renderPiece(
    index,
    colorsKey,
    flipped,
    targetContext = this.offScreenContexts.pieces,
    fillColor,
  ) {
    const tile = this.map.tiles[index];
    if (!tile) {
      throw new Error(`Tile index ${index} out of bounds`);
    }

    const textureKey = flipped ? `${colorsKey}-flipped` : colorsKey;
    const texture = this.textures.get('tiles', textureKey);
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
      const tempCanvas = this.offScreenCanvases.temp;
      const tempCtx = this.offScreenContexts.temp;

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
  }

  /**
   * @method _renderHexagons - Renders complete hexagons on the pieces off-screen canvas.
   */
  _renderHexagons() {
    const hexagons = this.board.getCompleteHexagons();
    for (const hexagon of hexagons) {
      this._renderHexagon(hexagon.coordinate, hexagon.color);
    }
  }

  /**
   * @method _renderHexagon - Renders a single hexagon onto the pieces off-screen canvas.
   * @param {Array<number>} coordinate - The column and row coordinate of the hexagon to render.
   * @param {string} color - The color key of the hexagon texture to use for rendering.
   */
  _renderHexagon(coordinate, color) {
    const hexagon = this.map.hexagons[`${coordinate[0]}-${coordinate[1]}`];
    const texture = this.textures.get('hexagons', color);
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

    this.offScreenContexts.pieces.drawImage(texture, x, y, width, height);
  }

  /**
   * @method _clearAllCanvases - Clears all off-screen canvases and the main display canvas.
   */
  _clearAllCanvases() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const key in this.offScreenCanvases) {
      this.offScreenContexts[key].clearRect(
        0,
        0,
        this.offScreenCanvases[key].width,
        this.offScreenCanvases[key].height,
      );
    }
  }

  /**
   * @method _clearBoard - Clears the pieces off-screen canvas, effectively removing all pieces and hexagons rendering.
   */
  _clearBoard() {
    this.offScreenContexts.pieces.clearRect(
      0,
      0,
      this.offScreenCanvases.pieces.width,
      this.offScreenCanvases.pieces.height,
    );
  }

  /**
   * @method _setUpHitmap - Sets up the hitmap by rendering each piece with a unique color ID onto the hitmap off-screen canvas.
   */
  _setUpHitmap() {
    this.offScreenContexts.hitmap.clearRect(
      0,
      0,
      this.offScreenCanvases.hitmap.width,
      this.offScreenCanvases.hitmap.height,
    );

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

      this._renderPiece(
        index,
        'empty',
        this.map.tiles[index].flipped,
        this.offScreenContexts.hitmap,
        hitColor,
      );
    }
  }

  /**
   * @method _getPieceFromCoordinate - Retrieves the index of a piece at a given canvas coordinate using the hitmap.
   * @param {number} x - The x coordinate on the canvas.
   * @param {number} y - The y coordinate on the canvas.
   * @param {boolean} [onlyAvailable=false] - Optional flag to only consider available positions.
   * @returns {number} - The index of the piece at the coordinate, or -1 if no piece is found.
   */
  _getPieceFromCoordinate(x, y, onlyAvailable = false) {
    const imageData = this.offScreenContexts.hitmap.getImageData(x, y, 1, 1);
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
    if (!piece || !piece.colorsKey) {
      throw new Error('Invalid piece object for preview');
    }

    const tile = this.map.tiles[index];
    if (!tile) {
      throw new Error('Tile index out of bounds for preview');
    }

    this._renderPiece(
      index,
      piece.colorsKey,
      tile.flipped,
      this.offScreenContexts.piecesPreview,
    );
    this._renderPiece(
      index,
      piece.colorsKey,
      tile.flipped,
      this.offScreenContexts.piecesPreview,
      fillColor,
    );

    this._render();
    this._isPreviewing = true;
    this._previewingPositions.add(index);
  }

  /**
   * @method clearPreview - Clears any piece previews currently rendered on the piecesPreview off-screen canvas.
   */
  clearPreview() {
    this.offScreenContexts.piecesPreview.clearRect(
      0,
      0,
      this.offScreenCanvases.piecesPreview.width,
      this.offScreenCanvases.piecesPreview.height,
    );
    this._render();
    this._isPreviewing = false;
    this._previewingPositions.clear();
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
    if (!Array.isArray(positions)) {
      throw new Error(
        'positions must be an array of available position indexes',
      );
    }

    if (this._isShowingAvailablePositions) {
      this.clearAvailablePositions(); // Clear existing highlights before showing new ones
    }

    const maskContext = this.offScreenContexts.mask;

    // Fill the entire canvas with a semi-transparent black overlay
    maskContext.fillStyle = fillColor;
    maskContext.fillRect(
      0,
      0,
      this.offScreenCanvases.mask.width,
      this.offScreenCanvases.mask.height,
    );

    // Use the empty texture as a stencil to "cut out" the available positions
    for (const index of positions) {
      const tile = this.map.tiles[index];
      if (!tile) {
        continue;
      }

      const texture = this.textures.get(
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

      // Ensure width and height are valid numbers > 0
      if (!(width > 0 && height > 0)) {
        continue;
      }

      const rotation = tile.rotation || 0;
      const angle = (rotation * Math.PI) / HALF_PI_DEGREES; // Convert degrees to radians

      maskContext.save();
      maskContext.translate(x + width / HALF, y + height / HALF);
      maskContext.rotate(angle);

      // Use the empty texture to clear the overlay at the available position
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

    // Render the mask canvas to the main canvas
    this._render();

    this._isShowingAvailablePositions = true; // Set the flag to indicate available positions are being shown
    this._showingAvailablePositions = positions; // Store the currently shown available positions
  }

  /**
   * @method clearAvailablePositions - Clears the highlight mask from the mask off-screen canvas, removing highlights of available positions.
   */
  clearAvailablePositions() {
    this.offScreenContexts.mask.clearRect(
      0,
      0,
      this.offScreenCanvases.mask.width,
      this.offScreenCanvases.mask.height,
    );
    this._render();

    this._isShowingAvailablePositions = false; // Reset the flag
    this._showingAvailablePositions = []; // Clear the stored available positions
  }

  /**
   * @method getTexture - Retrieves a texture from the loaded texture pack by type and key.
   * @param {string} type - The texture type (e.g., 'tiles', 'hexagons').
   * @param {string} key - The key of the texture image within the texture type.
   * @returns {HTMLImageElement} - The requested texture image element.
   * @throws {Error} - If textures have not been loaded yet, indicating assets are not ready.
   */
  getTexture(type, key) {
    if (!this.textures) {
      throw new Error('Textures not loaded yet');
    }
    return this.textures.get(type, key);
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

    // Recalculate the ratio based on the new map dimensions
    this.ratio = this.map.width / this.map.height;

    // Re-setup the board listeners to ensure they are using the new map
    this.board.removeEventListener('set', this.eventHandlers.get('set'));
    this.board.removeEventListener('remove', this.eventHandlers.get('remove'));
    this.board.removeEventListener('form', this.eventHandlers.get('form'));
    this.board.removeEventListener(
      'destroy',
      this.eventHandlers.get('destroy'),
    );
    this.board.removeEventListener('clear', this.eventHandlers.get('clear'));
    this.eventHandlers.clear(); // Clear old event listeners
    this._setUpBoard(); // Re-setup the board event listeners

    // Clear the board and re-render everything
    this._setUpCanvas(); // Re-setup canvas to apply new map dimensions
  }

  /**
   * @method updateTextures - Updates the texture pack used by the renderer, loading new textures from a given URL.
   * @param {string} texturesUrl - The URL from which to load the new texture pack.
   * @returns {Promise<void>} - A promise that resolves when the new texture pack is loaded, pieces and hitmap are re-rendered.
   * @throws {Error} - If texturesUrl is not a string or if loading the texture pack fails.
   */
  async updateTextures(texturesUrl) {
    if (typeof texturesUrl !== 'string') {
      throw new Error(
        'texturesUrl must be a string representing the URL of the texture pack',
      );
    }

    return new Promise((resolve, reject) => {
      this.textures = new TexturePack(
        texturesUrl,
        () => {
          this._renderPiecesAndHexagons(); // Re-render pieces and hexagons with new textures
          this._render(); // Re-render the main canvas to show the new textures
          this._setUpHitmap(); // Re-render the hitmap with new textures
          resolve();
        },
        (error) => {
          console.error('Error loading new texture pack:', error);
          reject(new Error('Failed to load new texture pack'));
        },
      );
    });
  }

  /**
   * @method updateBackground - Updates the background image of the renderer with a new image from the provided URL.
   * @param {string} backgroundUrl - The URL of the new background image to load.
   * @returns {Promise<void>} - A promise that resolves when the new background image is loaded and the canvas is re-rendered.
   * @throws {Error} - If backgroundUrl is not a string or if loading the background image fails.
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
        this._renderBackgroundAndGrid(); // Re-render the background and grid
        this._render(); // Re-render the main canvas to show the new background
        resolve();
      };
      newBackground.onerror = (error) => {
        console.error('Error loading new background image:', error);
        reject(new Error('Failed to load new background image'));
      };
    });
  }

  /**
   * @method updateGrid - Updates the grid image of the renderer with a new image from the provided URL.
   * @param {string} gridUrl - The URL of the new grid image to load.
   * @returns {Promise<void>} - A promise that resolves when the new grid image is loaded and the canvas is re-rendered.
   * @throws {Error} - If gridUrl is not a string or if loading the grid image fails.
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
        this._renderBackgroundAndGrid(); // Re-render the background and grid
        this._render(); // Re-render the main canvas to show the new grid
        resolve();
      };
      newGrid.onerror = (error) => {
        console.error('Error loading new grid image:', error);
        reject(new Error('Failed to load new grid image'));
      };
    });
  }

  /**
   * @method addEventListener - Adds a listener for specific renderer events, enabling custom actions on events like piece placement.
   * @param {string} eventType - The event type to listen for (dragover, drop, mousemove, click, resize).
   * @param {Function} listener - The function to execute when the event is triggered; receives event-specific arguments.
   * @param {Object} [options] - Optional parameters, including `onlyAvailable: true` to filter events to available positions only.
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
   * @method removeEventListener - Removes a previously added event listener for a given event type, preventing further execution on that event.
   * @param {string} eventType - The event type from which to remove the listener.
   * @param {Function} listener - The listener function to be removed.
   * @throws {Error} - If eventType is not a valid event type, indicating an attempt to remove listener from a non-existent event.
   */
  removeEventListener(eventType, listener) {
    if (!this.eventListeners[eventType]) {
      throw new Error('Invalid event type');
    }

    this.eventListeners[eventType].delete(listener);
  }

  /**
   * @method destroy - Tears down the renderer, releasing resources, removing listeners, and detaching the canvas from the DOM.
   */
  destroy() {
    // Remove event listeners from the board
    this.board.removeEventListener('set', this.eventHandlers.get('set'));
    this.board.removeEventListener('remove', this.eventHandlers.get('remove'));
    this.board.removeEventListener('form', this.eventHandlers.get('form'));
    this.board.removeEventListener(
      'destroy',
      this.eventHandlers.get('destroy'),
    );
    this.board.removeEventListener('clear', this.eventHandlers.get('clear'));

    // Clear event handlers map
    this.eventHandlers.clear();

    // Remove all event listeners from the renderer
    for (const eventType in this.eventListeners) {
      this.eventListeners[eventType].clear();
    }

    // Clear all canvases
    this._clearAllCanvases();

    // Stop observing the container resize
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Stop observing mutation events
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    // Remove the canvas from the container
    if (this.canvas.parentNode) {
      this.container.removeChild(this.canvas);
    }

    // Nullify references to free up memory
    this.canvas = null;
    this.context = null;
    for (const key in this.offScreenCanvases) {
      this.offScreenCanvases[key] = null;
      this.offScreenContexts[key] = null;
    }
    this.offScreenCanvases = null;
    this.offScreenContexts = null;

    this.board = null;
    this.map = null;
    this.container = null;
    this.background = null;
    this.grid = null;
    this.textures = null;

    this.resizeObserverInitialized = false;
    this.requestedFrames.clear();
    this.requestedFrames = null;

    this.eventListeners = null;

    this._isPreviewing = false;
    this._isShowingAvailablePositions = false;
    this._showingAvailablePositions = null;

    this._previewingPositions.clear();
    this._previewingPositions = null;
  }
}

module.exports = Renderer;
