# Available Assets Documentation

The Tridecco Game Board provides a range of readily available assets to enhance the visual experience of the game. These assets include background images, grid designs, and texture packs for game pieces and hexagons.

## Backgrounds

Background images are used to set the visual theme of the game board. The following backgrounds are available:

- **wooden-board.jpg**: A traditional wooden board texture (default).
- **broken-glass.jpg**: A shattered glass texture.
- **composite-board.jpg**: A composite material board texture.
- **frosted-glass.jpg**: A frosted glass texture.
- **galaxy.jpg**: A space-themed galaxy texture.
- **gold-leaf.jpg**: A luxurious gold leaf texture.
- **leather.jpg**: A classic leather texture.
- **log.jpg**: A wooden log texture.
- **marble.jpg**: A polished marble texture.
- **metal-plate.jpg**: A metallic plate texture.
- **sand.jpg**: A sandy texture.

### Filepath

All background images are located in the `assets/backgrounds/` directory.

## Grids

Grid images are used to define the layout of the game board. The following grid designs are available:

- **black.png**: A black grid (default).
- **blue.png**: A blue grid.
- **cyan.png**: A cyan grid.
- **green.png**: A green grid.
- **magenta.png**: A magenta grid.
- **red.png**: A red grid.
- **white.png**: A white grid.
- **yellow.png**: A yellow grid.

### Filepath

All grid images are located in the `assets/grids/` directory.

## Texture Packs

Texture packs define the appearance of game pieces and hexagons. The following texture packs are available:

### Classic

- **Normal**: A standard texture pack with detailed designs. (default)

  - Hexagons and tiles are included.
  - Index File: `index.json`.

- **RGB Blind**: A texture pack designed for Red-Green-Blue color blindness, providing high contrast and distinct patterns.

  - Hexagons and tiles are included.
  - Index File: `index.json`.

- **Monochrome**: A texture pack designed for Monochrome vision, using shades of gray to ensure visibility for players with color blindness.

  - Hexagons and tiles are included.
  - Index File: `index.json`.

### Filepath

All texture packs are located in the `assets/textures/` directory, organized by theme (`classic/monochrome`, `classic/normal`, `classic/rgbblind`).

## CDN Assets

For convenience, the available assets are also hosted on jsDelivr CDN:

- **Base URL**: `https://cdn.jsdelivr.net/gh/tridecco/game-board@v0.2.0/assets/`

## Customization

Refer to the [API documentation](API.md) for instructions on how to replace default assets with custom images. You can easily swap out any of the default backgrounds, grids, or texture packs by providing the new asset paths in your game board configuration.
