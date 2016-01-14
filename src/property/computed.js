import {Property} from './property';
import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';

const Flags_initial = 1;
const Flags_active = 2;
const Flags_evaluating = 4;
const Flags_updated = 8;
const Flags_final = 16;

export class Computed extends Property {
    _flags = Flags_initial;
    _getter;
    _staticDependencies;
    _dynamicDependencies;

    constructor(getter, staticDependencies) {
        super();
        this._getter = getter;
        if (staticDependencies !== undefined) {
            this._staticDependencies = staticDependencies;
        }
    }

    isFinal() {
        return (this._flags & Flags_final) !== 0;
    }

    $activate() {
        this._flags |= Flags_active;
        if (this._staticDependencies !== undefined) {
            this._staticDependencies.forEach((dependency) => {
                dependency.addObserver(this);
            });
        }
        dirtyPropagation.queue(this);
    }

    $deactivate() {
        this._flags &= ~(Flags_active | Flags_updated);
        if (this._staticDependencies !== undefined) {
            this._staticDependencies.forEach((dependency) => {
                dependency.removeObserver(this);
            });
        }
        if (this._dynamicDependencies !== undefined) {
            this._dynamicDependencies.forEach((dependency) => {
                dependency.removeObserver(this);
            });
            this._dynamicDependencies = undefined;
        }
    }

    $getValue(context) {
        if ((this._flags & Flags_evaluating) !== 0) {
            throw new Error('Circular dependency detected');
        }
        dirtyPropagation.commit();
        this.$update(context);
        return this._storedValue;
    }

    $update(context) {
        if ((this._flags & Flags_updated) !== 0) {
            return;
        }

        this._flags |= Flags_evaluating;
        let {value, dependencies} = dependencyDetection.evaluate(this._getter, context);
        this._flags &= ~Flags_evaluating;

        if (dependencies.length <= 0) {
            dependencies = undefined;
            if (this._staticDependencies === undefined) {
                this._flags |= Flags_final;
            }
        }

        if ((this._flags & Flags_initial) !== 0) {
            this._storedValue = value;
            this._flags &= ~Flags_initial;
            if ((this._flags & Flags_final) !== 0) {
                this._observers = undefined;
            }
        } else {
            this.$setStoredValue(value);
        }

        if ((this._flags & Flags_active) !== 0) {
            this._setDynamicDependencies(dependencies);
            this._flags |= Flags_updated;
        }
    }

    _setDynamicDependencies(newDependencies) {
        let oldDependencies = this._dynamicDependencies;

        if (oldDependencies === undefined && newDependencies === undefined) {
            return;
        }

        if (oldDependencies !== undefined) {
            for (let j = oldDependencies.length; j-- > 0;) {
                let dependency = oldDependencies[j];
                if (newDependencies === undefined || newDependencies.indexOf(dependency) < 0) {
                    dependency.removeObserver(this);
                }
            }
        }

        if (newDependencies !== undefined) {
            for (let j = newDependencies.length; j-- > 0;) {
                let dependency = newDependencies[j];
                if (oldDependencies === undefined || oldDependencies.indexOf(dependency) < 0) {
                    dependency.addObserver(this);
                }
            }
        }

        this._dynamicDependencies = newDependencies;
    }

    $onNotify() {
        if (!this.isFinal()) {
            this._flags &= ~Flags_updated;
            dirtyPropagation.queue(this);
        }
    }
}

export function computed(getter, staticDependencies) {
    return new Computed(getter, staticDependencies);
}
