export function iterateFromTil(node: Node, til: Node, callback: (node: Node) => void) {
    let end = til.nextSibling;
    while (node !== end) {
        let next = node.nextSibling;
        callback(node);
        node = next;
    }
}