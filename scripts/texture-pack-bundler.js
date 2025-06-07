/**
 * @fileoverview Texture Pack Bundler
 * @description This script bundles texture files into a single image and generates a index file.
 */

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const { MaxRectsPacker } = require('maxrects-packer');

const INPUT_TEXTURES_DIR = path.resolve(
  __dirname,
  '../assets/textures/classic',
);
const OUTPUT_BUNDLES_DIR = path.resolve(
  __dirname,
  '../assets/textures-bundle/classic',
);

const ATLAS_MAX_WIDTH = 16384; // Max width for the atlas
const ATLAS_MAX_HEIGHT = 16384; // Max height for the atlas
const ATLAS_PADDING = 1; // Padding between images in the atlas

// Function to set a value in a nested object based on a path array
function setValueInNestedObject(
  obj,
  pathParts,
  valueCoords,
  type,
  frameIndex,
  originalAnimationObject,
) {
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  const lastPart = pathParts[pathParts.length - 1];
  if (type === 'single') {
    current[lastPart] = valueCoords;
  } else if (type === 'sequence') {
    if (!current[lastPart] || !Array.isArray(current[lastPart])) {
      current[lastPart] = []; // Initialize as an array for sequence frames
    }

    while (current[lastPart].length <= frameIndex) {
      current[lastPart].push(null);
    }
    current[lastPart][frameIndex] = valueCoords;
  } else if (type === 'object_sequence') {
    if (
      !current[lastPart] ||
      typeof current[lastPart] !== 'object' ||
      current[lastPart].frames === undefined ||
      !Array.isArray(current[lastPart].frames)
    ) {
      current[lastPart] = { ...originalAnimationObject };
      current[lastPart].frames = [];
    }

    while (current[lastPart].frames.length <= frameIndex) {
      current[lastPart].frames.push(null);
    }
    current[lastPart].frames[frameIndex] = valueCoords;
  }
}

