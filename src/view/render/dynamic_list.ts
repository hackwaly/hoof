import {Script, DynamicListScript} from '../script';
import {stored} from '../../property/library';
import {Context, render, bind} from '../render';
import {compareArrays} from '../../utils/compare_arrays';
import {insertAfter} from '../../utils/insert_after';
import {iterateFromTil} from '../../utils/iterate_from_til';

// todo: remove usage of array diff algorithm. use key func instead.
export function renderDynamicList(context: Context, script: DynamicListScript<any>) {
    let fragment = document.createDocumentFragment();
    let startMarker = document.createComment('');
    let endMarker = document.createComment('');
    let namespace = context.namespace;
    fragment.appendChild(startMarker);
    fragment.appendChild(endMarker);

    let lastArray = [];
    let lastMappings = [];
    context.bindings.push(bind(script.property, (array) => {
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
                    lastMapping._indexField.set(record.index);
                    lastMapping._valueField.set(record.value);
                    lastMapping._lengthField.set(array.length);
                    mappings.push(lastMapping);
                }
            } else if (record.status === 'retained') {
                let index = mappings.length;
                let lastMapping = lastMappings[lastIndex];
                lastMapping._indexField.set(index);
                lastMapping._valueField.set(record.value);
                lastMapping._lengthField.set(array.length);
                mappings.push(lastMapping);
                lastIndex++;
            } else if (record.status === 'deleted') {
                let lastMapping = lastMappings[record.index];
                if (record.moved === undefined) {
                    if (script.keyFunc !== undefined) {
                        lastMapping._keys = script.keyFunc(record.value);
                    }
                    trash.push(lastMapping);
                }
                lastMapping._context.remove();
                lastIndex++;
            }
        }

        function recycle(keys: any[]) {
            for (let i = 0; i < keys.length; i++) {
                for (let j = 0; j < trash.length; j++) {
                    if (keys[i] === trash[j]._keys[i]) {
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
            if (script.keyFunc !== undefined) {
                let keys = script.keyFunc(record.value);
                mapping = recycle(keys);
                if (mapping !== null) {
                    mapping._indexField.set(record.index);
                    mapping._valueField.set(record.value);
                    mapping._lengthField.set(array.length);
                }
            }
            if (mapping === null) {
                let indexField = stored(record.index);
                let valueField = stored(record.value);
                let lengthField = stored(array.length);
                let mappedScript = script.mapFunc(valueField, indexField, lengthField);
                let context = render(mappedScript, namespace);
                mapping = {
                    _context: context,
                    _indexField: indexField,
                    _valueField: valueField,
                    _lengthField: lengthField
                };
                if (script.unordered) {
                    placeQueue.push(mapping);
                }
                setupQueue.push(context);
            }
            mappings[record.index] = mapping;
        }

        let prevNode: Node = startMarker;
        for (let i = 0; i < placeQueue.length; i++) {
            let mapping = placeQueue[i];
            let context = mapping._context;
            iterateFromTil(context.firstNode, context.lastNode, (node) => {
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