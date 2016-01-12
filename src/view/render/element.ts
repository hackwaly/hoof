import {CustomTag, ElementScript} from '../script';
import {Context, renderScript, bind, Binding} from '../render';
import {Property} from '../../property/library';

const fixUnitBlackUnit = {
    'column-count': true,
    'fill-opacity': true,
    'flex': true,
    'flex-grow': true,
    'flex-shrink': true,
    'font-weight': true,
    'line-clamp': true,
    'line-height': true,
    'opacity': true,
    'order': true,
    'orphans': true,
    'widows': true,
    'zIndex': true,
    'zoom': true
};

function setStyle(element: HTMLElement, prop: string, value: string | number) {
	if (typeof value === 'number' && !fixUnitBlackUnit[prop]) {
		value = value + 'px';
	}
	element.style.setProperty(prop, value + '');
}

function visitStyle(target: any, callback: (prop: string, value: any) => void, prefix: string) {
	Object.keys(target).forEach((prop) => {
		let value = target[prop];
		if (value == null) {
			return;
		}
		prop = prefix + prop;
		if (value.constructor === Object) {
			visitStyle(value, callback, prop + '-');
			return;
		}
		callback(prop, value);
	});
}

function setStyles(context: Context, element: HTMLElement, styles: any) {
	visitStyle(styles, (prop, propValue) => {
		if (propValue instanceof Property) {
			context.bindings.push(bind<any>(propValue, (propValue) => {
                setStyle(element, prop, propValue);
            }));
		} else {
			setStyle(element, prop, propValue);
		}
	}, '');
}

class ListenerBinding implements Binding {
    public constructor(
        private target: EventTarget,
        private type: string,
        private listener: EventListener
    ) { }
    public setup() {
        this.target.addEventListener(this.type, this.listener);
    }
    public cleanup() {
        this.target.removeEventListener(this.type, this.listener);
    }
}

function setListener(context: Context, element: HTMLElement, type: string, value: Property<EventListener> | EventListener) {
	let listener: EventListener;
	if (value instanceof Property) {
		listener = (evt) => {
			let handler = value.value();
			if (handler != null) {
				return handler(evt);
			}
		};
	} else {
		listener = value;
	}
    context.bindings.push(new ListenerBinding(element, type, listener));
}

function setAttr(element: HTMLElement, attr: string, attrValue: any) {
	if (attr === 'style') {
		element.style.cssText = attrValue;
		return;
	}

	let attrName = attr;
	if (attrName === 'for') {
		attrName = 'htmlFor';
	} else if (attrName === 'class') {
		attrName = 'className';
	}

	if (typeof element[attrName] === typeof attrValue) {
		element[attrName] = attrValue;
		return;
	}

	element.setAttribute(attr, attrValue);
}

const tagsIntroduceNamespace = {
	'svg': 'http://www.w3.org/2000/svg'
};

export function renderElement(context: Context, script: ElementScript) {
	let tag = script.tag;
	if (typeof tag !== 'string') {
		return renderScript(context, tag(script));
	}

	let tagName = tag as string;
	if (tagsIntroduceNamespace[tagName]) {
		context.namespaceStack.push(context.namespace);
		context.namespace = tagsIntroduceNamespace[tagName];
	}

	let element;
	if (context.namespace !== null) {
		element = document.createElementNS(context.namespace, tagName);
	} else {
		element = document.createElement(tagName);
	}

	if (script.attrs !== null) {
		Object.keys(script.attrs).forEach((attr) => {
			let attrValue = script.attrs[attr];
			if (attrValue == null) {
				return;
			}
			if (attr === '$bindings') {
				let bindings = attrValue(element);
				bindings.forEach((binding) => {
					context.bindings.push(binding);
				});
				return;
			}
			if (attr.startsWith('on')) {
				setListener(context, element, attr.substring(2), attrValue);
				return;
			}
			if (attr === 'style' && attrValue.constructor === Object) {
				setStyles(context, element, attrValue);
				return;
			}
			if (attrValue instanceof Property) {
                context.bindings.push(bind<any>(attrValue, (attrValue) => {
                    setAttr(element, attr, attrValue);
                }));
				return;
			}
			setAttr(element, attr, attrValue);
		});
	}

	script.children.forEach((script) => {
		element.appendChild(renderScript(context, script));
	});

	if (tagsIntroduceNamespace[tagName]) {
		context.namespace = context.namespaceStack.pop();
	}

	return element;
}