// Function to recursively collect images and their metadata from the JSON structure
async function collectImagesAndMetadata(
  node,
  currentJsonPath,
  packBasePath,
  imagesList,
) {
  for (const key in node) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const value = node[key];
      const newJsonPath = [...currentJsonPath, key];

      if (typeof value === 'string') {
        const sequenceMatch = value.match(/^(.*?)\[(\d+)-(\d+)\](\.\w+)$/);
        if (sequenceMatch) {
          const SEQUENCE_PREFIX_INDEX = 1;
          const SEQUENCE_START_INDEX = 2;
          const SEQUENCE_END_INDEX = 3;
          const SEQUENCE_EXTENSION_INDEX = 4;

          const filePathPrefix = sequenceMatch[SEQUENCE_PREFIX_INDEX];
          const startFrame = parseInt(sequenceMatch[SEQUENCE_START_INDEX], 10);
          const endFrame = parseInt(sequenceMatch[SEQUENCE_END_INDEX], 10);
          const extension = sequenceMatch[SEQUENCE_EXTENSION_INDEX];

          for (let i = 0; i <= endFrame - startFrame; i++) {
            const frameNumber = startFrame + i;
            const imageName = `${filePathPrefix}${frameNumber}${extension}`;
            const imageAbsPath = path.join(packBasePath, imageName);
            try {
              if (!(await fs.pathExists(imageAbsPath))) {
                console.warn(`Image not found, skipping: ${imageAbsPath}`);
                continue;
              }
              const metadata = await sharp(imageAbsPath, {
                limitInputPixels: false,
              }).metadata();
              imagesList.push({
                width: metadata.width,
                height: metadata.height,
                data: {
                  jsonPath: newJsonPath,
                  type: 'sequence',
                  frameIndex: i,
                  imageAbsPath: imageAbsPath,
                },
              });
            } catch (err) {
              console.error(
                `Error processing sequence image ${imageAbsPath}:`,
                err.message,
              );
            }
          }
        } else {
          const imageAbsPath = path.join(packBasePath, value);
          try {
            if (!(await fs.pathExists(imageAbsPath))) {
              console.warn(`Image not found, skipping: ${imageAbsPath}`);
              continue;
            }
            const metadata = await sharp(imageAbsPath, {
              limitInputPixels: false,
            }).metadata();
            imagesList.push({
              width: metadata.width,
              height: metadata.height,
              data: {
                jsonPath: newJsonPath,
                type: 'single',
                imageAbsPath: imageAbsPath,
              },
            });
          } catch (err) {
            console.error(
              `Error processing single image ${imageAbsPath}:`,
              err.message,
            );
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        if (
          value.hasOwnProperty('frames') &&
          typeof value.frames === 'string'
        ) {
          const framesString = value.frames;
          const sequenceMatch = framesString.match(
            /^(.*?)\[(\d+)-(\d+)\](\.\w+)$/,
          );

          if (sequenceMatch) {
            const SEQUENCE_PREFIX_INDEX = 1;
            const SEQUENCE_START_INDEX = 2;
            const SEQUENCE_END_INDEX = 3;
            const SEQUENCE_EXTENSION_INDEX = 4;

            const filePathPrefix = sequenceMatch[SEQUENCE_PREFIX_INDEX];
            const startFrame = parseInt(
              sequenceMatch[SEQUENCE_START_INDEX],
              10,
            );
            const endFrame = parseInt(sequenceMatch[SEQUENCE_END_INDEX], 10);
            const extension = sequenceMatch[SEQUENCE_EXTENSION_INDEX];

            for (let i = 0; i <= endFrame - startFrame; i++) {
              const frameNumber = startFrame + i;
              const imageName = `${filePathPrefix}${frameNumber}${extension}`;
              const imageAbsPath = path.join(packBasePath, imageName);
              try {
                if (!(await fs.pathExists(imageAbsPath))) {
                  console.warn(`Image not found, skipping: ${imageAbsPath}`);
                  continue;
                }
                const metadata = await sharp(imageAbsPath, {
                  limitInputPixels: false,
                }).metadata();
                imagesList.push({
                  width: metadata.width,
                  height: metadata.height,
                  data: {
                    jsonPath: newJsonPath,
                    type: 'object_sequence',
                    frameIndex: i,
                    imageAbsPath: imageAbsPath,
                    originalAnimationObject: value,
                  },
                });
              } catch (err) {
                console.error(
                  `Error processing object sequence image ${imageAbsPath}:`,
                  err.message,
                );
              }
            }
          } else {
            console.warn(
              `Object at '${newJsonPath.join('.')}' has a 'frames' property ('${framesString}') that is not a valid sequence string. Attempting to process as regular object.`,
            );
            await collectImagesAndMetadata(
              value,
              newJsonPath,
              packBasePath,
              imagesList,
            );
          }
        } else {
          await collectImagesAndMetadata(
            value,
            newJsonPath,
            packBasePath,
            imagesList,
          );
        }
      }
    }
  }
}

