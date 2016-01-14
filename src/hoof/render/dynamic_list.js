import {stored, computed} from '../../property/index';
import {bind} from '../redraw';
import {render} from '../render';
import {compareArrays} from '../utils/compare_arrays';
import {iterateFromTil} from '../utils/iterate_from_til';
import {insertAfter} from '../utils/insert_after';

export function renderDynamicList(context, script) {

    let fragment = document.createDocumentFragment();
    let startMarker = document.createComment('');
    let endMarker = document.createComment('');
    let namespace = context._namespace;
    fragment.appendChild(startMarker);
    fragment.appendChild(endMarker);

    let lastArray = [];
    let lastMappings = [];
    context._bindings.push(bind(script.target, (array) => {
        let editScript = compareArrays(lastArray, array);
        let mappings = [];

        let lastIndex = 0;
        let trash = [];
        let allocQueue = [];
        let placeQueue = script.unordered ? [] : mappings;

        for (let i = 0; i < editScript.length; i++) {
            let record = editScript[i];
            if (record.status === 'added') {
                if (record.moved === undefined) {
                    mappings.push(null);
                    allocQueue.push(record);
                } else {
                    let lastMapping = lastMappings[record.moved];
                    lastMapping.indexField(record.index);
                    lastMapping.valueField(record.value);
                    lastMapping.lengthField(array.length);
                    mappings.push(lastMapping);
                }
            } else if (record.status === 'retained') {
                let index = mappings.length;
                let lastMapping = lastMappings[lastIndex];
                lastMapping.indexField(index);
                lastMapping.valueField(record.value);
                lastMapping.lengthField(array.length);
                mappings.push(lastMapping);
                lastIndex++;
            } else if (record.status === 'deleted') {
                let lastMapping = lastMappings[record.index];
                if (record.moved === undefined) {
                    if (script.classifyFunc !== undefined && lastMapping._classes === undefined) {
                        lastMapping._classes = (script.classifyFunc)(record.value);
                    }
                    trash.push(lastMapping);
                }
                lastMapping.context.remove();
                lastIndex++;
            }
        }

        function recycle(classes) {
            for (let i = 0; i < classes.length; i++) {
                for (let j = 0; j < trash.length; j++) {
                    if (classes[i] === trash[j]._classes[i]) {
                        let mapping = trash[j];
                        trash.splice(j, 1);
                        return mapping;
                    }
                }
            }
            return null;
        }

        let setupQueue = [];
        for (let i = 0; i < allocQueue.length; i++) {
            let record = allocQueue[i];
            let mapping = null;
            if (script.classifyFunc !== undefined) {
                let classes = (script.classifyFunc)(record.value);
                mapping = recycle(classes);
                if (mapping !== null) {
                    mapping.indexField(record.index);
                    mapping.valueField(record.value);
                    mapping.lengthField(array.length);
                }
            }
            if (mapping === null) {
                let indexField = stored(record.index);
                let valueField = stored(record.value);
                let lengthField = stored(array.length);
                let mappedScript = script.mapFunc(valueField, indexField, lengthField);
                let context = render(mappedScript, namespace);
                mapping = {
                    context: context,
                    indexField: indexField,
                    valueField: valueField,
                    lengthField: lengthField
                };
                if (script.unordered) {
                    placeQueue.push(mapping);
                }
                setupQueue.push(context);
            }
            mappings[record.index] = mapping;
        }

        let prevNode = startMarker;
        for (let i = 0; i < placeQueue.length; i++) {
            let mapping = placeQueue[i];
            let context = mapping.context;
            iterateFromTil(context._firstNode, context._lastNode, (node) => {
                insertAfter(node, prevNode);
                prevNode = node;
            });
        }

        for (let i = 0; i < setupQueue.length; i++) {
            setupQueue[i].setup();
        }

        for (let i = 0; i < trash.length; i++) {
            trash[i].destroy();
        }

        lastArray = array.slice(0);
        lastMappings = mappings;
    }));

    return fragment;
}
