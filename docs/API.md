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
    - [`clone()`](#clone)
      - [Example](#example-5)
    - [`clear()`](#clear)
      - [Example](#example-6)

## Import the Library

### Node.js

```javascript
// Import the library
const Tridecco = require('tridecco-board');

// Hexagonal Grid
const { HexGrid } = Tridecco;
```

### Browser

```html
<!-- Import the library -->
<script src="https://cdn.jsdelivr.net/npm/tridecco-board@latest/dist/tridecco-board.min.js"></script>
```

```javascript
// Hexagonal Grid
const { HexGrid } = Tridecco;
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
