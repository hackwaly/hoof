import {ElementScript} from '../script';
import {bind} from '../redraw';
import {RenderContext, renderScript} from '../render';
import {Property, stored} from '../../property/index';
import {Callable} from '../../common/callable';

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

function setStyle(element, prop, value) {
    if (typeof value === 'number' && !fixUnitBlackUnit[prop]) {
        value = value + 'px';
    }
    element.style.setProperty(prop, value + '', '');
}

function visitStyle(target, callback, prefix) {
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

function setStyles(context, element, styles) {
    visitStyle(styles, (prop, propValue) => {
        if (propValue instanceof Property) {
            context._bindings.push(bind(propValue, (propValue) => {
                setStyle(element, prop, propValue);
            }));
        } else {
            setStyle(element, prop, propValue);
        }
    }, '');
}

function visitClassDict(target, callback) {
    Object.keys(target).forEach((key) => {
        let item = target[key];
        if (item === true) {
            callback.addClass(item);
        } else if (item instanceof Property) {
            callback.bindClass(key, item);
        }
    });
}

function visitClassList(target, callback) {
    target.forEach((item) => {
        if (item == null) {
            return;
        }
        if (Array.isArray(item)) {
            visitClassList(item, callback);
            return;
        }
        if (item instanceof Property) {
            callback.bindClassList(item);
            return;
        }
        if (item.constructor === Object) {
            visitClassDict(item, callback);
            return;
        }
        callback.addClass(item);
    });
}

function setClasses(context, element, value) {
    if (!Array.isArray(value)) {
        value = [value];
    }
    visitClassList(value, {
        addClass(class_) {
            element.classList.add(class_);
        },
        bindClass(class_, target) {
            context._bindings.push(bind(target, (value) => {
                if (value) {
                    element.classList.add(class_);
                } else {
                    element.classList.remove(class_);
                }
            }));
        },
        bindClassList(target) {
            let lastList = [];
            context._bindings.push(bind(target, (list) => {
                lastList.forEach((item) => {
                    element.classList.remove(item);
                });
                list.forEach((item) => {
                    element.classList.add(item);
                });
                lastList = list.slice(0);
            }));
        }
    });
}

class ListenerBinding {
    _target;
    _type;
    _listener;

    constructor(target, type, listener) {
        this._target = target;
        this._type = type;
        this._listener = listener;
    }

    setup() {
        this._target.addEventListener(this._type, this._listener);
    }

    cleanup() {
        this._target.removeEventListener(this.type, this._listener);
    }
}

function setListener(context, element, type, value) {
    let listener;
    if (value instanceof Property) {
        listener = (evt) => {
            let handler = value.$getValue();
            if (handler != null) {
                return handler(evt);
            }
        };
    } else {
        listener = value;
    }
    context._bindings.push(new ListenerBinding(element, type, listener));
}

function defaultSetter(element, attr, attrValue) {
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

    if (attrName in element) {
        try {
            element[attrName] = attrValue;
            return;
        } catch (ex) {
        }
    }

    element.setAttribute(attr, attrValue);
}

function svgAnimatedLengthSetter(element, attr, attrValue) {
    element[attr].baseVal.value = attrValue;
}

const setterTable = {
    'http://www.w3.org/2000/svg': {
        'line': {
            'x1': svgAnimatedLengthSetter,
            'x2': svgAnimatedLengthSetter,
            'y1': svgAnimatedLengthSetter,
            'y2': svgAnimatedLengthSetter
        },
        'circle': {
            'cx': svgAnimatedLengthSetter,
            'cy': svgAnimatedLengthSetter
        }
    }
};

function lookupAttrSetter(namespace, tag, attr) {
    let value = setterTable[namespace];
    if (!value) {
        return;
    }
    value = value[tag];
    if (!value) {
        return;
    }
    value = value[attr];
    if (!value) {
        return;
    }
    return value;
}

// TODO:
function setAttr(element, attr, attrValue) {
    let setter = lookupAttrSetter(element.namespaceURI, element.tagName, attr) ||
            defaultSetter;
    setter(element, attr, attrValue);
}

const tagsIntroduceNamespace = {
    'svg': 'http://www.w3.org/2000/svg'
};

function createView(class_, script) {
    let defaultProps = class_.defaultProps || {};
    let finalProps = class_.finalProps || {};
    let model = {
        ...defaultProps,
        ...script.attrs
    };
    Object.keys(model).forEach((key) => {
        let property = model[key];
        if (finalProps[key]) {
            if (property instanceof Property) {
                property = property.$getValue();
            }
        } else {
            if (!(property instanceof Property)) {
                property = stored(property);
            }
        }
        model[key] = property;
    });
    model.$tag = this;
    model.$children = script.children;
    let viewModel = class_.viewModel === undefined ?
        model : class_.viewModel(model);
    return class_.view(viewModel);
}

class ReadBinding extends Callable {
    constructor(element, attr, events, writer) {
        super();
        this._element = element;
        this._attr = attr;
        this._events = events;
        this._writer = writer;
    }
    $invoke(this_, evt) {
        this._read();
    }
    _read() {
        (this._writer)(this._element[this._attr]);
    }
    setup() {
        this._events.forEach((type) => {
            this._element.addEventListener(type, this);
        });
        this._read();
    }
    cleanup() {
        this._events.forEach((type) => {
            this._element.removeEventListener(type, this);
        });
    }
}

function setReadBinding(context, element, attr, events, writer) {
    context._bindings.push(new ReadBinding(element, attr, events, writer));
}

export function renderElement(context, script) {
    let tag = script.tag;

    if (typeof tag === 'object') {
        return renderScript(context, createView(tag, script));
    }

    if (typeof tag === 'function') {
        return renderScript(context, tag(script));
    }

    let tagName = tag;
    if (tagsIntroduceNamespace[tagName]) {
        context._namespaceStack.push(context._namespace);
        context._namespace = tagsIntroduceNamespace[tagName];
    }

    let element;
    if (context._namespace !== undefined) {
        element = document.createElementNS(context._namespace, tagName);
    } else {
        element = document.createElement(tagName);
    }

    if (script.attrs !== null) {
        Object.keys(script.attrs).forEach((attr) => {
            let attrValue = script.attrs[attr];
            if (attrValue == null) {
                return;
            }
            if (attr.charAt(0) === '$') {
                if (attr === '$init') {
                    let bindings = attrValue(element);
                    bindings.forEach((binding) => {
                        context._bindings.push(binding);
                    });
                }
                return;
            }
            if (/\$/.test(attr)) {
                let [attr2, ...events] = attr.split(/\$/g);
                setReadBinding(context, element, attr2, events, attrValue);
                return;
            }
            if (attr.startsWith('on')) {
                setListener(context, element, attr.substring(2), attrValue);
                return;
            }
            if (attr === 'class') {
                setClasses(context, element, attrValue);
                return;
            }
            if (attr === 'style' && attrValue.constructor === Object) {
                setStyles(context, element, attrValue);
                return;
            }
            if (attrValue instanceof Property) {
                context._bindings.push(bind(attrValue, (attrValue) => {
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
        context._namespace = context._namespaceStack.pop();
    }

    return element;
}
