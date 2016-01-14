export function iterateFromTil(node, til, callback) {
    let end = til.nextSibling;
    while (node !== end) {
        let next = node.nextSibling;
        callback(node);
        node = next;
    }
}
