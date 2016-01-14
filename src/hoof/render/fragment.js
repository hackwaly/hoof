import {renderScript} from '../render';

export function renderFragment(context, script) {
    let fragment = document.createDocumentFragment();
    for (let childScript of script) {
        fragment.appendChild(renderScript(context, childScript));
    }
    return fragment;
}
