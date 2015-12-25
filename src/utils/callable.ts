export abstract class Callable {
	public constructor() {
		function delegate(...args) {
			return (delegate as any as Callable).invoke(...args);
		}
		Object.setPrototypeOf(delegate, Object.getPrototypeOf(this));
		return (delegate as any as Callable);
	}
	protected abstract invoke(...args);
}
