import {Property} from '../property/library';
import {Script, ElementScript, DynamicListScript} from './script';
import {renderText} from './render/text';
import {renderElement} from './render/element';
import {renderFragment} from './render/fragment';
import {renderProperty} from './render/property';
import {renderDynamicList} from './render/dynamic_list';
import {Callable} from '../utils/callable';

export const EMPTY_NODE = document.createDocumentFragment();

export class Context {
	public node: Node = EMPTY_NODE;
    public firstNode: Node = null;
    public lastNode: Node = null;
	public bindings: Binding[] = [];
    public namespaceStack: string[] = [];
    public namespace: string = null;

    public constructor(namespace: string) {
        this.namespace = namespace;
    }

    public setNode(node: Node) {
        this.node = node;
        this.firstNode = node.nodeType === 11 ? node.firstChild : node;
        this.lastNode = node.nodeType === 11 ? node.lastChild : node;
    }
	public setup() {
        this.bindings.forEach((binding) => binding.setup());
	}
	public cleanup() {
        this.bindings.forEach((binding) => binding.cleanup());
	}
    public remove() {
        if (this.firstNode !== null && this.node.nodeType !== 11) {
            let range = document.createRange();
            range.setStartBefore(this.firstNode);
            range.setEndAfter(this.lastNode);
            let fragment = range.extractContents();
            this.setNode(fragment);
        }
    }
    public destroy() {
        this.cleanup();
        this.remove();
    }
}

let updateQueue = new Set<UpdaterBinding<any>>();
let updateCallbacks: (() => void)[] = [];

function redraw() {
    updateQueue.forEach((binding) => {
        binding.update();
    });
    updateQueue.clear();
    let callbacks = updateCallbacks;
    updateCallbacks = [];
    callbacks.forEach((callback) => callback());
}

function schedule(binding: UpdaterBinding<any>) {
    if (updateQueue.size <= 0) {
        window.requestAnimationFrame(redraw);
    }
    updateQueue.add(binding);
}

export function waitForNextReflow(callback: () => void) {
    updateCallbacks.push(callback);
}

export interface Binding {
    setup();
    cleanup();
}

export class UpdaterBinding<T> implements Binding {
    private version: number;
    private property: Property<T>;
    private updater: (value: T) => void;
    public constructor(property: Property<T>, updater: (value: T) => void) {
        this.property = property;
        this.updater = updater;
    }
    public onNotify() {
        schedule(this);
    }
    public update() {
        let value = this.property.value();
        if (this.property.version !== this.version) {
            this.version = this.property.version;
            this.updater(value);
        }
    }
    public setup() {
        this.property.addObserver(this);
        let value = this.property.value();
        this.version = this.property.version;
        this.updater(value);
    }
    public cleanup() {
        this.property.removeObserver(this);
    }
}

export function bind<T>(property: Property<T>, updater: (value: T) => void) {
    return new UpdaterBinding(property, updater);
}

export function renderScript(context: Context, script: Script): Node {
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

export function render(script: Script, namespace: string = null) {
	let context = new Context(namespace);
	context.setNode(renderScript(context, script));
	return context;
}
