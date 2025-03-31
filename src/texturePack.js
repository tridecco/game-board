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
   * @param {Object} textures - An object containing texture paths for the game.
   * @param {Function} callback - A callback function to be executed after the texture pack is loaded.
   * @throws {Error} If textures is not an object or if callback is not a function or the environment not browser.
   */
  constructor(textures, callback) {
    if (typeof textures !== 'object' || textures === null) {
      throw new Error('textures must be a non-null object');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    if (typeof window === 'undefined') {
      throw new Error('TexturePack can only be used in a browser environment');
    }

    this.textures = new Map();

    this.loadTextures(textures, callback);
  }

  /**
   * @method loadTextures - Loads textures from the provided paths and stores them in the textures map.
   * @param {Object} textures - An object containing texture paths.
   * @param {Function} callback - The callback to execute after loading textures.
   */
  loadTextures(textures, callback) {
    const loadPromises = Object.entries(textures).map(([key, path]) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
          this.textures.set(key, img);
          resolve();
        };
        img.onerror = (error) => {
          reject(new Error(`Failed to load texture: ${path}`));
        };
      });
    });

    // Wait for all textures to load
    Promise.all(loadPromises)
      .then(() => {
        // All textures loaded successfully
        callback(this);
      })
      .catch((error) => {
        // Handle any error that occurred during loading
        console.error('Error loading textures:', error);
        callback(null, error); // Pass null to callback in case of error
      });
  }

  /**
   * @method get - Retrieve a texture by its key.
   * @param {string} key - The key of the texture to retrieve.
   * @returns {HTMLImageElement|null} - The texture image if found, otherwise null.
   */
  get(key) {
    // Retrieve a texture by its key
    if (this.textures.has(key)) {
      return this.textures.get(key);
    } else {
      console.warn(`Texture with key "${key}" not found`);
      return null; // Return null if the texture is not found
    }
  }
}

module.exports = TexturePack;
