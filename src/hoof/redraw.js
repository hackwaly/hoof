import {commit} from '../property/index';

let updateQueue = new Set();
let updateCallbacks = [];

function redraw() {
    commit();
    while (updateQueue.size > 0) {
        updateQueue.forEach((binding) => {
            binding.$update();
        });
        updateQueue.clear();
        commit();
    }
    let callbacks = updateCallbacks;
    updateCallbacks = [];
    callbacks.forEach((callback) => callback());
}

export function schedule(binding) {
    if (updateQueue.size <= 0) {
        window.requestAnimationFrame(redraw);
    }
    updateQueue.add(binding);
}

export function waitForNextRedraw(callback) {
    updateCallbacks.push(callback);
}

class UpdaterBinding {
    _version;
    _target;
    _updater;

    constructor(target, updater) {
        this._target = target;
        this._updater = updater;
    }

    $onNotify() {
        schedule(this);
    }

    $update() {
        let value = this._target.$getValue();
        if (this._target._version !== this._version) {
            this._version = this._target._version;
            this._updater(value);
        }
    }

    setup() {
        let value = this._target.$getValue();
        this._version = this._target._version;
        this._updater(value);
        this._target.addObserver(this);
    }

    cleanup() {
        this._target.removeObserver(this);
    }
}

export function bind(target, updater) {
    return new UpdaterBinding(target, updater);
}
