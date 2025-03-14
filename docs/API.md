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

## Import the Library

### Node.js

```javascript
// Import the library
const Tridecco = require('tridecco-board');

// Hexagonal Grid
const { HexGrid } = Tridecco;

//Triangular Hexagonal Grid
const { TriHexGrid } = Tridecco;
```

### Browser

```html
<!-- Import the library -->
<script src="https://cdn.jsdelivr.net/npm/tridecco-board@latest/dist/tridecco-board.min.js"></script>
```

```javascript
// Hexagonal Grid
const { HexGrid } = Tridecco;

//Triangular Hexagonal Grid
const { TriHexGrid } = Tridecco;
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

**Returns:**

- `void`: This method does not return a value.

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

**Returns:**

- `void`: This method does not return a value.

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

**Returns:**

- `void`: This method does not return a value.

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

- `positions` (Array<Array<number>>): An array of positions. Each position is a three-element array: `[col, row, triangle]`.
  - `col` (number): The column index (0-based).
  - `row` (number): The row index (0-based).
  - `triangle` (number): The index of the triangle within the hexagon (1-based, from 1 to 6).
- `value` (\*): The value to be set for all specified triangles.

**Returns:**

- `void`

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

- `positions` (Array<Array<number>>): An array of positions, where each position is a three-element array: `[col, row, triangle]`.
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
- `values` (Array<\*>): An array of six values to be assigned to the triangles of the hexagon, in order from 1 to 6. If fewer than six values are provided, the remaining triangles will be set to `null`.

**Returns:**

- `void`

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

Creates a deep copy of TriHexGrid object.

**Returns:**

- `TriHexGrid`: A new `TriHexGrid` instance.

#### Example

```javascript
const newTriHexGrid = triHexGrid.clone();
```
