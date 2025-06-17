/**
 * @fileoverview Texture Pack
 * @description This file contains the implementation of a texture pack for the Tridecco game rendering.
 */

/**
 * @class TexturePack - A class representing a texture pack for the Tridecco game board.
 */
class TexturePack {
  /**
   * @constructor
   * @param {string} indexUrl - The URL of the texture index JSON file.
   * @param {string} atlasUrl - The URL of the atlas image file.
   * @param {Function} callback - A callback function to be executed after loading the textures.
   * @throws {Error} - If urls are not strings, callback is not a function, or if not in a browser environment.
   */
  constructor(indexUrl, atlasUrl, callback = () => {}) {
    if (typeof indexUrl !== 'string') {
      throw new Error(
        'indexUrl must be a string representing the URL of the texture index file',
      );
    }
    if (typeof atlasUrl !== 'string') {
      throw new Error(
        'atlasUrl must be a string representing the URL of the atlas image file',
      );
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    if (typeof window === 'undefined') {
      throw new Error('TexturePack can only be used in a browser environment');
    }

    this.atlasImage = null;
    this.textureDefinitions = {
      tiles: null,
      hexagons: null,
    };

    this.loadTextures(indexUrl, atlasUrl, callback);
  }

  /**
   * @method loadTextures - Loads texture definitions from the index file and the atlas image.
   * @param {string} indexUrl - The URL of the texture index JSON file.
   * @param {string} atlasUrl - The URL of the atlas image file.
   * @param {Function} callback - The callback to execute after loading.
   */
  loadTextures(indexUrl, atlasUrl, callback) {
    fetch(indexUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch texture index from ${indexUrl}`);
        }
        return response.json(); // Parse the JSON response
      })
      .then((textureIndexData) => {
        this.textureDefinitions.tiles = textureIndexData.tiles || {};
        this.textureDefinitions.hexagons = textureIndexData.hexagons || {};

        const img = new Image();
        img.crossOrigin = 'anonymous'; // Set crossorigin attribute

        img.onload = () => {
          this.atlasImage = img;
          callback(null, this); // Execute the callback with the loaded TexturePack instance
        };

        img.onerror = (err) => {
          const error = new Error(
            `Failed to load atlas image from: ${atlasUrl}`,
          );
          console.error(error.message, err);
          callback(error, null);
        };

        img.src = atlasUrl;
      })
      .catch((error) => {
        // Handle fetch error or JSON parsing error
        console.error('Error loading texture definitions:', error);
        callback(error, null);
      });
  }

  /**
   * @method get - Retrieve a texture definition and the atlas image.
   * @param {string} type - The category of texture to retrieve (e.g., 'tiles', 'hexagons').
   * @param {string} key - The specific key of the texture. For nested structures or variants, use dot notation
   *                       (e.g., "blue-white" for a tile variant, "glow" for a static group, "glow.blue" for a static variant,
   *                       "particle" for a base animation, "flash" for an animated group, "flash.blue" for an animated variant).
   * @returns {{image: HTMLImageElement, definition: Object, scale?: number} | null} - An object containing the atlas image and the texture definition.
   *   The `definition` object structure varies:
   *     - For static texture leaves (e.g., a tile variant directly under `variants`): `{x, y, w, h}`.
   *     - For animated textures (base or variant): An object containing `frames` (Array of `{x,y,w,h}`),
   *       `fps` (number), and `range` (Array<number>).
   *     - For group nodes that have a `type` property (e.g., "static" or "animated"): The group object itself,
   *       which might contain a `variants` object (e.g., `{type: "static", variants: {...}}` or
   *       `{type: "animated", fps: ..., range: ..., variants: {...}}`).
   *   If a `scale` property is present on the resolved group or animation, it will also be included in the returned object.
   *   Returns `null` if the key is invalid or does not resolve to one of the above structures.
   */
  get(type, key) {
    if (
      !this.atlasImage ||
      !this.textureDefinitions.tiles ||
      !this.textureDefinitions.hexagons
    ) {
      console.warn(
        'TexturePack not fully loaded. Atlas image or definitions are missing.',
      );
      return null;
    }

    const parts = key.split('.');
    let current = this.textureDefinitions[type];

    if (!current) {
      console.error(`Invalid texture category: ${type}`);
      return null;
    }

    let parentAnimatedGroup = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }

      if (
        (current.type === 'static' || current.type === 'animated') &&
        current.variants &&
        current.variants.hasOwnProperty(part)
      ) {
        if (current.type === 'animated') {
          parentAnimatedGroup = current;
        } else {
          parentAnimatedGroup = null;
        }
        current = current.variants[part];
      } else if (current.hasOwnProperty(part)) {
        current = current[part];
        if (current && current.type === 'animated') {
          if (current.variants && !current.frames) {
            parentAnimatedGroup = current;
          } else if (current.frames) {
            parentAnimatedGroup = null;
          }
        } else {
          parentAnimatedGroup = null;
        }
      } else {
        current = undefined;
        break;
      }
    }

    let definition = current;

    if (definition === undefined) {
      console.warn(
        `Texture definition not found for type: ${type}, key: ${key}`,
      );
      return null;
    }

    if (
      parentAnimatedGroup &&
      definition &&
      typeof definition === 'object' &&
      definition.frames &&
      (!definition.hasOwnProperty('fps') || !definition.hasOwnProperty('range'))
    ) {
      definition = {
        ...definition,
        fps: definition.hasOwnProperty('fps')
          ? definition.fps
          : parentAnimatedGroup.fps,
        range: definition.hasOwnProperty('range')
          ? definition.range
          : parentAnimatedGroup.range,
        scale: definition.hasOwnProperty('scale')
          ? definition.scale
          : parentAnimatedGroup.scale,
      };
    }

    if (typeof definition === 'object' && definition !== null) {
      const result = { image: this.atlasImage, definition };

      if (definition.hasOwnProperty('scale')) {
        result.scale = definition.scale;
      } else if (
        parentAnimatedGroup &&
        parentAnimatedGroup.hasOwnProperty('scale')
      ) {
        result.scale = parentAnimatedGroup.scale;
      }

      if (
        definition.hasOwnProperty('x') &&
        definition.hasOwnProperty('y') &&
        definition.hasOwnProperty('w') &&
        definition.hasOwnProperty('h')
      ) {
        return result;
      } else if (
        definition.hasOwnProperty('frames') &&
        definition.hasOwnProperty('fps') &&
        definition.hasOwnProperty('range')
      ) {
        return result;
      } else if (definition.hasOwnProperty('type')) {
        return result;
      }
    }

    console.warn(
      `Final resolved definition for type '${type}', key '${key}' is not a recognized texture, typed group, or animation object:`,
      definition,
    );
    return null;
  }
}

module.exports = TexturePack;
