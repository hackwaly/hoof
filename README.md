# Hoof

A Javascript MVVM library. Like efficient virtual-dom version of knockout. 
[Live Hoof+D3 Demo](http://bl.ocks.org/hackwaly/raw/2b6692effcb4fa3def95/)


_Technique preview. Opensourced here to share the ideas in it._

#### Difference with React

* Render once, update by data binding.
* Not diff virtual-dom(s), diff data on necessary.
* No wrapper span element for text binding. It won't break your css.
* Support render fragments.

#### Example

```javascript
import {stored} from 'property';
import {Fragment, React, render} from 'hoof';

let counter = stored(0);
let step = stored(1, (n) => +n); // The second argument is a write filter.

function increment() {
    counter(counter() + step());
}

let ctx = render(
	<Fragment>
        {counter}
        <button onclick={increment}>increment</button>
        <input type="number" value={step()} value$input$change={step}/>
	</Fragment>
);
// `value={step()}` instead of `value={step}` means do not make write binding.
// `value$input$change={step}` is a read binding says read `value` into `step` on `input` or `change` event.

// Insert rendered (fragment) node to document.
document.body.appendChild(ctx.node);
// Setup all bindings.
ctx.setup();
```
