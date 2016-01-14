import {Callable} from '../common/callable';
import {ObservableMixin} from '../common/observable';

export class Notifier extends ObservableMixin(Callable) {
    $invoke(data) {
        this.notifyObservers(data);
    }
}

export function notifier() {
    return new Notifier();
}
