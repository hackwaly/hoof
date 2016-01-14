import {Property} from './property';

export class Stored extends Property {
    _filter(value) {
        return value;
    }

    constructor(initialValue, filter) {
        super();
        this._storedValue = initialValue;
        if (filter !== undefined) {
            this._filter = filter;
        }
    }

    isWritable() {
        return true;
    }

    $getValue(context) {
        return this._storedValue;
    }

    $setValue(context, value) {
        value = this._filter.call(context, value);
        this.$setStoredValue(value);
    }
}

export function stored(initialValue, filter) {
    return new Stored(initialValue, filter);
}
