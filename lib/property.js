(function (exports) { 'use strict';

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
    function constant(value) {
        return new ConstantProperty(value);
    }

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

    function observe(property, callback) {
        var version = undefined;
        var observer = {
            onNotify: function onNotify(property) {
                var value = property.value();
                var isInitial = version === undefined;
                if (isInitial || property.version !== version) {
                    callback(value, isInitial);
                    version = property.version;
                }
            }
        };
        property.addObserver(observer);
        observer.onNotify(property);
        return function () {
            property.removeObserver(observer);
        };
    }

    exports.Property = Property;
    exports.constant = constant;
    exports.stored = stored;
    exports.computed = computed;
    exports.observe = observe;
    exports.commit = commit;

})((this.property = {}));
//# sourceMappingURL=property.js.map