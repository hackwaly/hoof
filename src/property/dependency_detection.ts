import {Property} from './property';

let stack: Property<any>[][] = [];
let frame: Property<any>[] = null;

export function track(property: Property<any>) {
	if (frame !== null) {
        if (frame.indexOf(property) < 0) {
		  frame.push(property);
        }
	}
}

export function evaluate<TValue>(getter: () => TValue) {
	stack.push(frame);
	frame = [];
	let value = getter();
	let dependencies = frame;
	frame = stack.pop();
	return {value, dependencies};
}
