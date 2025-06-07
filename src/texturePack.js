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
        img.src = atlasUrl;

        img.onload = () => {
          this.atlasImage = img;
          callback(this); // Execute the callback with the loaded TexturePack instance
        };

        img.onerror = (err) => {
          const error = new Error(
            `Failed to load atlas image from: ${atlasUrl}`,
          );
          console.error(error.message, err);
          callback(null, error); // Pass null to callback in case of image load error
        };
      })
      .catch((error) => {
        // Handle fetch error or JSON parsing error
        console.error('Error loading texture definitions:', error);
        callback(null, error); // Pass null to callback in case of error
      });
  }

  /**
   * @method get - Retrieve a texture definition and the atlas image.
   * @param {string} type - The type of texture to retrieve ('tiles' or 'hexagons').
   * @param {string} key - The key of the texture to retrieve (e.g., "blue-white" for tiles, or "glow.blue", "particle" for hexagons).
   * @returns {{image: HTMLImageElement, definition: Object}|null} - An object containing the atlas image and the texture definition if found, otherwise null. (The definition can be an object {x,y,w,h} or an array of such objects.)
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

    let definition;

    if (type === 'tiles') {
      definition = this.textureDefinitions.tiles[key];
    } else if (type === 'hexagons') {
      const parts = key.split('.');
      let current = this.textureDefinitions.hexagons;
      for (const part of parts) {
        if (
          current &&
          typeof current === 'object' &&
          current.hasOwnProperty(part)
        ) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
      definition = current;
    } else {
      console.error(`Invalid texture type: ${type}`);
      return null;
    }

    if (definition !== undefined) {
      return { image: this.atlasImage, definition: definition };
    } else {
      console.warn(
        `Texture definition not found for type: ${type}, key: ${key}`,
      );
      return null;
    }
  }
}

module.exports = TexturePack;
