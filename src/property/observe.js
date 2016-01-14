import {Property} from './property';

class Observer {
    _target;
    _lastVersion;
    _callback;

    constructor(target, callback) {
        this._target = target;
        this._callback = callback;
    }

    $onNotify() {
        let value = this._target.$getValue();
        let version = this._target._version;
        if (_version !== this._lastVersion) {
            this._callback(value, this._lastVersion === undefined);
        }
        this._lastVersion = _version;
    }
}

export function observe(target, callback) {
    let observer = new Observer(target, callback);
    target.addObserver(observer);
    observer.$onNotify();
    return () => {
        target.removeObserver(observer);
    };
}
