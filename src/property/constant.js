import {Property} from './property';

export class Constant extends Property {
    constructor(initialValue) {
        super();
        this._storedValue = initialValue;
    }

    isFinal() {
        return true;
    }

    $getValue(context) {
        return this._storedValue;
    }
}

export function constant(initialValue) {
    return new Constant(initialValue);
}
