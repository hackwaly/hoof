import {Property} from './property';

interface Updatable {
	update(): void;
}

let dirtySeeds: Set<Property<any>> = new Set();
let updateQueue: Set<Updatable> = new Set();
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

export function mark(property: Property<any>) {
	dirtySeeds.add(property);
	schedule();
}

export function queue(target: Updatable) {
    updateQueue.add(target);
    schedule();
}

function notify(target: Property<any>) {
	target.notifyObservers();
}

function update(target: Updatable) {
	target.update();
}

export function commit() {
	if (committing) {
		return;
	}
	committing = true;
    while (dirtySeeds.size > 0 || updateQueue.size > 0) {
        while (dirtySeeds.size > 0) {
            let properties = dirtySeeds;
            dirtySeeds = new Set();
            properties.forEach(notify);
        }
        while (updateQueue.size > 0) {
            let properties = updateQueue;
            updateQueue = new Set();
            properties.forEach(update);
        }
    }
	committing = false;
}