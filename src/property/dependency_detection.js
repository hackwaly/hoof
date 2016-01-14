let stack = [];
let frame = null;

export function track(property) {
    if (frame !== null) {
        if (frame.indexOf(property) < 0) {
            frame.push(property);
        }
    }
}

export function evaluate(getter, context) {
    stack.push(frame);
    frame = [];
    let value = getter.call(context);
    let dependencies = frame;
    frame = stack.pop();
    return {value, dependencies};
}
