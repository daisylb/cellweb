# Cellweb

Cellweb is an observable library heavily inspired by [S.js][sjs]. It's still in its infancy; it probably works fine, but it doesn't yet have all the features it's intended to have, so it's currently rather basic and not terribly useful.

Cellweb was created by Leigh Brenecki and is available under an MPL license.

[sjs]: https://github.com/adamhaile/S

## Usage

Cellweb's main building block is the **cell**. It's a container for data that can be observed for changes and referenced from other cells, so named because you can think of them like cells in a spreadsheet.

Cells are created with the ``C`` function.

```js
import C from 'cellweb'
```

The simplest kind of cell is a **data cell**. You store a single value inside it, and you can replace it later on; it's like a spreadsheet cell you've typed a regular value into. You can attach listeners to it that get called whenever changes happen.

Data cells are created by calling `C` with their initial value.

```js
const name = C("John Doe")
```

Call a cell to get its value, or call it with an argument to set its value.

```js
name() // = "John Doe"
name("Jane Doe")
name() // = "Jane Doe"
```

Cells also have the `.on(function)` and `.off(function)` methods to add and remove event handlers, which get called with the new value whenever it changes.

The other kind of cell is a **computation cell**. You give it a function, and it stores that function's result; if that function reads from any other cells, the result will automatically update when those cells do. It's like a spreadsheet cell with a formula in it.

Computation cells are created by calling ``C`` with their function.

```js
const num1 = C(1)
const num2 = C(1)
const sum = C(() => num1() + num2())
```

Like data cells, you call them to read the result. You can't replace the result (or replace the function) though.

```js
sum() // = 2
num2(4)
sum() // = 5
sum() // = 5
```

Note that even though we called `sum()` three times, the actual function that gets passed in only gets called twice: once when the cell is created, and once when we changed one of its dependencies, `num2`.

Calling a cell like `sum()` is just a concise syntax for "retrieve the value stored inside this cell"; that's true of both data and computation cells.

Computation cells have `.on(function)` and `.off(function)` methods as well, just like data cells, and they work the same way.
