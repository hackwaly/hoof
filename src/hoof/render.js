import {Property} from '../property/index';
import {ElementScript, DynamicListScript} from './script';
import {renderText} from './render/text';
import {renderElement} from './render/element';
import {renderFragment} from './render/fragment';
import {renderProperty} from './render/property';
import {renderDynamicList} from './render/dynamic_list';
import * as redraw from './redraw';

export const EMPTY_NODE = document.createDocumentFragment();

export class RenderContext {
    node = EMPTY_NODE;
    _firstNode = null;
    _lastNode = null;
    _bindings = [];
    _namespaceStack = [];
    _namespace;

    constructor(namespace) {
        this._namespace = namespace;
    }

    _setNode(node) {
        this.node = node;
        this._firstNode = node.nodeType === 11 ? node.firstChild : node;
        this._lastNode = node.nodeType === 11 ? node.lastChild : node;
    }

    setup() {
        this._bindings.forEach((binding) => binding.setup());
    }

    cleanup() {
        this._bindings.forEach((binding) => binding.cleanup());
    }

    remove() {
        if (this._firstNode !== null && this.node.nodeType !== 11) {
            let range = document.createRange();
            range.setStartBefore(this._firstNode);
            range.setEndAfter(this._lastNode);
            let fragment = range.extractContents();
            this._setNode(fragment);
        }
    }

    destroy() {
        this.cleanup();
        this.remove();
    }
}

export function renderScript(context, script) {
    if (script == null) {
        return EMPTY_NODE;
    }

    let type = typeof script;
    if (type === 'number' || type === 'string') {
        return renderText(context, script + '');
    }

    if (script instanceof ElementScript) {
        return renderElement(context, script);
    }

    if (script instanceof DynamicListScript) {
        return renderDynamicList(context, script);
    }

    if (script instanceof Property) {
        return renderProperty(context, script);
    }

    if (Array.isArray(script)) {
        return renderFragment(context, script);
    }

    throw new Error('Unknown script');
}

export function render(script, namespace) {
    let context = new RenderContext(namespace);
    context._setNode(renderScript(context, script));
    return context;
}
