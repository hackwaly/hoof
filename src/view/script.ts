import {Property, computed} from '../property/library';

export type Script = string | number | ElementScript | ArrayScript | PropertyScript | DynamicListScript<any>;
export interface ArrayScript extends Array<Script> { }
export interface PropertyScript extends Property<Script> { }

export type CustomTag = (element: ElementScript) => Script;
export type Tag = string | CustomTag;

export function Fragment(element: ElementScript) {
    return element.children;
}

export class ElementScript {
    public constructor(
        public tag: Tag,
        public attrs: { [attr: string]: any },
        public children: Script[]
    ) { }
}

export type MapFunc<T> = (value: Property<T>, index: Property<number>, length: Property<number>) => Script;
export interface MapPropertyOptions<T> {
    mapFunc: MapFunc<T>,
    keyFunc?: (value: T) => (string | number)[],
    unordered?: boolean
};

export class DynamicListScript<T> {
    public constructor(
        public property: Property<T[]>,
        public mapFunc: MapFunc<T>,
        public keyFunc: (model: T) => any[],
        public unordered: boolean
    ) { }
}

export function dynamicList<T>(
    property: Property<T[]>,
    mapFuncOrOptions: MapFunc<T> | MapPropertyOptions<T>) {
    let options: MapPropertyOptions<T> = (typeof mapFuncOrOptions !== 'object') ?
        { mapFunc: mapFuncOrOptions } : mapFuncOrOptions as any;
    return new DynamicListScript(
        property,
        options.mapFunc,
        options.keyFunc,
        options.unordered
    );
}

export function dynamic<T>(property: Property<T>, mapFunc: MapFunc<T>) {
    return new DynamicListScript(
        computed(() => {
            let value = property();
            if (value != null) {
                return [value];
            } else {
                return [];
            }
        }),
        mapFunc,
        (value) => [value],
        true
    );
}

export const React = {
    createElement(tag: Tag, attrs: { [attr: string]: any }, ...children: Script[]) {
        return new ElementScript(tag, attrs, children);
    }
};