// Function to process a single texture pack
async function processTexturePack(packName) {
  console.log(`Processing texture pack: ${packName}...`);
  const packInputPath = path.join(INPUT_TEXTURES_DIR, packName);
  const indexJsonPath = path.join(packInputPath, 'index.json');

  const packOutputPath = path.join(OUTPUT_BUNDLES_DIR, packName);
  const outputIndexJsonPath = path.join(packOutputPath, 'index.json');
  const outputAtlasPathPng = path.join(packOutputPath, 'atlas.png'); // PNG atlas file
  const outputAtlasPathWebP = path.join(packOutputPath, 'atlas.webp'); // WebP atlas file

  try {
    if (!(await fs.pathExists(indexJsonPath))) {
      console.error(
        `index.json not found for pack: ${packName} at ${indexJsonPath}`,
      );
      return;
    }

    await fs.ensureDir(packOutputPath);
    const originalIndex = await fs.readJson(indexJsonPath);
    const imagesToPack = [];

    await collectImagesAndMetadata(
      originalIndex,
      [],
      packInputPath,
      imagesToPack,
    );

    console.log(
      `Collected ${imagesToPack.length} image entries to pack for ${packName}.`,
    );

    if (imagesToPack.length === 0) {
      console.log(
        `No images found or collected for ${packName}. Writing empty index.`,
      );
      await fs.writeJson(outputIndexJsonPath, {}, { spaces: 4 });
      return;
    }

    const packer = new MaxRectsPacker(
      ATLAS_MAX_WIDTH,
      ATLAS_MAX_HEIGHT,
      ATLAS_PADDING,
      {
        smart: true,
        pot: false,
        square: false,
        allowRotation: false,
      },
    );

    packer.addArray(
      imagesToPack.map((img) => ({
        width: img.width,
        height: img.height,
        data: img.data,
      })),
    );

    console.log(
      `Packer created ${packer.bins.length} bin(s) for ${packName}. Target is 1 bin.`,
    );

    if (packer.bins.length === 0 && imagesToPack.length > 0) {
      console.error(
        `No bins created by packer for ${packName}, though images were provided. Check image sizes and atlas dimensions.`,
      );
      return;
    }
    if (packer.bins.length === 0) {
      console.log(`No images to pack into atlas for ${packName}.`);
      await fs.writeJson(outputIndexJsonPath, {}, { spaces: 4 });
      return;
    }

    if (packer.bins.length > 1) {
      console.error(
        `Error: Pack ${packName} resulted in ${packer.bins.length} atlases. All images could not fit into a single atlas of ${ATLAS_MAX_WIDTH}x${ATLAS_MAX_HEIGHT}.`,
      );
    }

    const bin = packer.bins[0];
    console.log(
      `Bin 0 for ${packName} has ${bin.rects.length} rects. Atlas dimensions: ${bin.width}x${bin.height}`,
    );

    const atlasWidth = bin.width;
    const atlasHeight = bin.height;

    if (atlasWidth === 0 || atlasHeight === 0) {
      console.warn(
        `Atlas for ${packName} has zero width or height. Skipping atlas generation.`,
      );
      await fs.writeJson(outputIndexJsonPath, {}, { spaces: 4 });
      return;
    }

    const compositeOps = [];
    const newIndex = {};

    for (const rect of bin.rects) {
      const { x, y, width: w, height: h, data } = rect;
      const {
        jsonPath,
        type,
        frameIndex,
        imageAbsPath,
        originalAnimationObject,
      } = data;

      compositeOps.push({
        input: imageAbsPath,
        left: x,
        top: y,
      });

      const coords = { x, y, w, h };
      setValueInNestedObject(
        newIndex,
        jsonPath,
        coords,
        type,
        frameIndex,
        originalAnimationObject,
      );
    }

    if (compositeOps.length > 0) {
      const sharpInstance = sharp({
        limitInputPixels: false,
        create: {
          width: atlasWidth,
          height: atlasHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      }).composite(compositeOps);

      // Generate PNG atlas
      await sharpInstance
        .clone()
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outputAtlasPathPng);
      console.log(`Atlas created for ${packName} at ${outputAtlasPathPng}`);

      // Generate WebP atlas
      await sharpInstance
        .clone()
        .webp({ quality: 85, lossless: false })
        .toFile(outputAtlasPathWebP);
      console.log(
        `WebP atlas created for ${packName} at ${outputAtlasPathWebP}`,
      );
    } else if (bin.rects.length > 0) {
      console.warn(
        `No images were composited for ${packName}, though rects were present. Atlas not created.`,
      );
    }

    await fs.writeJson(outputIndexJsonPath, newIndex, { spaces: 4 });
    console.log(
      `Bundled index created for ${packName} at ${outputIndexJsonPath}`,
    );
  } catch (error) {
    console.error(`Failed to process texture pack ${packName}:`, error);
  }
}

// Main function to process all texture packs
async function main() {
  try {
    await fs.ensureDir(OUTPUT_BUNDLES_DIR);
    const packNames = await fs.readdir(INPUT_TEXTURES_DIR);

    for (const packName of packNames) {
      const packFullPath = path.join(INPUT_TEXTURES_DIR, packName);
      const stat = await fs.stat(packFullPath);
      if (stat.isDirectory()) {
        await processTexturePack(packName);
      }
    }
    console.log('All texture packs processed.');
  } catch (error) {
    console.error('Error during texture pack bundling:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Unhandled error in main execution:', err);
    process.exit(1);
  });
}
