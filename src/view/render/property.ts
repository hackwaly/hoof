import {Property, observe} from '../../property/library';
import {Script} from '../script';
import {Context, render, bind} from '../render';

export function renderProperty(context: Context, script: Property<any>) {
    let text = document.createTextNode('');
    context.bindings.push(bind(script, (value) => {
        text.data = value + '';
    }));
    return text;
}
