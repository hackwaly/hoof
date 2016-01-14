export function insertAfter(newNode, prevNode) {
    if (prevNode.nextSibling !== newNode) {
        prevNode.parentNode.insertBefore(newNode, prevNode.nextSibling);
    }
}
