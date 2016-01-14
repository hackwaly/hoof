let dirtySeeds = new Set();
let updateQueue = new Set();
let scheduled = false;
let committing = false;
let fulfilled = Promise.resolve();

function schedule() {
    if (!scheduled) {
        scheduled = true;
        fulfilled.then(flush);
    }
}

function flush() {
    commit();
    scheduled = false;
}

export function mark(property) {
    dirtySeeds.add(property);
    schedule();
}

export function queue(target) {
    updateQueue.add(target);
    schedule();
}

const doNotify = (target) => {
    target.notifyObservers(target);
};

const doUpdate = (target) => {
    target.$update();
};

export function commit() {
    if (committing) {
        return;
    }
    committing = true;
    while (dirtySeeds.size > 0 || updateQueue.size > 0) {
        while (dirtySeeds.size > 0) {
            let properties = dirtySeeds;
            dirtySeeds = new Set();
            properties.forEach(doNotify);
        }
        while (updateQueue.size > 0) {
            let properties = updateQueue;
            updateQueue = new Set();
            properties.forEach(doUpdate);
        }
    }
    committing = false;
}
