import {stored, computed, Fragment, React, dynamicList, render} from '../../src/library';

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

document.body.appendChild(ctx.node);
ctx.setup();
