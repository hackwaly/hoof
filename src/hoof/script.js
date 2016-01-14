import {Callable} from '../common/callable';
import {Property} from '../property/index';

export class ElementScript {
    tag;
    attrs;
    children;

    constructor(tag, attrs, children) {
        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
    }
}

export class DynamicListScript {
    target;
    unordered;

    mapFunc(value) {
        return value;
    }

    classifyFunc(value) {
        return [value];
    }

    constructor(target, unordered) {
        this.target = target;
        this.unordered = unordered;
    }

    map(mapFunc) {
        this.mapFunc = mapFunc;
        return this;
    }

    classifyBy(func) {
        this.classifyFunc = func;
        return this;
    }

    recycle(yesOrNo) {
        if (!yesOrNo) {
            this.classifyFunc = undefined;
        }
        return this;
    }
}

export function componentClass(class_) {
    return class_;
}

export function Fragment(element) {
    return element.children;
}

export function dynamicList(target, unordered) {
    return new DynamicListScript(target, unordered);
}

export const React = {
    createElement(tag, attrs, ...children) {
        return new ElementScript(tag, attrs, children);
    }
};
