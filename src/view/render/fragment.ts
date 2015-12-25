import {Script} from '../script';
import {Context, renderScript} from '../render';

export function renderFragment(context: Context, script: Script[]) {
	let fragment = document.createDocumentFragment();
	for (let childScript of script) {
		fragment.appendChild(renderScript(context, childScript));
	}
	return fragment;
}
