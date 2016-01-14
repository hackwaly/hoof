import {Callable} from '../common/callable';
import {ObservableMixin} from '../common/observable';
import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';
import {isObject} from '../common/functions/is_object';

export class Property extends ObservableMixin(Callable) {
    _version = 0;
    _storedValue;

    $invoke(context) {
        if (arguments.length <= 1) {
            return this._get(context);
        } else {
            return this._set(context, arguments[1]);
        }
    }

    isWritable() {
        return false;
    }

    _get(context) {
        dependencyDetection.track(this);
        return this.$getValue(context);
    }

    _set(context, value) {
        if (!this.isWritable()) {
            throw new Error('Write to non-writable property');
        }
        this.$setValue(context, value);
    }

    $getValue(context) {
    }

    $setValue(context, value) {
    }

    $setStoredValue(value) {
        if (!Object.is(value, this._storedValue) || isObject(value)) {
            this._storedValue = value;
            this._version++;
            dirtyPropagation.mark(this);
        }
    }
}
