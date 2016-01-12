(function () { 'use strict';

    var babelHelpers = {};

    babelHelpers.typeof = function (obj) {
      return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
    };

    babelHelpers.classCallCheck = function (instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    };

    babelHelpers.inherits = function (subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    };

    babelHelpers.possibleConstructorReturn = function (self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    };

    babelHelpers;
    var stack = [];
    var frame = null;
    function track(property) {
        if (frame !== null) {
            if (frame.indexOf(property) < 0) {
                frame.push(property);
            }
        }
    }
    function evaluate(getter) {
        stack.push(frame);
        frame = [];
        var value = getter();
        var dependencies = frame;
        frame = stack.pop();
        return { value: value, dependencies: dependencies };
    }

    var dirtySeeds = new Set();
    var updateQueue = new Set();
    var scheduled = false;
    var committing = false;
    var fulfilled = Promise.resolve();
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
    function mark(property) {
        dirtySeeds.add(property);
        schedule();
    }
    function queue(target) {
        updateQueue.add(target);
        schedule();
    }
    function notify(target) {
        target.notifyObservers();
    }
    function update(target) {
        target.update();
    }
    function commit() {
        if (committing) {
            return;
        }
        committing = true;
        while (dirtySeeds.size > 0 || updateQueue.size > 0) {
            while (dirtySeeds.size > 0) {
                var properties = dirtySeeds;
                dirtySeeds = new Set();
                properties.forEach(notify);
            }
            while (updateQueue.size > 0) {
                var properties = updateQueue;
                updateQueue = new Set();
                properties.forEach(update);
            }
        }
        committing = false;
    }

    var Callable = function Callable() {
        babelHelpers.classCallCheck(this, Callable);

        function delegate() {
            return delegate.invoke.apply(delegate, arguments);
        }
        Object.setPrototypeOf(delegate, Object.getPrototypeOf(this));
        return delegate;
    };

    var Property = (function (_Callable) {
        babelHelpers.inherits(Property, _Callable);

        function Property() {
            babelHelpers.classCallCheck(this, Property);

            var _this = babelHelpers.possibleConstructorReturn(this, _Callable.call(this));

            _this.version = 0;
            if (!_this.isFinal()) {
                _this.observers = [];
            }
            return _this;
        }

        Property.prototype.isFinal = function isFinal() {
            return false;
        };

        Property.prototype.setField = function setField(value) {
            // TODO:
            if (!Object.is(value, this.field) || (typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) === 'object' || typeof value === 'function') {
                this.field = value;
                this.version++;
                mark(this);
            }
        };

        Property.prototype.invoke = function invoke() {
            return this.value();
        };

        Property.prototype.value = function value() {
            track(this);
            return this.get();
        };

        Property.prototype.activate = function activate() {};

        Property.prototype.deactivate = function deactivate() {};

        Property.prototype.addObserver = function addObserver(observer) {
            if (this.isFinal()) {
                return;
            }
            if (this.observers.length <= 0) {
                this.activate();
            }
            this.observers.push(observer);
        };

        Property.prototype.removeObserver = function removeObserver(observer) {
            if (this.isFinal()) {
                return;
            }
            var index = this.observers.indexOf(observer);
            if (index >= 0) {
                this.observers.splice(index, 1);
                if (this.observers.length <= 0) {
                    this.deactivate();
                }
            }
        };

        Property.prototype.notifyObservers = function notifyObservers() {
            for (var i = 0; i < this.observers.length; i++) {
                var observer = this.observers[i];
                observer.onNotify(this);
            }
            if (this.isFinal()) {
                this.observers = undefined;
            }
        };

        return Property;
    })(Callable);

    var ConstantProperty = (function (_Property) {
        babelHelpers.inherits(ConstantProperty, _Property);

        function ConstantProperty(value) {
            babelHelpers.classCallCheck(this, ConstantProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            _this.field = value;
            return _this;
        }

        ConstantProperty.prototype.isFinal = function isFinal() {
            return true;
        };

        ConstantProperty.prototype.get = function get() {
            return this.field;
        };

        ConstantProperty.prototype.set = function set(value) {
            throw new Error('Write to constant property');
        };

        return ConstantProperty;
    })(Property);

    var StoredProperty = (function (_Property) {
        babelHelpers.inherits(StoredProperty, _Property);

        function StoredProperty(initialValue, filter) {
            babelHelpers.classCallCheck(this, StoredProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            if (filter !== undefined) {
                _this.filter = filter;
            }
            _this.field = _this.filter(initialValue);
            return _this;
        }

        StoredProperty.prototype.filter = function filter(value) {
            return value;
        };

        StoredProperty.prototype.get = function get() {
            return this.field;
        };

        StoredProperty.prototype.set = function set(value) {
            this.setField(value);
        };

        return StoredProperty;
    })(Property);
    function stored(initialValue, filter) {
        return new StoredProperty(initialValue, filter);
    }

    var Flags;
    (function (Flags) {
        Flags[Flags["none"] = 0] = "none";
        Flags[Flags["active"] = 1] = "active";
        Flags[Flags["initial"] = 2] = "initial";
        Flags[Flags["evaluating"] = 4] = "evaluating";
        Flags[Flags["updated"] = 8] = "updated";
        Flags[Flags["final"] = 16] = "final";
    })(Flags || (Flags = {}));
    var ComputedProperty = (function (_Property) {
        babelHelpers.inherits(ComputedProperty, _Property);

        function ComputedProperty(getter, setter) {
            babelHelpers.classCallCheck(this, ComputedProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            _this.flags = Flags.initial;
            _this.getter = getter;
            if (setter !== undefined) {
                _this.setter = setter;
            }
            return _this;
        }

        ComputedProperty.prototype.setter = function setter(value) {
            throw new Error('Write to non-writable computed property');
        };

        ComputedProperty.prototype.isFinal = function isFinal() {
            return (this.flags & Flags.final) !== 0;
        };

        ComputedProperty.prototype.activate = function activate() {
            this.flags |= Flags.active;
            queue(this);
            commit();
        };

        ComputedProperty.prototype.deactivate = function deactivate() {
            var _this2 = this;

            this.flags &= ~Flags.active;
            if (this.dependencies !== undefined) {
                this.dependencies.forEach(function (dependency) {
                    dependency.removeObserver(_this2);
                });
                this.dependencies = undefined;
            }
        };

        ComputedProperty.prototype.setDependencies = function setDependencies(newDependencies) {
            if ((this.flags & Flags.active) === 0) {
                return;
            }
            var oldDependencies = this.dependencies;
            if (oldDependencies !== undefined) {
                for (var j = oldDependencies.length; j-- > 0;) {
                    var dependency = oldDependencies[j];
                    if (newDependencies === undefined || newDependencies.indexOf(dependency) < 0) {
                        dependency.removeObserver(this);
                    }
                }
            }
            if (newDependencies !== undefined) {
                for (var j = newDependencies.length; j-- > 0;) {
                    var dependency = newDependencies[j];
                    if (oldDependencies === undefined || oldDependencies.indexOf(dependency) < 0) {
                        dependency.addObserver(this);
                    }
                }
            }
            this.dependencies = newDependencies;
        };

        ComputedProperty.prototype.get = function get() {
            if ((this.flags & Flags.evaluating) !== 0) {
                throw new Error('Circular dependency detected');
            }
            commit();
            this.update();
            return this.field;
        };

        ComputedProperty.prototype.update = function update() {
            if ((this.flags & Flags.updated) !== 0) {
                return;
            }
            this.flags |= Flags.evaluating;

            var _dependencyDetection$ = evaluate(this.getter);

            var value = _dependencyDetection$.value;
            var dependencies = _dependencyDetection$.dependencies;

            this.flags &= ~Flags.evaluating;
            if (dependencies.length <= 0) {
                dependencies = undefined;
                this.flags |= Flags.final;
            }
            if ((this.flags & Flags.initial) !== 0) {
                this.field = value;
                this.flags &= ~Flags.initial;
                if (this.isFinal()) {
                    this.observers = undefined;
                }
            } else {
                this.setField(value);
            }
            this.setDependencies(dependencies);
            this.flags |= Flags.updated;
        };

        ComputedProperty.prototype.set = function set(value) {
            this.setter(value);
        };

        ComputedProperty.prototype.onNotify = function onNotify() {
            if (!this.isFinal()) {
                this.flags &= ~Flags.updated;
                queue(this);
            }
        };

        return ComputedProperty;
    })(Property);
    function computed(getter, setter) {
        return new ComputedProperty(getter, setter);
    }

    var ElementScript = function ElementScript(tag, attrs, children) {
        babelHelpers.classCallCheck(this, ElementScript);

        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
    };
    ;
    var DynamicListScript = function DynamicListScript(property, mapFunc, keyFunc, unordered) {
        babelHelpers.classCallCheck(this, DynamicListScript);

        this.property = property;
        this.mapFunc = mapFunc;
        this.keyFunc = keyFunc;
        this.unordered = unordered;
    };
    function dynamicList(property, mapFuncOrOptions) {
        var options = (typeof mapFuncOrOptions === 'undefined' ? 'undefined' : babelHelpers.typeof(mapFuncOrOptions)) !== 'object' ? { mapFunc: mapFuncOrOptions } : mapFuncOrOptions;
        return new DynamicListScript(property, options.mapFunc, options.keyFunc, options.unordered);
    }
    var React$1 = {
        createElement: function createElement(tag, attrs) {
            for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                children[_key - 2] = arguments[_key];
            }

            return new ElementScript(tag, attrs, children);
        }
    };

    function renderText(context, script) {
        return document.createTextNode(script);
    }

    var fixUnitBlackUnit = {
        'column-count': true,
        'fill-opacity': true,
        'flex': true,
        'flex-grow': true,
        'flex-shrink': true,
        'font-weight': true,
        'line-clamp': true,
        'line-height': true,
        'opacity': true,
        'order': true,
        'orphans': true,
        'widows': true,
        'zIndex': true,
        'zoom': true
    };
    function setStyle(element, prop, value) {
        if (typeof value === 'number' && !fixUnitBlackUnit[prop]) {
            value = value + 'px';
        }
        element.style.setProperty(prop, value + '');
    }
    function visitStyle(target, callback, prefix) {
        Object.keys(target).forEach(function (prop) {
            var value = target[prop];
            if (value == null) {
                return;
            }
            prop = prefix + prop;
            if (value.constructor === Object) {
                visitStyle(value, callback, prop + '-');
                return;
            }
            callback(prop, value);
        });
    }
    function setStyles(context, element, styles) {
        visitStyle(styles, function (prop, propValue) {
            if (propValue instanceof Property) {
                context.bindings.push(bind(propValue, function (propValue) {
                    setStyle(element, prop, propValue);
                }));
            } else {
                setStyle(element, prop, propValue);
            }
        }, '');
    }

    var ListenerBinding = (function () {
        function ListenerBinding(target, type, listener) {
            babelHelpers.classCallCheck(this, ListenerBinding);

            this.target = target;
            this.type = type;
            this.listener = listener;
        }

        ListenerBinding.prototype.setup = function setup() {
            this.target.addEventListener(this.type, this.listener);
        };

        ListenerBinding.prototype.cleanup = function cleanup() {
            this.target.removeEventListener(this.type, this.listener);
        };

        return ListenerBinding;
    })();

    function setListener(context, element, type, value) {
        var listener = undefined;
        if (value instanceof Property) {
            listener = function (evt) {
                var handler = value.value();
                if (handler != null) {
                    return handler(evt);
                }
            };
        } else {
            listener = value;
        }
        context.bindings.push(new ListenerBinding(element, type, listener));
    }
    function setAttr(element, attr, attrValue) {
        if (attr === 'style') {
            element.style.cssText = attrValue;
            return;
        }
        var attrName = attr;
        if (attrName === 'for') {
            attrName = 'htmlFor';
        } else if (attrName === 'class') {
            attrName = 'className';
        }
        if (babelHelpers.typeof(element[attrName]) === (typeof attrValue === 'undefined' ? 'undefined' : babelHelpers.typeof(attrValue))) {
            element[attrName] = attrValue;
            return;
        }
        element.setAttribute(attr, attrValue);
    }
    var tagsIntroduceNamespace = {
        'svg': 'http://www.w3.org/2000/svg'
    };
    function renderElement(context, script) {
        var tag = script.tag;
        if (typeof tag !== 'string') {
            return renderScript(context, tag(script));
        }
        var tagName = tag;
        if (tagsIntroduceNamespace[tagName]) {
            context.namespaceStack.push(context.namespace);
            context.namespace = tagsIntroduceNamespace[tagName];
        }
        var element = undefined;
        if (context.namespace !== null) {
            element = document.createElementNS(context.namespace, tagName);
        } else {
            element = document.createElement(tagName);
        }
        if (script.attrs !== null) {
            Object.keys(script.attrs).forEach(function (attr) {
                var attrValue = script.attrs[attr];
                if (attrValue == null) {
                    return;
                }
                if (attr === '$bindings') {
                    var bindings = attrValue(element);
                    bindings.forEach(function (binding) {
                        context.bindings.push(binding);
                    });
                    return;
                }
                if (attr.startsWith('on')) {
                    setListener(context, element, attr.substring(2), attrValue);
                    return;
                }
                if (attr === 'style' && attrValue.constructor === Object) {
                    setStyles(context, element, attrValue);
                    return;
                }
                if (attrValue instanceof Property) {
                    context.bindings.push(bind(attrValue, function (attrValue) {
                        setAttr(element, attr, attrValue);
                    }));
                    return;
                }
                setAttr(element, attr, attrValue);
            });
        }
        script.children.forEach(function (script) {
            element.appendChild(renderScript(context, script));
        });
        if (tagsIntroduceNamespace[tagName]) {
            context.namespace = context.namespaceStack.pop();
        }
        return element;
    }

    function renderFragment(context, script) {
        var fragment = document.createDocumentFragment();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = script[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var childScript = _step.value;

                fragment.appendChild(renderScript(context, childScript));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return fragment;
    }

    function renderProperty(context, script) {
        var text = document.createTextNode('');
        context.bindings.push(bind(script, function (value) {
            text.data = value + '';
        }));
        return text;
    }

    // copied from knockout.
    var statusNotInOld = 'added';
    var statusNotInNew = 'deleted';
    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, options) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = typeof options === 'boolean' ? { 'dontLimitMoves': options } : options || {};
        oldArray = oldArray || [];
        newArray = newArray || [];
        if (oldArray.length <= newArray.length) return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);else return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
    }
    // Go through the items that have been added and deleted and try to find matches between them.
    var findMovesInArrayComparison = function findMovesInArrayComparison(left, right, limitFailedCompares) {
        if (left.length && right.length) {
            var failedCompares, l, r, leftItem, rightItem;
            for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
                for (r = 0; rightItem = right[r]; ++r) {
                    if (leftItem['value'] === rightItem['value']) {
                        leftItem['moved'] = rightItem['index'];
                        rightItem['moved'] = leftItem['index'];
                        right.splice(r, 1); // This item is marked as moved; so remove it from right list
                        failedCompares = r = 0; // Reset failed compares count because we're checking for consecutive failures
                        break;
                    }
                }
                failedCompares += r;
            }
        }
    };
    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex,
            smlIndexMax = smlArray.length,
            bigIndex,
            bigIndexMax = bigArray.length,
            compareRange = bigIndexMax - smlIndexMax || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow,
            lastRow,
            bigIndexMaxForRow,
            bigIndexMinForRow;
        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex) thisRow[bigIndex] = smlIndex + 1;else if (!smlIndex) thisRow[bigIndex] = bigIndex + 1;else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1]) thisRow[bigIndex] = lastRow[bigIndex - 1]; // copy value (no edit)
                else {
                        var northDistance = lastRow[bigIndex] || maxDistance; // not in big (deletion)
                        var westDistance = thisRow[bigIndex - 1] || maxDistance; // not in small (addition)
                        thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                    }
            }
        }
        var editScript = [],
            meMinusOne,
            notInSml = [],
            notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex - 1]) {
                notInSml.push(editScript[editScript.length] = {
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex
                });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex
                });
            } else {
                --bigIndex;
                --smlIndex;
                if (!options['sparse']) {
                    editScript.push({
                        'status': "retained",
                        'value': bigArray[bigIndex]
                    });
                }
            }
        }
        // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
        // smlIndexMax keeps the time complexity of this algorithm linear.
        findMovesInArrayComparison(notInSml, notInBig, smlIndexMax * 10);
        return editScript.reverse();
    }

    function insertAfter(newNode, prevNode) {
        if (prevNode.nextSibling !== newNode) {
            prevNode.parentNode.insertBefore(newNode, prevNode.nextSibling);
        }
    }

    function iterateFromTil(node, til, callback) {
        var end = til.nextSibling;
        while (node !== end) {
            var next = node.nextSibling;
            callback(node);
            node = next;
        }
    }

    // todo: remove usage of array diff algorithm. use key func instead.
    function renderDynamicList(context, script) {
        var fragment = document.createDocumentFragment();
        var startMarker = document.createComment('');
        var endMarker = document.createComment('');
        var namespace = context.namespace;
        fragment.appendChild(startMarker);
        fragment.appendChild(endMarker);
        var lastArray = [];
        var lastMappings = [];
        context.bindings.push(bind(script.property, function (array) {
            var editScript = compareArrays(lastArray, array);
            var mappings = [];
            var lastIndex = 0;
            var trash = [];
            var allocQueue = [];
            var placeQueue = script.unordered ? [] : mappings;
            for (var i = 0; i < editScript.length; i++) {
                var record = editScript[i];
                if (record.status === 'added') {
                    if (record.moved === undefined) {
                        mappings.push(null);
                        allocQueue.push(record);
                    } else {
                        var lastMapping = lastMappings[record.moved];
                        lastMapping._indexField.set(record.index);
                        lastMapping._valueField.set(record.value);
                        lastMapping._lengthField.set(array.length);
                        mappings.push(lastMapping);
                    }
                } else if (record.status === 'retained') {
                    var index = mappings.length;
                    var lastMapping = lastMappings[lastIndex];
                    lastMapping._indexField.set(index);
                    lastMapping._valueField.set(record.value);
                    lastMapping._lengthField.set(array.length);
                    mappings.push(lastMapping);
                    lastIndex++;
                } else if (record.status === 'deleted') {
                    var lastMapping = lastMappings[record.index];
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
            function recycle(keys) {
                for (var i = 0; i < keys.length; i++) {
                    for (var j = 0; j < trash.length; j++) {
                        if (keys[i] === trash[j]._keys[i]) {
                            var mapping = trash[j];
                            trash.splice(j, 1);
                            return mapping;
                        }
                    }
                }
                return null;
            }
            var setupQueue = [];
            for (var i = 0; i < allocQueue.length; i++) {
                var record = allocQueue[i];
                var mapping = null;
                if (script.keyFunc !== undefined) {
                    var keys = script.keyFunc(record.value);
                    mapping = recycle(keys);
                    if (mapping !== null) {
                        mapping._indexField.set(record.index);
                        mapping._valueField.set(record.value);
                        mapping._lengthField.set(array.length);
                    }
                }
                if (mapping === null) {
                    var indexField = stored(record.index);
                    var valueField = stored(record.value);
                    var lengthField = stored(array.length);
                    var mappedScript = script.mapFunc(valueField, indexField, lengthField);
                    var _context = render(mappedScript, namespace);
                    mapping = {
                        _context: _context,
                        _indexField: indexField,
                        _valueField: valueField,
                        _lengthField: lengthField
                    };
                    if (script.unordered) {
                        placeQueue.push(mapping);
                    }
                    setupQueue.push(_context);
                }
                mappings[record.index] = mapping;
            }
            var prevNode = startMarker;
            for (var i = 0; i < placeQueue.length; i++) {
                var mapping = placeQueue[i];
                var _context2 = mapping._context;
                iterateFromTil(_context2.firstNode, _context2.lastNode, function (node) {
                    insertAfter(node, prevNode);
                    prevNode = node;
                });
            }
            for (var i = 0; i < setupQueue.length; i++) {
                setupQueue[i].setup();
            }
            for (var i = 0; i < trash.length; i++) {
                trash[i].destroy();
            }
            lastArray = array.slice(0);
            lastMappings = mappings;
        }));
        return fragment;
    }

    var EMPTY_NODE = document.createDocumentFragment();
    var Context = (function () {
        function Context(namespace) {
            babelHelpers.classCallCheck(this, Context);

            this.node = EMPTY_NODE;
            this.firstNode = null;
            this.lastNode = null;
            this.bindings = [];
            this.namespaceStack = [];
            this.namespace = null;
            this.namespace = namespace;
        }

        Context.prototype.setNode = function setNode(node) {
            this.node = node;
            this.firstNode = node.nodeType === 11 ? node.firstChild : node;
            this.lastNode = node.nodeType === 11 ? node.lastChild : node;
        };

        Context.prototype.setup = function setup() {
            this.bindings.forEach(function (binding) {
                return binding.setup();
            });
        };

        Context.prototype.cleanup = function cleanup() {
            this.bindings.forEach(function (binding) {
                return binding.cleanup();
            });
        };

        Context.prototype.remove = function remove() {
            if (this.firstNode !== null && this.node.nodeType !== 11) {
                var range = document.createRange();
                range.setStartBefore(this.firstNode);
                range.setEndAfter(this.lastNode);
                var fragment = range.extractContents();
                this.setNode(fragment);
            }
        };

        Context.prototype.destroy = function destroy() {
            this.cleanup();
            this.remove();
        };

        return Context;
    })();
    var updateQueue$1 = new Set();
    var updateCallbacks = [];
    function redraw() {
        updateQueue$1.forEach(function (binding) {
            binding.update();
        });
        updateQueue$1.clear();
        var callbacks = updateCallbacks;
        updateCallbacks = [];
        callbacks.forEach(function (callback) {
            return callback();
        });
    }
    function schedule$1(binding) {
        if (updateQueue$1.size <= 0) {
            window.requestAnimationFrame(redraw);
        }
        updateQueue$1.add(binding);
    }
    var UpdaterBinding = (function () {
        function UpdaterBinding(property, updater) {
            babelHelpers.classCallCheck(this, UpdaterBinding);

            this.property = property;
            this.updater = updater;
        }

        UpdaterBinding.prototype.onNotify = function onNotify() {
            schedule$1(this);
        };

        UpdaterBinding.prototype.update = function update() {
            var value = this.property.value();
            if (this.property.version !== this.version) {
                this.version = this.property.version;
                this.updater(value);
            }
        };

        UpdaterBinding.prototype.setup = function setup() {
            this.property.addObserver(this);
            var value = this.property.value();
            this.version = this.property.version;
            this.updater(value);
        };

        UpdaterBinding.prototype.cleanup = function cleanup() {
            this.property.removeObserver(this);
        };

        return UpdaterBinding;
    })();
    function bind(property, updater) {
        return new UpdaterBinding(property, updater);
    }
    function renderScript(context, script) {
        if (script == null) {
            return EMPTY_NODE;
        }
        var type = typeof script === 'undefined' ? 'undefined' : babelHelpers.typeof(script);
        if (type === 'number' || type === 'string') {
            return renderText(context, script + '');
        }
        if (script instanceof ElementScript) {
            return renderElement(context, script);
        }
        if (script instanceof DynamicListScript) {
            return renderDynamicList(context, script);
        }
        if (script instanceof Property) {
            return renderProperty(context, script);
        }
        if (Array.isArray(script)) {
            return renderFragment(context, script);
        }
        throw new Error('Unknown script');
    }
    function render(script) {
        var namespace = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        var context = new Context(namespace);
        context.setNode(renderScript(context, script));
        return context;
    }

    var React = React$1;
    var graph = {
        "nodes": [{ "x": 469, "y": 410 }, { "x": 493, "y": 364 }, { "x": 442, "y": 365 }, { "x": 467, "y": 314 }, { "x": 477, "y": 248 }, { "x": 425, "y": 207 }, { "x": 402, "y": 155 }, { "x": 369, "y": 196 }, { "x": 350, "y": 148 }, { "x": 539, "y": 222 }, { "x": 594, "y": 235 }, { "x": 582, "y": 185 }, { "x": 633, "y": 200 }],
        "links": [{ "source": 0, "target": 1 }, { "source": 1, "target": 2 }, { "source": 2, "target": 0 }, { "source": 1, "target": 3 }, { "source": 3, "target": 2 }, { "source": 3, "target": 4 }, { "source": 4, "target": 5 }, { "source": 5, "target": 6 }, { "source": 5, "target": 7 }, { "source": 6, "target": 7 }, { "source": 6, "target": 8 }, { "source": 7, "target": 8 }, { "source": 9, "target": 4 }, { "source": 9, "target": 11 }, { "source": 9, "target": 10 }, { "source": 10, "target": 11 }, { "source": 11, "target": 12 }, { "source": 12, "target": 10 }]
    };
    var width = 960;
    var height = 500;
    var force = d3.layout.force().size([width, height]).charge(-400).linkDistance(40).nodes(graph.nodes).links(graph.links).on("tick", tick);
    var nodes = stored([]);
    var links = stored([]);
    function tick() {
        nodes.set(force.nodes());
        links.set(force.links());
    }
    var drag = force.drag();
    drag.on('dragstart', function (data) {
        data.fixed = true;
    });
    var ctx = render(React.createElement("svg", { width: width, height: height }, dynamicList(links, function (link) {
        return React.createElement("line", { class: "link", x1: computed(function () {
                return link().source.x;
            }), y1: computed(function () {
                return link().source.y;
            }), x2: computed(function () {
                return link().target.x;
            }), y2: computed(function () {
                return link().target.y;
            }) });
    }), dynamicList(nodes, function (node) {
        return React.createElement("circle", { class: "node", r: 12, cx: computed(function () {
                return node().x;
            }), cy: computed(function () {
                return node().y;
            }), ondblclick: function ondblclick() {
                node().fixed = false;
            }, "$bindings": function $bindings(element) {
                return [{
                    setup: function setup() {
                        d3.select(element).datum(node()).call(drag);
                    }
                }];
            } });
    })));
    document.body.appendChild(ctx.node);
    ctx.setup();
    force.start();

})();
//# sourceMappingURL=main.js.map