import {Property} from './property';

export class ConstantProperty<TValue> extends Property<TValue> {
	public constructor(value: TValue) {
		super();
		this.field = value;
	}

	public isFinal() {
		return true;
	}

	protected get() {
		return this.field;
	}

	public set(value: TValue) {
		throw new Error('Write to constant property');
	}
}

export function constant<TValue>(value: TValue) {
	return new ConstantProperty(value);
}