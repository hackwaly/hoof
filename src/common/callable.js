export class Callable {
    constructor() {
        function callable(...args) {
            return callable.$invoke(this, ...args);
        }

        Object.setPrototypeOf(callable, Object.getPrototypeOf(this));
        return callable;
    }

    $invoke(this_, ...args) {
    }
}

Object.setPrototypeOf(Callable.prototype, Function.prototype);
