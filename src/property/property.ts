import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';
import {Callable} from '../utils/callable';

export interface Property<TValue> {
	(): TValue;
}

interface Observer<TValue> {
	onNotify(property: Property<TValue>): void;
}

export abstract class Property<TValue> extends Callable {
	public version: number = 0;
	protected field: TValue;
	protected observers: Observer<TValue>[];

	public constructor() {
		super();
		if (!this.isFinal()) {
			this.observers = [];
		}
	}

	public isFinal() {
		return false;
	}

	protected setField(value: TValue) {
        // TODO:
		if (!Object.is(value, this.field) || (typeof value === 'object' || typeof value === 'function')) {
			this.field = value;
			this.version++;
			dirtyPropagation.mark(this);
		}
	}

	protected invoke() {
		return this.value();
	}

	public value() {
		dependencyDetection.track(this);
		return this.get();
	}
	protected abstract get(): TValue;
	public abstract set(value: TValue);

	protected activate() { }
	protected deactivate() { }

	public addObserver(observer: Observer<TValue>) {
		if (this.isFinal()) {
			return;
		}
		if (this.observers.length <= 0) {
			this.activate();
		}
		this.observers.push(observer);
	}

	public removeObserver(observer: Observer<TValue>) {
		if (this.isFinal()) {
			return;
		}
		let index = this.observers.indexOf(observer);
		if (index >= 0) {
			this.observers.splice(index, 1);
			if (this.observers.length <= 0) {
				this.deactivate();
			}
		}
	}

	public notifyObservers() {
		for (let i = 0; i < this.observers.length; i++) {
			let observer = this.observers[i];
			observer.onNotify(this);
		}
		if (this.isFinal()) {
			this.observers = undefined;
		}
	}
}
