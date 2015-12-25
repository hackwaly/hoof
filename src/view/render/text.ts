import {Context} from '../render';

export function renderText(context: Context, script: string) {
	return document.createTextNode(script);
}