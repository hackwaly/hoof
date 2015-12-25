import {Property} from './property';

export class StoredProperty<TValue> extends Property<TValue> {
	private filter(value: TValue) {
		return value;
	}

	public constructor(initialValue: TValue, filter?: (value: TValue) => TValue) {
		super();
		if (filter !== undefined) {
			this.filter = filter;
		}
		this.field = (this.filter)(initialValue);
	}

	protected get() {
		return this.field;
	}

	public set(value: TValue) {
		this.setField(value);
	}
}

export function stored<TValue>(initialValue: TValue, filter?: (value: TValue) => TValue) {
	return new StoredProperty(initialValue, filter);
}
