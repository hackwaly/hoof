import {Property} from './property';

export function observe<TValue>(property: Property<TValue>, callback: (value: TValue, isInitial: boolean) => void) {
    let version;
    let observer = {
        onNotify(property) {
            let value = property.value();
            let isInitial = version === undefined;
            if (isInitial || property.version !== version) {
                callback(value, isInitial);
                version = property.version;
            }
        }
    };
    property.addObserver(observer);
    observer.onNotify(property);
    return () => {
        property.removeObserver(observer);
    };
}
