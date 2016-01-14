import {Callable} from './callable';

export const ObservableMixin = (superclass) => {
    return class extends superclass {
        _observers;

        constructor() {
            super();
            if (!this.isFinal()) {
                this._observers = [];
            }
        }

        $activate() {
        }

        $deactivate() {
        }

        isFinal() {
            return false;
        }

        addObserver(observer) {
            if (this.isFinal()) {
                return;
            }
            if (this._observers.length <= 0) {
                this.$activate();
            }
            this._observers.push(observer);
        }

        removeObserver(observer) {
            if (this.isFinal()) {
                return;
            }
            let index = this._observers.indexOf(observer);
            if (index >= 0) {
                this._observers.splice(index, 1);
                if (this._observers.length <= 0) {
                    this.$deactivate();
                }
            }
        }

        notifyObservers(data) {
            for (let i = 0; i < this._observers.length; i++) {
                this._observers[i].$onNotify(data);
            }
            if (this.isFinal()) {
                this._observers = undefined;
            }
        }
    };
};
