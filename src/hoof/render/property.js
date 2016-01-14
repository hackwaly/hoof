import {Property, observe} from '../../property/index';
import {bind} from '../redraw';
import {RenderContext} from '../render';

export function renderProperty(context, script) {
    // TODO: handle other cases. like property.isFinal and value is array.
    let text = document.createTextNode('');
    context._bindings.push(bind(script, (value) => {
        text.data = value + '';
    }));
    return text;
}
