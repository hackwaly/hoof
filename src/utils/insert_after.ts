export function insertAfter(newNode: Node, prevNode: Node) {
    if (prevNode.nextSibling !== newNode) {
        prevNode.parentNode.insertBefore(newNode, prevNode.nextSibling);
    }
}
