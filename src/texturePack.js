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
   * @param {string} texturesUrl - The URL of the texture pack.
   * @param {Function} callback - A callback function to be executed after loading the textures.
   * @throws {Error} - If textures is not an string or if the callback is not a function or if the environment is not a browser.
   */
  constructor(texturesUrl, callback = () => {}) {
    if (typeof texturesUrl !== 'string') {
      throw new Error(
        'texturesUrl must be a string representing the URL of the texture pack',
      );
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    if (typeof window === 'undefined') {
      throw new Error('TexturePack can only be used in a browser environment');
    }

    this.textures = {
      tiles: new Map(),
      hexagons: new Map(),
    };

    this.loadTextures(texturesUrl, callback);
  }

  /**
   * @method loadTextures - Loads textures from the provided paths and stores them in the textures map.
   * @param {string} texturesUrl - The URL of the texture pack.
   * @param {Function} callback - The callback to execute after loading textures.
   */
  loadTextures(texturesUrl, callback) {
    fetch(`${texturesUrl}/index.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch texture index from ${texturesUrl}`);
        }
        return response.json(); // Parse the JSON response
      })
      .then((textures) => {
        const tiles = textures.tiles || {};
        const hexagons = textures.hexagons || {};

        const loadTilePromises = Object.entries(tiles).map(([key, path]) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Set crossorigin attribute
            img.src = `${texturesUrl}/${path}`;
            img.onload = () => {
              this.textures.tiles.set(key, img); // Store tile texture
              resolve();
            };
            img.onerror = () => {
              reject(new Error(`Failed to load tile texture: ${path}`));
            };
          });
        });

        const loadHexPromises = Object.entries(hexagons).map(([key, path]) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Set crossorigin attribute
            img.src = `${texturesUrl}/${path}`;
            img.onload = () => {
              this.textures.hexagons.set(key, img); // Store hexagon texture
              resolve();
            };
            img.onerror = () => {
              reject(new Error(`Failed to load hexagon texture: ${path}`));
            };
          });
        });

        // Wait for all tile and hexagon textures to load
        Promise.all([...loadTilePromises, ...loadHexPromises])
          .then(() => {
            // All textures loaded successfully
            callback(this); // Execute the callback with the loaded TexturePack instance
          })
          .catch((error) => {
            // Handle any error that occurred during loading
            console.error('Error loading textures:', error);
            callback(null, error); // Pass null to callback in case of error
          });
      })
      .catch((error) => {
        // Handle fetch error
        console.error('Error fetching texture index:', error);
        callback(null, error); // Pass null to callback in case of fetch error
      });
  }

  /**
   * @method get - Retrieve a texture by its type and key.
   * @param {string} type - The type of texture to retrieve ('tiles' or 'hexagons').
   * @param {string} key - The key of the texture to retrieve.
   * @returns {HTMLImageElement|null} - The texture image if found, otherwise null.
   */
  get(type, key) {
    // Retrieve a texture by its key
    if (type === 'tiles') {
      // Return tile texture
      return this.textures.tiles.get(key) || null;
    } else if (type === 'hexagons') {
      // Return hexagon texture
      return this.textures.hexagons.get(key) || null;
    } else {
      // Invalid type
      console.error(`Invalid texture type: ${type}`);
      return null;
    }
  }
}

module.exports = TexturePack;
