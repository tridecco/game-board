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

const PATH_SUFFIX_LENGTH = 2;

// Function to recursively collect images and their metadata from the JSON structure
async function collectImagesAndMetadata(
  currentNode,
  currentPathInOriginalJson,
  packBasePath,
  imagesList,
) {
  if (typeof currentNode === 'string') {
    console.warn(
      `Encountered string value at ${currentPathInOriginalJson.join('.')} directly. This structure is not fully supported by the new format. Please use object-based definitions.`,
    );
    if (currentPathInOriginalJson.length > 0) {
      const imageAbsPath = path.join(packBasePath, currentNode);
      try {
        if (!(await fs.pathExists(imageAbsPath))) {
          console.warn(`Image not found, skipping: ${imageAbsPath}`);
          return;
        }
        const metadata = await sharp(imageAbsPath, {
          limitInputPixels: false,
        }).metadata();
        imagesList.push({
          width: metadata.width,
          height: metadata.height,
          data: {
            outputPath: currentPathInOriginalJson,
            type: 'legacy_single_leaf',
            imageAbsPath: imageAbsPath,
          },
        });
      } catch (err) {
        console.error(
          `Error processing legacy single image ${imageAbsPath}:`,
          err.message,
        );
      }
    }
    return;
  }

  if (typeof currentNode === 'object' && currentNode !== null) {
    if (currentNode.type === 'static' && currentNode.variants) {
      for (const variantKey in currentNode.variants) {
        const imagePathString = currentNode.variants[variantKey];
        if (typeof imagePathString !== 'string') {
          console.warn(
            `Static variant ${variantKey} at ${currentPathInOriginalJson.join('.')} is not a string path.`,
          );
          continue;
        }
        const imageAbsPath = path.join(packBasePath, imagePathString);
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
              outputPath: [
                ...currentPathInOriginalJson,
                'variants',
                variantKey,
              ],
              type: 'static_leaf',
              imageAbsPath: imageAbsPath,
              originalNode: currentNode,
            },
          });
        } catch (err) {
          console.error(
            `Error processing static image ${imageAbsPath}:`,
            err.message,
          );
        }
      }
    } else if (currentNode.type === 'animated') {
      const { range, fps, ext, base, variants } = currentNode;
      if (!range || !fps || !ext || (!base && !variants)) {
        console.warn(
          `Malformed animated node at ${currentPathInOriginalJson.join('.')}: missing range, fps, ext, or base/variants.`,
        );
        return;
      }
      const [startFrame, endFrame] = range;

      if (base) {
        for (let i = 0; i <= endFrame - startFrame; i++) {
          const frameNumber = startFrame + i;
          const imageName = `${frameNumber}.${ext}`;
          const imageAbsPath = path.join(packBasePath, base, imageName);
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
                outputPath: currentPathInOriginalJson,
                type: 'animated_base_frame',
                frameIndex: i,
                imageAbsPath: imageAbsPath,
                originalAnimationNode: currentNode,
              },
            });
          } catch (err) {
            console.error(
              `Error processing base animation image ${imageAbsPath}:`,
              err.message,
            );
          }
        }
      } else if (variants) {
        for (const variantKey in variants) {
          const variantBasePath = variants[variantKey];
          if (typeof variantBasePath !== 'string') {
            console.warn(
              `Animated variant ${variantKey} at ${currentPathInOriginalJson.join('.')} base path is not a string.`,
            );
            continue;
          }
          for (let i = 0; i <= endFrame - startFrame; i++) {
            const frameNumber = startFrame + i;
            const imageName = `${frameNumber}.${ext}`;
            const imageAbsPath = path.join(
              packBasePath,
              variantBasePath,
              imageName,
            );
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
                  outputPath: [
                    ...currentPathInOriginalJson,
                    'variants',
                    variantKey,
                  ],
                  type: 'animated_variant_frame',
                  frameIndex: i,
                  imageAbsPath: imageAbsPath,
                  originalAnimationNode: currentNode,
                },
              });
            } catch (err) {
              console.error(
                `Error processing variant animation image ${imageAbsPath}:`,
                err.message,
              );
            }
          }
        }
      }
    } else {
      for (const key in currentNode) {
        if (Object.prototype.hasOwnProperty.call(currentNode, key)) {
          await collectImagesAndMetadata(
            currentNode[key],
            [...currentPathInOriginalJson, key],
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
      const coords = { x, y, w, h };

      const {
        outputPath,
        type,
        frameIndex,
        imageAbsPath,
        originalNode,
        originalAnimationNode,
      } = data;

      compositeOps.push({
        input: imageAbsPath,
        left: x,
        top: y,
      });

      let currentLevel = newIndex;
      let nodeToModify;

      if (type === 'legacy_single_leaf') {
        for (let i = 0; i < outputPath.length - 1; i++) {
          const part = outputPath[i];
          if (!currentLevel[part]) currentLevel[part] = {};
          currentLevel = currentLevel[part];
        }
        currentLevel[outputPath[outputPath.length - 1]] = coords;
      } else if (type === 'static_leaf') {
        let parentGroupNode = newIndex;
        for (let i = 0; i < outputPath.length - PATH_SUFFIX_LENGTH; i++) {
          const part = outputPath[i];
          if (!parentGroupNode[part]) parentGroupNode[part] = {};
          parentGroupNode = parentGroupNode[part];
        }
        if (!parentGroupNode.type) {
          parentGroupNode.type = originalNode.type;
          parentGroupNode.variants = {};
        }
        nodeToModify = parentGroupNode.variants;
        const leafKey = outputPath[outputPath.length - 1];
        nodeToModify[leafKey] = coords;
      } else if (type === 'animated_base_frame') {
        nodeToModify = newIndex;
        for (const part of outputPath) {
          if (!nodeToModify[part]) nodeToModify[part] = {};
          nodeToModify = nodeToModify[part];
        }
        if (!nodeToModify.frames) {
          nodeToModify.type = originalAnimationNode.type;
          nodeToModify.fps = originalAnimationNode.fps;
          nodeToModify.range = originalAnimationNode.range;
          nodeToModify.frames = [];
          delete nodeToModify.base;
          delete nodeToModify.ext;
          delete nodeToModify.variants;
        }
        while (nodeToModify.frames.length <= frameIndex) {
          nodeToModify.frames.push(null);
        }
        nodeToModify.frames[frameIndex] = coords;
      } else if (type === 'animated_variant_frame') {
        let animObjectNode = newIndex;
        const animObjectPath = outputPath.slice(
          0,
          outputPath.length - PATH_SUFFIX_LENGTH,
        );
        for (const part of animObjectPath) {
          if (!animObjectNode[part]) animObjectNode[part] = {};
          animObjectNode = animObjectNode[part];
        }
        if (!animObjectNode.type) {
          animObjectNode.type = originalAnimationNode.type;
          animObjectNode.fps = originalAnimationNode.fps;
          animObjectNode.range = originalAnimationNode.range;
          animObjectNode.variants = {};
          delete animObjectNode.base;
          delete animObjectNode.ext;
        }

        const variantKey = outputPath[outputPath.length - 1];
        if (!animObjectNode.variants[variantKey]) {
          animObjectNode.variants[variantKey] = { frames: [] };
        }
        nodeToModify = animObjectNode.variants[variantKey];
        while (nodeToModify.frames.length <= frameIndex) {
          nodeToModify.frames.push(null);
        }
        nodeToModify.frames[frameIndex] = coords;
      }
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
