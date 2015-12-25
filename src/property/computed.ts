import {Property} from './property';
import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';

const enum Flags {
	none = 0,
	active = 1,
	initial = 2,
	evaluating = 4,
	updated = 8,
	final = 16
}

export class ComputedProperty<TValue> extends Property<TValue> {
	private flags: Flags = Flags.initial;
	private dependencies: Property<any>[];
	private getter: () => TValue;
	private setter(value: TValue) {
		throw new Error('Write to non-writable computed property');
	}

	public constructor(getter: () => TValue, setter?: (value: TValue) => void) {
		super();
		this.getter = getter;
		if (setter !== undefined) {
			this.setter = setter;
		}
	}

	public isFinal() {
		return (this.flags & Flags.final) !== 0;
	}

	protected activate() {
		this.flags |= Flags.active;
		dirtyPropagation.queue(this);
		dirtyPropagation.commit();
	}

	protected deactivate() {
		this.flags &= ~Flags.active;
		if (this.dependencies !== undefined) {
			this.dependencies.forEach((dependency) => {
				dependency.removeObserver(this);
			});
			this.dependencies = undefined;
		}
	}

	private setDependencies(newDependencies: Property<any>[]) {
		if ((this.flags & Flags.active) === 0) {
			return;
		}

		let oldDependencies = this.dependencies;
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
		this.dependencies = newDependencies;
	}

	protected get() {
		if ((this.flags & Flags.evaluating) !== 0) {
			throw new Error('Circular dependency detected');
		}
		dirtyPropagation.commit();
		this.update();
		return this.field;
	}

	public update() {
		if ((this.flags & Flags.updated) !== 0) {
			return;
		}

		this.flags |= Flags.evaluating;
		let {value, dependencies} = dependencyDetection.evaluate(this.getter);
		this.flags &= ~Flags.evaluating;

		if (dependencies.length <= 0) {
			dependencies = undefined;
			this.flags |= Flags.final;
		}

		if ((this.flags & Flags.initial) !== 0) {
			this.field = value;
			this.flags &= ~Flags.initial;
			if (this.isFinal()) {
				this.observers = undefined;
			}
		} else {
			this.setField(value);
		}

		this.setDependencies(dependencies);
		this.flags |= Flags.updated;
	}

	public set(value: TValue) {
		(this.setter)(value);
	}

	public onNotify() {
		if (!this.isFinal()) {
			this.flags &= ~Flags.updated;
			dirtyPropagation.queue(this);
		}
	}
}

export function computed<TValue>(getter: () => TValue, setter?: (value: TValue) => void) {
	return new ComputedProperty(getter, setter);
}