# API Documentation

## Overview

This document provides a comprehensive guide to the API of the Tridecco Game Board library.

## Table of Contents

- [API Documentation](#api-documentation)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Import the Library](#import-the-library)
    - [Node.js](#nodejs)
    - [Browser](#browser)
  - [Hexagonal Grid](#hexagonal-grid)
    - [Constructor](#constructor)
      - [Example](#example)
    - [`get(col, row)`](#getcol-row)
      - [Example](#example-1)
    - [`set(col, row, value)`](#setcol-row-value)
      - [Example](#example-2)
    - [`remove(col, row)`](#removecol-row)
      - [Example](#example-3)
    - [`getAdjacents(col, row)`](#getadjacentscol-row)
      - [Example](#example-4)
    - [`forEach(callback)`](#foreachcallback)
      - [Example](#example-5)
    - [`clone()`](#clone)
      - [Example](#example-6)
    - [`clear()`](#clear)
      - [Example](#example-7)
  - [Triangular Hexagonal Grid](#triangular-hexagonal-grid)
    - [Constructor](#constructor-1)
      - [Example](#example-8)
    - [`get(col, row, triangle)`](#getcol-row-triangle)
      - [Example](#example-9)
    - [`set(positions, value)`](#setpositions-value)
      - [Example](#example-10)
    - [`remove(positions)`](#removepositions)
      - [Example](#example-11)
    - [`getHexagon(col, row)`](#gethexagoncol-row)
      - [Example](#example-12)
    - [`setHexagon(col, row, values)`](#sethexagoncol-row-values)
      - [Example](#example-13)
    - [`removeHexagon(col, row)`](#removehexagoncol-row)
      - [Example](#example-14)
    - [`isFull(col, row)`](#isfullcol-row)
      - [Example](#example-15)
    - [`clone()`](#clone-1)
      - [Example](#example-16)
  - [Game Board](#game-board)
    - [Constructor](#constructor-2)
      - [Example](#example-17)
    - [`get(index)`](#getindex)
      - [Example](#example-18)
    - [`set(index, value)`](#setindex-value)
      - [Example](#example-19)
    - [`place(index, value)`](#placeindex-value)
      - [Example](#example-20)
    - [`remove(index)`](#removeindex)
      - [Example](#example-21)
    - [`getRelatedHexagons(index)`](#getrelatedhexagonsindex)
      - [Example](#example-22)
    - [`getRandomPosition(isEdge, excludedIndexes)`](#getrandompositionisedge-excludedindexes)
      - [Example](#example-23)
    - [`getEmptyPositions()`](#getemptypositions)
      - [Example](#example-24)
    - [`getOccupiedPositions()`](#getoccupiedpositions)
      - [Example](#example-25)
    - [`getAdjacentPositions()`](#getadjacentpositions)
      - [Example](#example-26)
    - [`getAvailablePositions()`](#getavailablepositions)
      - [Example](#example-27)
    - [`getHexagonPositions(piece)`](#gethexagonpositionspiece)
      - [Example](#example-28)
    - [`getHexagonsFormed(index, piece)`](#gethexagonsformedindex-piece)
      - [Example](#example-29)
    - [`countHexagonsFormed(index, piece)`](#counthexagonsformedindex-piece)
      - [Example](#example-30)
    - [`isEmpty(index)`](#isemptyindex)
      - [Example](#example-31)
    - [`isCompleteHexagon(col, row)`](#iscompletehexagoncol-row)
      - [Example](#example-32)
    - [`getCompleteHexagons()`](#getcompletehexagons)
      - [Example](#example-33)
    - [`addEventListener(event, callback)`](#addeventlistenerevent-callback)
      - [Example](#example-34)
    - [`removeEventListener(event, callback)`](#removeeventlistenerevent-callback)
      - [Example](#example-35)
    - [`back(steps)`](#backsteps)
      - [Example](#example-36)
    - [`clone(options)`](#cloneoptions)
      - [Example](#example-37)
    - [`clear()`](#clear-1)
      - [Example](#example-38)
    - [`toJSON(options)`](#tojsonoptions)
      - [Example](#example-39)
    - [`fromJSON(json)` (static)](#fromjsonjson-static)
      - [Example](#example-40)
  - [Game Piece](#game-piece)
    - [Constructor](#constructor-3)
      - [Example](#example-41)
    - [`equals(other)`](#equalsother)
      - [Example](#example-42)
    - [`clone()`](#clone-2)
      - [Example](#example-43)
    - [`toJSON()`](#tojson)
      - [Example](#example-44)
    - [`fromJSON(json)` (static)](#fromjsonjson-static-1)
      - [Example](#example-45)
  - [Texture Pack](#texture-pack)
    - [Constructor](#constructor-4)
      - [Example](#example-46)
    - [`get(type, key)`](#gettype-key)
      - [Example](#example-47)
  - [Renderer](#renderer)
    - [Constructor](#constructor-5)
      - [Example](#example-48)
    - [`previewPiece(index, piece, fillColor, clearPrevious)`](#previewpieceindex-piece-fillcolor-clearprevious)
      - [Example](#example-49)
    - [`clearPreview()`](#clearpreview)
      - [Example](#example-50)
    - [`showAvailablePositions(positions, fillColor, clearPrevious)`](#showavailablepositionspositions-fillcolor-clearprevious)
      - [Example](#example-51)
    - [`clearAvailablePositions()`](#clearavailablepositions)
      - [Example](#example-52)
    - [`getTexture(type, key)`](#gettexturetype-key)
      - [Example](#example-53)
    - [`updateBackground(backgroundUrl)`](#updatebackgroundbackgroundurl)
      - [Example](#example-54)
    - [`updateGrid(gridUrl)`](#updategridgridurl)
      - [Example](#example-55)
    - [`updateTextures(texturesIndexUrl, texturesAtlasUrl)`](#updatetexturestexturesindexurl-texturesatlasurl)
      - [Example](#example-56)
    - [`updateMap(newMap)`](#updatemapnewmap)
      - [Example](#example-57)
    - [`updateBoard(newBoard)`](#updateboardnewboard)
      - [Example](#example-58)
    - [`addEventListener(eventType, listener, options)`](#addeventlistenereventtype-listener-options)
      - [Example](#example-59)
    - [`removeEventListener(eventType, listener)`](#removeeventlistenereventtype-listener)
      - [Example](#example-60)
    - [`getFPS()`](#getfps)
      - [Example](#example-61)
    - [`destroy()`](#destroy)
      - [Example](#example-62)

## Import the Library

### Node.js

```javascript
// Import the library
const Tridecco = require('tridecco-board');

// Hexagonal Grid
const { HexGrid } = Tridecco;

// Triangular Hexagonal Grid
const { TriHexGrid } = Tridecco;

// Board
const { Board } = Tridecco;

// Piece
const { Piece } = Tridecco;

// Texture Pack AND Renderer
// Note: TexturePack and Renderer only work in the browser environment

// Maps
const defaultBoardMap = Tridecco.maps.board.default;
const defaultRendererMap = Tridecco.maps.renderer.default;
```

### Browser

```html
<!-- Import the library -->
<script src="https://cdn.jsdelivr.net/npm/tridecco-board@0.4.2/dist/tridecco-board.min.js"></script>
```

```javascript
// Hexagonal Grid
const { HexGrid } = Tridecco;

// Triangular Hexagonal Grid
const { TriHexGrid } = Tridecco;

// Board
const { Board } = Tridecco;

// Piece
const { Piece } = Tridecco;

// Texture Pack
const { TexturePack } = Tridecco;

// Renderer
const { Renderer } = Tridecco;

// Maps
const defaultBoardMap = Tridecco.maps.board.default;
const defaultRendererMap = Tridecco.maps.renderer.default;
```

## Hexagonal Grid

![Hexagonal Grid](./img/hexagonal-grid.png)

### Constructor

```javascript
constructor(columns, rows, type);
```

**Description:**

Creates a new `HexGrid` instance.

**Parameters:**

- `columns` (number): The number of columns in the grid.
- `rows` (number): The number of rows in the grid.
- `type` (string): The type of hexagonal grid layout. Must be one of the following:
  - `'odd-r'`: Odd-r offset coordinate system.
  - `'even-r'`: Even-r offset coordinate system.
  - `'odd-q'`: Odd-q offset coordinate system.
  - `'even-q'`: Even-q offset coordinate system.

**Throws:**

- `Error`: If the `type` parameter is not one of the valid grid types.

#### Example

```javascript
const grid = new HexGrid(10, 8, 'odd-r');
```

### `get(col, row)`

```javascript
get(col, row);
```

**Description:**

Retrieves the value stored at the specified column and row in the grid.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).

**Returns:**

- `* | null`: The value at the specified position, or `null` if the coordinates are out of bounds or the cell is empty.

#### Example

```javascript
const value = grid.get(3, 2);
console.log(value); // Output: null (if nothing is set at this position initially)
```

### `set(col, row, value)`

```javascript
set(col, row, value);
```

**Description:**

Sets a value at the specified column and row in the grid.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).
- `value` (\*): The value to be stored at the specified position.

#### Example

```javascript
grid.set(3, 2, 'Tile A');
```

### `remove(col, row)`

```javascript
remove(col, row);
```

**Description:**

Removes the value at the specified column and row in the grid, setting the cell to `null`.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).

**Returns:**

- `* | null`: The value that was removed from the specified position, or `null` if the coordinates were out of bounds or the cell was already empty.

#### Example

```javascript
const removedValue = grid.remove(3, 2);
console.log(removedValue); // Output: 'Tile A' (if 'Tile A' was previously set at this position)
console.log(grid.get(3, 2)); // Output: null
```

### `getAdjacents(col, row)`

```javascript
getAdjacents(col, row);
```

**Description:**

Retrieves an array of adjacent hexes for a given column and row. The adjacency is determined based on the grid's `type` (offset coordinate system).

**Parameters:**

- `col` (number): The column index (0-based) of the hex to find neighbors for.
- `row` (number): The row index (0-based) of the hex to find neighbors for.

**Returns:**

- `Array<object>`: An array of adjacent hex objects. Each object in the array has the following properties:
  - `col` (number): The column index of the adjacent hex.
  - `row` (number): The row index of the adjacent hex.
  - `value` (\* | null): The value stored in the adjacent hex, or `null` if the adjacent hex is out of bounds or empty.
    Returns an empty array if no adjacent hexes with values are found within the grid boundaries.

#### Example

```javascript
grid.set(3, 2, 'Center');
grid.set(3, 1, 'North');
grid.set(4, 2, 'East');

const adjacents = grid.getAdjacents(3, 2);
console.log(adjacents);
/* Output (for 'odd-r' type, might vary for other types):
[
  { col: 3, row: 1, value: 'North' },
  { col: 4, row: 2, value: 'East' }
  // ... other adjacent hexes if they have values and are within bounds
]
*/
```

### `forEach(callback)`

```javascript
forEach(callback);
```

**Description:**

Iterates over each cell in the grid and executes a provided callback function for each cell. The callback function is called with the following parameters:

- `value` (\* | null): The value stored in the cell.
- `col` (number): The column index of the cell.
- `row` (number): The row index of the cell.

**Parameters:**

- `callback` (function): A function to execute for each cell in the grid. The function should accept three parameters: `value`, `col`, and `row`.

#### Example

```javascript
grid.set(3, 2, 'Tile A');
grid.set(4, 2, 'Tile B');

grid.forEach((value, col, row) => {
  console.log(`Value at (${col}, ${row}): ${value}`);
});
/* Output:
...
Value at (3, 2): Tile A
Value at (4, 2): Tile B
...
*/
```

### `clone()`

```javascript
clone();
```

**Description:**

Creates a deep copy of the `HexGrid` instance. This means that a new `HexGrid` object is created with the same dimensions, type, and values as the original grid. Changes to the cloned grid will not affect the original grid, and vice versa.

**Returns:**

- `HexGrid`: A new `HexGrid` instance that is a deep copy of the original grid.

#### Example

```javascript
const grid2 = grid.clone();
grid2.set(0, 0, 'New Value in Clone');
console.log(grid.get(0, 0)); // Output: null (original grid is unchanged)
console.log(grid2.get(0, 0)); // Output: 'New Value in Clone' (clone grid has the new value)
```

### `clear()`

```javascript
clear();
```

**Description:**

Clears the entire grid by setting all cell values to `null`. This effectively empties the grid while preserving its dimensions and type.

#### Example

```javascript
grid.clear();
console.log(grid.get(3, 2)); // Output: null (after clearing)
```

## Triangular Hexagonal Grid

![Triangular Hexagonal Grid](./img/triangular-hexagonal-grid.png)

### Constructor

```javascript
constructor(columns, rows, type);
```

**Description:**

Creates a new instance of `TriHexGrid`. It extends the `HexGrid` class, so it inherits all the properties and methods of `HexGrid`. It represents a hexagonal grid where each hexagon is divided into six triangles.

**Parameters:**

- `columns` (number): The number of columns in the grid.
- `rows` (number): The number of rows in the grid.
- `type` (string): The type of the grid, inherited from `HexGrid`. Must be one of: 'odd-r', 'even-r', 'odd-q', or 'even-q'.

#### Example

```javascript
const triHexGrid = new TriHexGrid(5, 4, 'odd-r');
```

### `get(col, row, triangle)`

```javascript
get(col, row, triangle);
```

**Description:**

Retrieves the value of a specific triangle within a hexagon at the given column and row.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).
- `triangle` (number): The index of the triangle within the hexagon (1-based, from 1 to 6).

**Returns:**

- `* | null`: The value stored in the specified triangle, or `null` if the triangle is empty, the hexagon is out of bounds, or the hexagon has not been initialized.

**Throws:**

- `Error`: If triangle is less than 1 or bigger than 6.

#### Example

```javascript
const value = triHexGrid.get(2, 1, 3); // Get the value of the 3rd triangle in the hexagon at (2, 1)
```

### `set(positions, value)`

```javascript
set(positions, value);
```

**Description:**

Sets the value of multiple triangles within the grid. Each position in the `positions` array specifies a single triangle to be updated.

**Parameters:**

- `positions` (Array\<Array\<number>>): An array of positions. Each position is a three-element array: `[col, row, triangle]`.
  - `col` (number): The column index (0-based).
  - `row` (number): The row index (0-based).
  - `triangle` (number): The index of the triangle within the hexagon (1-based, from 1 to 6).
- `value` (\*): The value to be set for all specified triangles.

**Throws:**

- `Error`: If triangle is less than 1 or bigger than 6.

#### Example

```javascript
triHexGrid.set(
  [
    [0, 0, 1],
    [0, 0, 2],
    [1, 2, 4],
  ],
  'myValue',
); // Set triangles at (0, 0, 1), (0, 0, 2), and (1, 2, 4) to 'myValue'
```

### `remove(positions)`

```javascript
remove(positions);
```

**Description:**

Removes the values from multiple triangles within the grid, effectively setting them to `null`.

**Parameters:**

- `positions` (Array\<Array\<number>>): An array of positions, where each position is a three-element array: `[col, row, triangle]`.
  - `col` (number): The column index (0-based).
  - `row` (number): The row index (0-based).
  - `triangle` (number): The index of the triangle within the hexagon (1-based, from 1 to 6).

**Returns:**

- `Array<* | null>`: An array containing the removed values. The order of the values corresponds to the order of the positions in the input array. Returns `null` for each triangle that was already empty or out of bounds.
  **Throws:**
- `Error`: If triangle is less than 1 or bigger than 6.

#### Example

```javascript
const removedValues = triHexGrid.remove([
  [0, 0, 1],
  [1, 2, 4],
]); // Remove the values from (0, 0, 1) and (1, 2, 4)
console.log(removedValues); // Output: ['myValue', null] (if only (0, 0, 1) had a value)
```

### `getHexagon(col, row)`

```javascript
getHexagon(col, row);
```

**Description:**

Retrieves the values of all six triangles within a specified hexagon.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).

**Returns:**

- `Array<* | null>`: An array of six elements, representing the values of the six triangles within the hexagon (in order from 1 to 6). If a triangle is empty or the hexagon is out of bounds, the corresponding element in the array will be `null`.

#### Example

```javascript
const hexagonValues = triHexGrid.getHexagon(2, 1);
console.log(hexagonValues); // Output: [null, null, 'value3', null, null, null] (if only the 3rd triangle had a value)
```

### `setHexagon(col, row, values)`

```javascript
setHexagon(col, row, values);
```

**Description:**

Sets the values of all six triangles within a specified hexagon.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).
- `values` (Array\<\*>): An array of six values to be assigned to the triangles of the hexagon, in order from 1 to 6. If fewer than six values are provided, the remaining triangles will be set to `null`.

#### Example

```javascript
triHexGrid.setHexagon(2, 1, ['a', 'b', 'c', 'd', 'e', 'f']); // Set all triangles in the hexagon at (2, 1)
```

### `removeHexagon(col, row)`

```javascript
removeHexagon(col, row);
```

**Description:**

Removes all values from the six triangles within a specified hexagon.

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).

**Returns:**

- `Array<* | null>`: An array containing the six removed values (or `null` for triangles that were already empty).

#### Example

```javascript
const removedHexValues = triHexGrid.removeHexagon(2, 1); // Remove all triangle values from the hexagon at (2, 1)
```

### `isFull(col, row)`

```javascript
isFull(col, row);
```

**Description:**

Checks if all six triangles within a specified hexagon have values (are not `null`).

**Parameters:**

- `col` (number): The column index (0-based).
- `row` (number): The row index (0-based).

**Returns:**

- `boolean`: `true` if all six triangles within the hexagon have values; `false` otherwise.

#### Example

```javascript
const isHexFull = triHexGrid.isFull(2, 1); // Check if the hexagon at (2, 1) is full
```

### `clone()`

```javascript
clone();
```

**Description:**

Creates a deep copy of `TriHexGrid` object.

**Returns:**

- `TriHexGrid`: A new `TriHexGrid` instance.

#### Example

```javascript
const newTriHexGrid = triHexGrid.clone();
```

## Game Board

![Game Board](./img/game-board.png)

### Constructor

```javascript
constructor(map = defaultMap);
```

**Description:**

Creates a new `Board` instance. Initializes the game board with a map configuration, which defines the board's layout, dimensions, and position properties. If no map is provided, it defaults to `defaultBoardMap`.

**Parameters:**

- `map` (Object, optional): An object containing the board configuration. If not provided, `defaultBoardMap` is used. The map object should have the following properties:
  - `type` (string): The type of hexagonal grid layout ('odd-r', 'even-r', 'odd-q', 'even-q').
  - `columns` (number): The number of columns in the grid.
  - `rows` (number): The number of rows in the grid.
  - `positions` (Array\<Object>): An array defining positions on the board, each object detailing coordinate indexes and adjacency information.

**Throws:**

- `Error`: If `map` is not provided and `defaultBoardMap` is not available, or if the provided `map` is invalid (missing `type`, `columns`, `rows`, or `positions`).

#### Example

```javascript
const board = new Board(); // Creates a board with the default map
// or
const customMap = {
  type: 'odd-r',
  columns: 10,
  rows: 10,
  positions: [
    /* ... position definitions ... */
  ],
};
const board = new Board(customMap); // Creates a board with a custom map
```

### `get(index)`

```javascript
get(index);
```

**Description:**

Retrieves the `Piece` object placed at the specified position index on the board.

**Parameters:**

- `index` (number): The 0-based index of the position on the board.

**Returns:**

- `Piece | null`: The `Piece` object at the specified index, or `null` if the position is empty or the index is out of bounds.

**Throws:**

- `Error`: If `index` is out of bounds.

#### Example

```javascript
const pieceAtPosition = board.get(5);
console.log(pieceAtPosition); // Output: Piece object or null
```

### `set(index, value)`

```javascript
set(index, value);
```

**Description:**

Sets a `Piece` object at the specified position index on the board. This method updates the board's grid with the colors of the piece and records the action in the history. It also checks for and registers any newly completed hexagons.

**Parameters:**

- `index` (number): The 0-based index of the position on the board where the piece is to be set.
- `value` (Piece): The `Piece` object to set at the position.

**Throws:**

- `Error`: If `index` is out of bounds or if `value` is not an instance of `Piece`.

#### Example

```javascript
const piece = new Piece(['red', 'blue']);
board.set(0, piece); // Sets a piece at index 0
```

### `place(index, value)`

```javascript
place(index, value);
```

**Description:**

Places a `Piece` object at the specified position index on the board. This method is similar to `set`, but it also checks if the position is already occupied and returns an array of hexagons formed by placing the piece.

**Parameters:**

- `index` (number): The 0-based index of the position on the board to place the piece.
- `value` (Piece): The `Piece` object to place.

**Returns:**

- `Array<Object>`: An array of objects representing the hexagons formed. Each object contains the following properties:
  - `coordinate` (Array\<number>): The coordinates of the formed hexagon in the format `[col, row]`.
  - `color` (string): The color of the formed hexagon.

**Throws:**

- `Error`: If `index` is out of bounds, if the position is already occupied, or if `value` is not an instance of `Piece`.

#### Example

```javascript
const piece = new Piece(['green', 'yellow']);
const formedHexagons = board.place(3, piece);
if (formedHexagons.length > 0) {
  console.log('Hexagons formed:', formedHexagons);
}
```

### `remove(index)`

```javascript
remove(index);
```

**Description:**

Removes the `Piece` object from the specified position index on the board. This method clears the piece from the board's grid and updates the history.

**Parameters:**

- `index` (number): The 0-based index of the position to remove the piece from.

**Returns:**

- `Piece | null`: The `Piece` object that was removed from the specified position, or `null` if the position was already empty or the index was out of bounds.

**Throws:**

- `Error`: If `index` is out of bounds.

#### Example

```javascript
const removedPiece = board.remove(0);
console.log(removedPiece); // Output: Piece object that was removed or null
```

### `getRelatedHexagons(index)`

```javascript
getRelatedHexagons(index);
```

**Description:**

Retrieves an array of hexagon coordinates related to a given position index. These are the hexagons that are influenced by placing a piece at the specified position.

**Parameters:**

- `index` (number): The 0-based index of the position on the board.

**Returns:**

- `Array<string>`: An array of strings, each representing a hexagon coordinate in the format `"col-row"`.

**Throws:**

- `Error`: If `index` is out of bounds.

#### Example

```javascript
const relatedHexagons = board.getRelatedHexagons(0);
console.log(relatedHexagons); // Output: Array of hexagon coordinates, e.g., ["1-1", "2-2"]
```

### `getRandomPosition(isEdge, excludedIndexes)`

```javascript
getRandomPosition(isEdge = false, excludedIndexes = []);
```

**Description:**

Retrieves a random position index from the board, optionally filtering for edge positions and excluding specific indexes.

**Parameters:**

- `isEdge` (boolean, optional): If `true`, all positions (including edge positions) are considered. If `false`, only non-edge positions are considered. Defaults to `false`.
- `excludedIndexes` (Array\<number>, optional): An array of position indexes to exclude from the random selection. Defaults to an empty array.

**Returns:**

- `number`: A random position index that meets the criteria, or `-1` if no valid position is found.

#### Example

```javascript
const randomNonEdgePosition = board.getRandomPosition(); // Get a random non-edge position
const randomPosition = board.getRandomPosition(true); // Get a random position including edge positions
const randomPositionExcluding = board.getRandomPosition(false, [0, 1, 2]); // Get a random position excluding indexes 0, 1, 2, and edge positions
```

### `getEmptyPositions()`

```javascript
getEmptyPositions();
```

**Description:**

Retrieves an array of indexes for all positions on the board that are currently empty (do not have a piece placed on them).

**Returns:**

- `Array<number>`: An array of 0-based indexes representing empty positions.

#### Example

```javascript
const emptyPositions = board.getEmptyPositions();
console.log(emptyPositions); // Output: Array of empty position indexes
```

### `getOccupiedPositions()`

```javascript
getOccupiedPositions();
```

**Description:**

Retrieves an array of indexes for all positions on the board that are currently occupied by a piece.

**Returns:**

- `Array<number>`: An array of 0-based indexes representing occupied positions.

#### Example

```javascript
const occupiedPositions = board.getOccupiedPositions();
console.log(occupiedPositions); // Output: Array of occupied position indexes
```

### `getAdjacentPositions()`

```javascript
getAdjacentPositions();
```

**Description:**

Retrieves an array of indexes for all positions that are adjacent to at least one occupied position. This includes both empty and occupied adjacent positions.

**Returns:**

- `Array<number>`: An array of 0-based indexes representing adjacent positions.

#### Example

```javascript
const adjacentPositions = board.getAdjacentPositions();
console.log(adjacentPositions); // Output: Array of adjacent position indexes
```

### `getAvailablePositions()`

```javascript
getAvailablePositions();
```

**Description:**

Retrieves an array of indexes for all positions that are considered "available" for placing a piece. In this context, "available" positions are those that are both empty and adjacent to at least one already occupied position.

**Returns:**

- `Array<number>`: An array of 0-based indexes representing available positions.

#### Example

```javascript
const availablePositions = board.getAvailablePositions();
console.log(availablePositions); // Output: Array of available position indexes
```

### `getHexagonPositions(piece)`

```javascript
getHexagonPositions(piece);
```

**Description:**

Analyzes the board and identifies positions where placing the given `Piece` would result in the formation of one or more complete hexagons. It returns a sorted array of these positions, ranked by the number of hexagons that would be formed, in descending order.

**Parameters:**

- `piece` (Piece): The `Piece` object to hypothetically place on the board to evaluate hexagon formation.

**Returns:**

- `Array<Array<number>>`: An array of positions (indexes) that can form a hexagon, each sub-array contains:
  - `index` (number): The 0-based index of the position.
  - `hexagonsFormed` (number): The number of hexagons that would be formed by placing the piece at this position.
    The array is sorted in descending order based on `hexagonsFormed`.

**Throws:**

- `Error`: If `piece` is not an instance of `Piece`.

#### Example

```javascript
const pieceToPlace = new Piece(['purple', 'orange']);
const hexagonFormingPositions = board.getHexagonPositions(pieceToPlace);
hexagonFormingPositions.forEach(([index, hexagonsFormed]) => {
  console.log(`Position ${index} can form ${hexagonsFormed} hexagons.`);
});
```

### `getHexagonsFormed(index, piece)`

```javascript
getHexagonsFormed(index, piece);
```

**Description:**

Gets the hexagons formed by placing a given `Piece` at the specified position `index`. This method simulates the placement to determine the outcome and then reverts the board to its original state, ensuring no permanent modifications to the board.

**Parameters:**

- `index` (number): The 0-based index of the position on the board where the piece is to be hypothetically placed.
- `piece` (Piece): The `Piece` object to test.

**Returns:**

- `Array<Object>`: An array of objects representing the hexagons that would be formed. Each object has the following properties:
  - `coordinate` (Array\<number>): The coordinates `[col, row]` of the formed hexagon.
  - `color` (string): The color of the formed hexagon.

**Throws:**

- `Error`: If `index` is out of bounds or if `piece` is not an instance of `Piece`.

#### Example

```javascript
const pieceToTest = new Piece(['yellow', 'green']);
const potentialHexagons = board.getHexagonsFormed(4, pieceToTest);

if (potentialHexagons.length > 0) {
  console.log(
    `Placing the piece at index 4 would form ${potentialHexagons.length} hexagon(s):`,
  );
  potentialHexagons.forEach((hex) => {
    console.log(
      `- Hexagon at [${hex.coordinate.join(', ')}] with color ${hex.color}`,
    );
  });
} else {
  console.log('Placing the piece at index 4 would form no hexagons.');
}
```

### `countHexagonsFormed(index, piece)`

```javascript
countHexagonsFormed(index, piece);
```

**Description:**

Counts the number of complete hexagons that would be formed if a given `Piece` were placed at a specific position index. This method places the piece temporarily and then undoes the placement to avoid modifying the actual board state.

**Parameters:**

- `index` (number): The 0-based index of the position to evaluate.
- `piece` (Piece): The `Piece` object to hypothetically place.

**Returns:**

- `number`: The number of hexagons that would be formed by placing the `Piece` at the specified `index`.

**Throws:**

- `Error`: If `index` is out of bounds or if `piece` is not an instance of `Piece`.

#### Example

```javascript
const piece = new Piece(['white', 'black']);
const hexagonsCount = board.countHexagonsFormed(7, piece);
console.log(
  `Placing piece at position 7 would form ${hexagonsCount} hexagons.`,
);
```

### `isEmpty(index)`

```javascript
isEmpty(index);
```

**Description:**

Checks if a position at the specified index is currently empty.

**Parameters:**

- `index` (number): The 0-based index of the position to check.

**Returns:**

- `boolean`: `true` if the position is empty; `false` if it is occupied.

**Throws:**

- `Error`: If `index` is out of bounds.

#### Example

```javascript
const isPositionAvailable = board.isEmpty(4);
if (isPositionAvailable) {
  console.log('Position 4 is empty.');
} else {
  console.log('Position 4 is occupied.');
}
```

### `isCompleteHexagon(col, row)`

```javascript
isCompleteHexagon(col, row);
```

**Description:**

Checks if the hexagon at the specified column and row coordinates on the grid is "complete". A hexagon is considered complete if all of its constituent triangles have been assigned values (colors in the context of the game), and all these values are the same.

**Parameters:**

- `col` (number): The column index of the hexagon to check.
- `row` (number): The row index of the hexagon to check.

**Returns:**

- `boolean`: `true` if the hexagon is complete; `false` otherwise.

**Throws:**

- `Error`: If `col` or `row` is out of bounds.

#### Example

```javascript
const isComplete = board.isCompleteHexagon(1, 1);
if (isComplete) {
  console.log('Hexagon at (1, 1) is complete.');
} else {
  console.log('Hexagon at (1, 1) is not complete.');
}
```

### `getCompleteHexagons()`

```javascript
getCompleteHexagons();
```

**Description:**

Retrieves an array of coordinates for all hexagons on the board that are currently complete.

**Returns:**

- `Array<Object>`: An array of objects, each representing a complete hexagon. Each object contains the following properties:
  - `coordinate` (Array\<number>): The coordinates of the complete hexagon in the format `[col, row]`.
  - `color` (string): The color of the complete hexagon.

#### Example

```javascript
const completeHexagons = board.getCompleteHexagons();
if (completeHexagons.length > 0) {
  console.log('Complete hexagons:', completeHexagons);
} else {
  console.log('No complete hexagons on the board.');
}
```

### `addEventListener(event, callback)`

```javascript
addEventListener(event, callback);
```

**Description:**

Adds an event listener for a specific event on the board. This allows you to listen for events such as `set`, `remove`, and others that are triggered during the game. The callback function will be executed whenever the specified event occurs.

**Parameters:**

- `event` (string): The name of the event to listen for. Common events include:
  - `'set'`: Triggered when a piece is set on the board.
  - `'remove'`: Triggered when a piece is removed from the board.
  - `'form'`: Triggered when a hexagon is formed after placing a piece.
  - `'destroy'`: Triggered when a hexagon is destroyed (removed) from the board.
  - `'clear'`: Triggered when the board is cleared.
- `callback` (Function): The callback function to execute when the event occurs.
  - `'set'` event: The callback will be passed the following parameters:
    - `index` (number): The index where the piece was set.
    - `piece` (Piece): The piece that was set.
  - `'remove'` event: The callback will be passed the following parameters:
    - `index` (number): The index from which the piece was removed.
    - `piece` (Piece | null): The piece that was removed (or `null` if no piece was present).
  - `'form'` event: The callback will be passed the following parameters:
    - `hexagons` (Array\<Object>): An array of objects representing the hexagons formed. Each object contains:
      - `coordinate` (Array\<number>): The coordinates of the formed hexagon in the format `[col, row]`.
      - `color` (string): The color of the formed hexagon.
  - `'destroy'` event: The callback will be passed the following parameters:
    - `hexagons` (Array\<Array\<number>>): An array of hexagon coordinates that were destroyed.
  - `'clear'` event: The callback will be passed no parameters.

**Throws:**

- `Error`: If the `event` parameter is not a valid event name.

#### Example

```javascript
board.addEventListener('set', (index, piece) => {
  console.log(`Piece set at index ${index} with piece:`, piece);
});
```

### `removeEventListener(event, callback)`

```javascript
removeEventListener(event, callback);
```

**Description:**

Removes an event listener for a specific event on the board. This stops the specified callback function from being executed when the event occurs.

**Parameters:**

- `event` (string): The name of the event to stop listening for. This should match the event name used when adding the listener.
- `callback` (Function): The callback function to remove. This should be the same function that was passed to `addEventListener`.

**Throws:**

- `Error`: If the `event` parameter is not a valid event name.

#### Example

```javascript
function handleSetEvent(index, piece) {
  console.log(`Piece set at index ${index} with piece:`, piece);
}
board.addEventListener('set', handleSetEvent);
// Later, if you want to remove the listener
board.removeEventListener('set', handleSetEvent);
```

### `back(steps)`

```javascript
back(steps = 1);
```

**Description:**

Undoes the last move(s) made on the board, reverting the board state to a previous point in history.

**Parameters:**

- `steps` (number, optional): The number of moves to undo. Defaults to `1`.

**Returns:**

- `number`: The number of steps actually undone. This may be less than the requested `steps` if there are fewer moves in the history.

#### Example

```javascript
board.back(); // Undo the last move
board.back(3); // Undo the last 3 moves
```

### `clone(options)`

```javascript
clone(options = {});
```

**Description:**

Creates a deep copy of the `Board` instance. This means that a new `Board` object is created with the same map, grid, indexes, hexagons, history (if specified), and event listeners (if specified) as the original board.

**Parameters:**

- `options` (Object, optional): An object containing options for cloning. The following properties are available:
  - `withListeners` (boolean): If `true`, the cloned board will include the event listeners from the original board. Defaults to `false`.
  - `withHistory` (boolean): If `true`, the cloned board will include the history of moves from the original board. Defaults to `false`.

**Returns:**

- `Board`: A new `Board` instance that is a deep copy of the original board.

#### Example

```javascript
const clonedBoard = board.clone(); // Creates a deep copy of the board without listeners or history
const clonedBoardWithHistory = board.clone({
  withHistory: true,
}); // Creates a deep copy of the board with history
```

### `clear()`

```javascript
clear();
```

**Description:**

Clears the entire game board, removing all pieces, resetting the history, and clearing the record of completed hexagons. This effectively resets the board to its initial state.

#### Example

```javascript
board.clear(); // Clears the entire game board
```

### `toJSON(options)`

```javascript
toJSON(options = {});
```

**Description:**

Converts the `Board` instance to a JSON representation. This is useful for serialization or storage. The JSON object includes the board's map, grid, indexes, hexagons, and history (if specified).

**Parameters:**

- `options` (Object, optional): An object containing options for JSON conversion. The following properties are available:
  - `withHistory` (boolean): If `true`, the JSON will include the history of moves from the original board. Defaults to `false`.

**Returns:**

- `Object`: A JSON object representing the `Board`, including its map, grid, indexes, hexagons, and history (if specified).

#### Example

```javascript
const boardJSON = board.toJSON(); // Converts the board to JSON without history
const boardJSONWithHistory = board.toJSON({
  withHistory: true,
}); // Converts the board to JSON with history
console.log(JSON.stringify(boardJSON)); // Output: JSON string representation of the board
```

### `fromJSON(json)` (static)

```javascript
fromJSON(json);
```

**Description:**

Creates a new `Board` instance from a JSON representation. This is useful for deserialization or loading boards from stored data.

**Parameters:**

- `json` (Object): The JSON object representing a `Board`. It should contain the properties `map`, `grid`, `indexes`, `hexagons`, and `history` (if included).

**Returns:**

- `Board`: A new `Board` instance created from the provided JSON representation.

#### Example

```javascript
const boardJSON = {
  map: {
    type: 'odd-r',
    columns: 10,
    rows: 10,
    positions: [
      /* ... position definitions ... */
    ],
  },
  grid: [
    /* ... grid data ... */
  ],
  indexes: [
    /* ... indexes data ... */
  ],
  hexagons: [
    /* ... hexagons data ... */
  ],
  history: [
    /* ... history data ... */
  ],
};
const board = Board.fromJSON(boardJSON); // Creates a board instance from JSON
console.log(board); // Output: Board instance created from JSON
```

## Game Piece

![Game Piece](./img/game-piece.png)

### Constructor

```javascript
constructor(colors, params = {});
```

**Description:**

Creates a new `Piece` instance. Represents a game piece with two colors.

**Parameters:**

- `colors` (Array\<string>): An array of exactly two strings, representing the colors of the piece.
- `params` (Object, optional): An optional object containing additional parameters for the piece. These parameters will be directly assigned as properties of the `Piece` instance.

**Throws:**

- `Error`: If `colors` is not an array, if it does not contain exactly two strings, or if `params` is provided but is not an object.

#### Example

```javascript
const piece1 = new Piece(['red', 'blue']); // Creates a piece with red and blue colors
const piece2 = new Piece(['green', 'yellow'], {
  name: 'Special Piece',
  player: 'Player 1',
}); // Creates a piece with additional parameters
```

### `equals(other)`

```javascript
equals(other);
```

**Description:**

Checks if this `Piece` instance is equal to another `Piece` instance. Equality is determined by comparing the colors of the two pieces.

**Parameters:**

- `other` (Piece): The other `Piece` instance to compare with.

**Returns:**

- `boolean`: `true` if the pieces are considered equal (have the same colors); `false` otherwise.

#### Example

```javascript
const piece1 = new Piece(['red', 'blue']);
const piece2 = new Piece(['red', 'blue']);
const piece3 = new Piece(['blue', 'red']);
const piece4 = new Piece(['green', 'yellow']);

console.log(piece1.equals(piece2)); // Output: true (same colors)
console.log(piece1.equals(piece3)); // Output: false (different color order, current implementation considers order)
console.log(piece1.equals(piece4)); // Output: false (different colors)
```

### `clone()`

```javascript
clone();
```

**Description:**

Creates a deep copy of the `Piece` instance. This means that a new `Piece` object is created with the same colors and properties as the original piece.

**Returns:**

- `Piece`: A new `Piece` instance that is a deep copy of the original piece.

#### Example

```javascript
const piece1 = new Piece(['red', 'blue']);
const piece2 = piece1.clone();
console.log(piece1.equals(piece2)); // Output: true (same colors)
```

### `toJSON()`

```javascript
toJSON();
```

**Description:**

Converts the `Piece` instance to a JSON representation. This is useful for serialization or storage.

**Returns:**

- `Object`: An object representing the `Piece`, including its colors and any additional properties.

#### Example

```javascript
const piece = new Piece(['red', 'blue'], { name: 'My Piece' });
const jsonRepresentation = piece.toJSON();
console.log(jsonRepresentation); // Output: { colors: ['red', 'blue'], customProperties: { name: 'My Piece' } }
```

### `fromJSON(json)` (static)

```javascript
fromJSON(json);
```

**Description:**

Creates a new `Piece` instance from a JSON representation. This is useful for deserialization or loading pieces from stored data.

**Parameters:**

- `json` (Object): The JSON object representing a `Piece`. It should contain a `colors` property (array of two strings) and any additional properties.

**Returns:**

- `Piece`: A new `Piece` instance created from the provided JSON representation.

#### Example

```javascript
const jsonRepresentation = {
  colors: ['red', 'blue'],
  name: 'My Piece',
};
const piece = Piece.fromJSON(jsonRepresentation);
console.log(piece.equals(new Piece(['red', 'blue']))); // Output: true
```

## Texture Pack

### Constructor

```javascript
constructor(indexUrl, atlasUrl, callback = () => {});
```

**Description:**

Creates a new `TexturePack` instance and immediately starts loading the texture atlas and its corresponding index file.

**Parameters:**

- `indexUrl` (string): The URL of the JSON file that defines the texture regions within the atlas (e.g., `index.json`).
- `atlasUrl` (string): The URL of the combined image file (atlas) containing all textures.
- `callback` (Function, optional): A callback function executed after the atlas image and index are loaded. It receives an error as the first argument (or `null` if successful), and the `TexturePack` instance as the second argument (or `null` if failed).

> **Note**: Please refer to the [Available Assets documentation](ASSETS.md) for detailed information on the available texture packs.
> **Note**: If the assets are not from the same origin, CORS headers must be set on the server to allow loading. Otherwise, there will be CORS issues and the assets will not load properly in the browser.

**Throws:**

- `Error`: If `indexUrl` or `atlasUrl` are not strings, if `callback` is not a function, or if used outside a browser environment.

#### Example

```javascript
const texturePack = new TexturePack(
  '/assets/textures-bundle/classic/normal/index.json',
  '/assets/textures-bundle/classic/normal/atlas.png',
  (error, pack) => {
    if (error) {
      console.error('Failed to load texture pack:', error);
      return;
    }
    console.log('Texture pack loaded:', pack);
  },
);
```

### `get(type, key)`

```javascript
get(type, key);
```

**Description:**

Retrieves the atlas image and the definition for a specific texture or texture group by its category (`type`) and `key`.

**Parameters:**

- `type` (string): The category of texture to retrieve (e.g., `'tiles'`, `'hexagons'`).
- `key` (string): The specific key of the texture or group. For nested structures or variants, use dot notation (e.g., `"blue-white"` for a tile variant, `"glow"` for a static hexagon group, `"glow.blue"` for a static hexagon variant, `"particle"` for a base animation, `"flash"` for an animated hexagon group, `"flash.blue"` for an animated hexagon variant).

**Returns:**

- `Object | null`: An object containing:
  - `image` (HTMLImageElement): The loaded atlas image.
  - `definition` (Object): The metadata for the texture or group. The structure of `definition` varies:
    - For static texture leaves (e.g., a tile variant directly under `variants`): `{x, y, w, h}` (coordinates in the atlas).
    - For animated textures (base animation or a fully resolved variant): An object containing `frames` (Array of `{x,y,w,h}` coordinate objects), `fps` (number), and `range` (Array<number>).
    - For group nodes that have a `type` property (e.g., "static" or "animated"): The group object itself as defined in the bundled `index.json` (e.g., `{type: "static", scale: 1.24, variants: {...}}` or `{type: "animated", fps: ..., range: ..., scale: 1.0, variants: {...}}`). The `variants` object within will contain coordinate objects for static variants or `frames` arrays for animated variants.
  - `scale` (number, optional): The scale factor for the texture or group, if present in the texture pack definition. This property appears at the top level of the returned object for easy access.
    Returns `null` if the key is invalid, does not resolve to a recognized structure, or if the texture pack is not fully loaded.

#### Example

```javascript
// Assuming texturePack is loaded

// Get a static tile variant
const tileVariantData = texturePack.get('tiles', 'blue-white');
if (tileVariantData) {
  // tileVariantData.definition will be {x, y, w, h}
  console.log('Tile Variant:', tileVariantData.definition);
}

// Get a static group with scale
const staticGroupData = texturePack.get('hexagons', 'glow');
if (staticGroupData) {
  // staticGroupData.definition will be { type: "static", scale: 1.24, variants: { blue: {x,y,w,h}, ... } }
  console.log('Static Group:', staticGroupData.definition);
  console.log('Scale factor:', staticGroupData.scale); // 1.24

  // To get a specific variant from the group:
  const glowBlueData = texturePack.get('hexagons', 'glow.blue');
  if (glowBlueData) console.log('Glow Blue Variant:', glowBlueData.definition); // {x,y,w,h}
}

// Get a base animation with scale
const particleAnimationData = texturePack.get('hexagons', 'particle');
if (particleAnimationData) {
  // particleAnimationData.definition will be { type: "animated", scale: 1.24, fps: ..., range: ..., frames: [{x,y,w,h}, ...] }
  console.log('Particle Animation:', particleAnimationData.definition);
  console.log('Animation scale:', particleAnimationData.scale); // 1.24
}

// Get an animated group with scale
const animatedGroupData = texturePack.get('hexagons', 'flash');
if (animatedGroupData) {
  // animatedGroupData.definition will be { type: "animated", scale: 1.0, fps: ..., range: ..., variants: { blue: {frames:[...]}, ... } }
  console.log('Animated Group:', animatedGroupData.definition);
  console.log('Group scale:', animatedGroupData.scale);

  // To get a specific animated variant from the group:
  const flashBlueData = texturePack.get('hexagons', 'flash.blue');
  if (flashBlueData) {
    // flashBlueData.definition will be { frames: [{x,y,w,h}, ...], fps: ..., range: ... }
    // flashBlueData.scale will be 1.0 (inherited from parent 'flash' group)
    // fps and range are inherited from the parent 'flash' group.
    console.log('Flash Blue Animation Variant:', flashBlueData.definition);
    console.log('Variant scale:', flashBlueData.scale);
  }
}
```

## Renderer

![Renderer](./img/renderer.png)

### Constructor

```javascript
constructor(options, callback = () => {});
```

**Description:**

Creates a new `Renderer` instance to visualize a `Board` object on an HTML canvas within a specified container element. It initializes rendering contexts, loads necessary assets (textures, background, grid), and sets up event listeners.

**Parameters:**

- `options` (Object): An object containing the configuration options for the renderer.
  - `board` (Board): The `Board` instance to be rendered.
  - `container` (HTMLElement): The DOM element that will contain the rendering canvas.
  - `map` (Object, optional): The map configuration object defining rendering coordinates and dimensions. Defaults to `defaultMap` (a predefined map object).
  - `texturesIndexUrl` (string, optional): The URL of the texture index JSON file. Defaults to a predefined path.
  - `texturesAtlasUrl` (string, optional): The URL of the atlas image file. Defaults to a predefined path.
  - `backgroundUrl` (string, optional): The URL for the background image. Defaults to a predefined path.
  - `gridUrl` (string, optional): The URL for the grid overlay image. Defaults to a predefined path.
  - `showFPS` (boolean, optional): If `true`, displays the frames per second (FPS) in the bottom right corner of the canvas. Defaults to `false`.
- `callback` (Function, optional): A callback function executed after the renderer is initialized and initial assets are loaded. Receives two arguments: `error` (an Error object if initialization failed, otherwise `null`) and `rendererInstance` (the `Renderer` instance upon success, otherwise `null`).

> **Note**: Please refer to the [Available Assets documentation](ASSETS.md) for detailed information on the available texture packs, background images, and grid overlays.
> **Note**: If the textures are not from the same origin, CORS headers must be set on the server to allow loading of the textures. Otherwise, there will be CORS issues and the textures will not load properly in the browser.

**Throws:**

- `Error`: If `board` is not a `Board` instance, `container` is not an `HTMLElement`, `map` is invalid, asset URLs are not strings, `callback` is not a function, or if used outside a browser environment.

#### Example

```javascript
const myBoard = new Board();
const containerElement = document.getElementById('game-container');

const renderer = new Renderer(
  {
    board: myBoard,
    container: containerElement,
    // Optional: map: maps.renderer.default,
    // Optional: texturesIndexUrl: '/path/to/my/textures/index.json',
    // Optional: texturesAtlasUrl: '/path/to/my/textures/atlas.webp',
    // (more options...)
  },
  (error, rendererInstance) => {
    if (error) {
      console.error('Renderer initialization failed:', error);
      return;
    }
    console.log('Renderer initialized!', rendererInstance);
  },
);
```

### `previewPiece(index, piece, fillColor, clearPrevious)`

```javascript
previewPiece(
  index,
  piece,
  fillColor = 'rgba(255, 255, 255, 0.5)',
  clearPrevious = true
);
```

**Description:**

Renders a semi-transparent preview of a given `Piece` at a specified board position index. Also previews any hexagons that would be formed by this placement. Useful for showing potential placements during drag-and-drop or hover actions.

**Parameters:**

- `index` (number): The 0-based index of the board position where the preview should be rendered.
- `piece` (Piece): The `Piece` object to preview.
- `fillColor` (string, optional): The CSS color string for the semi-transparent overlay applied to the piece preview. Defaults to `'rgba(255, 255, 255, 0.5)'`.
- `clearPrevious` (boolean, optional): If `true` (default), clears any existing previews before rendering the new one. Set to `false` to add multiple previews.

**Throws:**

- `Error`: If the `piece` object is invalid or if the `index` is out of bounds for the current map.

#### Example

```javascript
const pieceToPreview = new Piece(['blue', 'yellow']);
renderer.previewPiece(10, pieceToPreview); // Show preview at index 10, clearing others
```

### `clearPreview()`

```javascript
clearPreview();
```

**Description:**

Clears any currently displayed piece and hexagon previews from the renderer.

#### Example

```javascript
renderer.clearPreview(); // Remove any active previews
```

### `showAvailablePositions(positions, fillColor, clearPrevious)`

```javascript
showAvailablePositions(
  positions = this._board.getAvailablePositions(),
  fillColor = 'rgba(0, 0, 0, 0.5)',
  clearPrevious = true
);
```

**Description:**

Highlights the specified available positions on the board by overlaying a semi-transparent mask, making non-available positions appear dimmer and cutting out the shapes of available positions.

**Parameters:**

- `positions` (Array\<number>, optional): An array of 0-based position indexes to highlight. Defaults to the result of `board.getAvailablePositions()`.
- `fillColor` (string, optional): The CSS color string for the mask overlay. Defaults to `'rgba(0, 0, 0, 0.5)'`.
- `clearPrevious` (boolean, optional): If `true` (default), clears any existing highlighted available positions before showing the new ones. Set to `false` to add to existing highlights.

**Throws:**

- `Error`: If `positions` is provided but is not an array.

#### Example

```javascript
renderer.showAvailablePositions(); // Highlight default available positions
// Or highlight specific positions:
renderer.showAvailablePositions([5, 8, 12], 'rgba(0, 100, 0, 0.4)');
```

### `clearAvailablePositions()`

```javascript
clearAvailablePositions();
```

**Description:**

Removes the highlight mask, clearing any highlighted available positions from the board.

#### Example

```javascript
renderer.clearAvailablePositions(); // Remove highlights
```

### `getTexture(type, key)`

```javascript
getTexture(type, key);
```

**Description:**

Retrieves a loaded texture object from the `TexturePack` used by the renderer. The object contains the texture atlas image and the definition (coordinates, dimensions) for the specific texture.

**Parameters:**

- `type` (string): The type of texture ('tiles' or 'hexagons').
- `key` (string): The key identifying the specific texture.

**Returns:**

- `Object`: The texture object containing `{ image: HTMLImageElement, definition: Object, ... }`.

**Throws:**

- `Error`: If the assets manager or textures are not initialized, or if the texture is not found.

#### Example

```javascript
const pieceTextureInfo = renderer.getTexture('tiles', 'red-blue');
const hexagonTextureInfo = renderer.getTexture('hexagons', 'blue');
```

### `updateBackground(backgroundUrl)`

```javascript
async updateBackground(backgroundUrl);
```

**Description:**

Loads and applies a new background image from the specified URL. This is an asynchronous operation.

**Parameters:**

- `backgroundUrl` (string): The URL of the new background image.

> **Note**: Please refer to the [Available Assets documentation](ASSETS.md) for detailed information on the available background images.

**Returns:**

- `Promise<void>`: A promise that resolves when the new background is loaded and the background layer is scheduled for re-render.

**Throws:**

- `Error`: If `backgroundUrl` is not a string, if the AssetsManager is not initialized, or if loading fails.

#### Example

```javascript
renderer
  .updateBackground('/assets/backgrounds/space-nebula.png')
  .then(() => console.log('Background updated!'))
  .catch((err) => console.error('Background update failed:', err));
```

### `updateGrid(gridUrl)`

```javascript
async updateGrid(gridUrl);
```

**Description:**

Loads and applies a new grid overlay image from the specified URL. This is an asynchronous operation.

**Parameters:**

- `gridUrl` (string): The URL of the new grid image.

> **Note**: Please refer to the [Available Assets documentation](ASSETS.md) for detailed information on the available grid overlays.

**Returns:**

- `Promise<void>`: A promise that resolves when the new grid is loaded and the grid layer is scheduled for re-render.

**Throws:**

- `Error`: If `gridUrl` is not a string, if the AssetsManager is not initialized, or if loading fails.

#### Example

```javascript
renderer
  .updateGrid('/assets/grids/golden.png')
  .then(() => console.log('Grid updated!'))
  .catch((err) => console.error('Grid update failed:', err));
```

### `updateTextures(texturesIndexUrl, texturesAtlasUrl)`

```javascript
async updateTextures(texturesIndexUrl, texturesAtlasUrl);
```

**Description:**

Loads and applies a new texture pack from the specified index and atlas URLs. This is an asynchronous operation. It will:

1. Load the new texture index and atlas.
2. Update FPS and internal intervals for animated layers (`'hexagons'`, `'preview-hexagons-particle'`) if their definitions changed in the new texture pack.
3. Force a re-render of all layers to apply the new textures. This includes pieces, hexagons, previews, available positions, and the hitmap.

**Parameters:**

- `texturesIndexUrl` (string): The URL for the new texture index JSON file.
- `texturesAtlasUrl` (string): The URL for the new texture atlas image file.

> **Note**: Please refer to the [Available Assets documentation](ASSETS.md) for detailed information on the available texture packs.

**Returns:**

- `Promise<void>`: A promise that resolves when the new textures are loaded, applied, and all layers are forced to re-render.

**Throws:**

- `Error`: If `texturesIndexUrl` or `texturesAtlasUrl` are not strings, if the AssetsManager is not initialized, or if loading fails.

#### Example

```javascript
renderer
  .updateTextures('/assets/textures/futuristic/index.json', '/assets/textures/futuristic/atlas.webp')
  .then(() => console.log('Textures updated!'))
  .catch((err) => console.error('Texture update failed:', err));
```

### `updateMap(newMap)`

```javascript
updateMap(newMap);
```

**Description:**

Updates the renderer to use a new map configuration. This is an operation that will trigger a full re-initialization of dimensions and a re-render of all layers. It involves:

1. Updating the internal map reference to `newMap`.
2. Clearing previews and available positions as they might be invalid for the new map.
3. Re-initializing dimensions (canvas size, scaling ratios) based on the `newMap`. This will also resize all layers and force a re-render of all layers, including the hitmap.

**Parameters:**

- `newMap` (Object): The new map configuration object (must conform to the expected map structure).

**Throws:**

- `Error`: If `newMap` is not a valid map object.

#### Example

```javascript
const newRendererMap = {
  /* ... new map definition ... */
};
renderer.updateMap(newRendererMap);
```

### `updateBoard(newBoard)`

```javascript
updateBoard(newBoard);
```

**Description:**

Updates the renderer to use a new `Board` instance. It involves:

1. Clearing current previews and available positions highlights.
2. Removing event listeners from the old board.
3. Updating the internal board reference to `newBoard`.
4. Initializing and attaching event listeners to the `newBoard`.
5. Re-rendering layers directly dependent on the board state (like pieces and formed hexagons).

**Parameters:**

- `newBoard` (Board): The new `Board` instance to render.

**Throws:**

- `Error`: If `newBoard` is not a `Board` instance.

#### Example

```javascript
const newBoard = new Board();
renderer.updateBoard(newBoard);
```

### `addEventListener(eventType, listener, options)`

```javascript
addEventListener(eventType, listener, options = {});
```

**Description:**

Adds an event listener for specific renderer interaction events (drag/drop, mouse move, click) or resize events.

**Parameters:**

- `eventType` (string): The type of event to listen for:
  - `'dragover'`, `'drop'`, `'mousemove'`, `'click'`: Triggered for interactions anywhere on the canvas. The listener receives the index of the piece at the event coordinates (-1 if none).
  - `'resize'`: Triggered when the container element is resized. The listener receives an object with canvas and container dimensions.
- `listener` (Function): The function to execute when the event occurs. Receives event-specific arguments (usually the piece index or dimension info).
- `options` (Object, optional): Optional parameters.
  - `onlyAvailable` (boolean): If `true`, the listener will only be triggered for drop events on available positions. Defaults to `false`. This is useful for distinguishing between general drop events and those specifically on available positions. (`resize` events do not use this option.)

**Throws:**

- `Error`: If `eventType` is not a valid event type.

#### Example

```javascript
// Listen for drops on available positions
renderer.addEventListener(
  'drop',
  (pieceIndex) => {
    console.log(`Dropped on available position index: ${pieceIndex}`);
    // Add logic to place the piece
  },
  { onlyAvailable: true },
);

// Listen for clicks anywhere
renderer.addEventListener('click', (pieceIndex) => {
  if (pieceIndex !== -1) {
    console.log(`Clicked on piece index: ${pieceIndex}`);
  } else {
    console.log('Clicked on empty space.');
  }
});

// Listen for resize events
renderer.addEventListener('resize', ({ canvas, container }) => {
  console.log('Renderer resized. Canvas:', canvas, 'Container:', container);
});
```

### `removeEventListener(eventType, listener)`

```javascript
removeEventListener(eventType, listener);
```

**Description:**

Removes a previously added event listener for a specific renderer event type.

**Parameters:**

- `eventType` (string): The event type from which to remove the listener.
- `listener` (Function): The listener function that was originally added.

**Throws:**

- `Error`: If `eventType` is not a valid event type.

#### Example

```javascript
function handleClick(pieceIndex) {
  console.log(`Clicked index: ${pieceIndex}`);
}
renderer.addEventListener('click', handleClick);
// Later...
renderer.removeEventListener('click', handleClick);
```

### `getFPS()`

```javascript
getFPS();
```

**Description:**

Retrieves the current frames per second (FPS), which indicates how many frames are being rendered per second. This is useful for performance monitoring.

**Returns:**

- `number | null`: The current FPS value, or `null` if the `FPSTracker` is not initialized.

#### Example

```javascript
const currentFPS = renderer.getFPS();
if (currentFPS !== null) {
  console.log(`Current FPS: ${currentFPS.toFixed(1)}`);
}
```

### `destroy()`

```javascript
destroy();
```

**Description:**

Cleans up the renderer instance. This includes stopping the rendering loop, removing all canvas event handlers, disconnecting `ResizeObserver` and `MutationObserver`, clearing all registered event listeners, removing board event handlers, clearing all layers and assets, and removing the canvas from the DOM. This method should be called when the renderer is no longer needed to prevent memory leaks and performance issues.

#### Example

```javascript
// When the game component is unmounted or the renderer is no longer needed
renderer.destroy();
```
