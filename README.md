# Hoof
A Javascript MVVM library. Like efficient JSX version of knockout.

#### Example

```javascript
import {stored, Fragment, React, render} from 'hoof';

let counter = stored(0);
function increment() {
    counter.set(counter() + 1);
}

let ctx = render(
	<Fragment>
        {counter}
        <button onclick={increment}>increment</button>
	</Fragment>
);

// Insert rendered (fragment) node to document.
document.body.appendChild(ctx.node);
// Setup all bindings.
ctx.setup();
```
