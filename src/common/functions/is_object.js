export function isObject(value) {
    return typeof value === 'function' ||
        (typeof value === 'object' && value !== null);
}
