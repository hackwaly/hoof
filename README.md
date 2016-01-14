# Hoof

A Javascript MVVM library. Like efficient virtual-dom version of knockout.

#### Example

```javascript
import {stored} from 'property';
import {Fragment, React, render} from 'hoof';

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

[Live Hoof+D3 Demo](http://bl.ocks.org/hackwaly/raw/2b6692effcb4fa3def95/)
