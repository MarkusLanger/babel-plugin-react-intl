'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

exports.default = function () {
    function getModuleSourceName(opts) {
        return opts.moduleSourceName || 'react-intl';
    }

    function evaluatePath(path) {
        var evaluated = path.evaluate();
        if (evaluated.confident) {
            return evaluated.value;
        }

        throw path.buildCodeFrameError('[React Intl] Messages must be statically evaluate-able for extraction.');
    }

    function getMessageDescriptorKey(path) {
        if (path.isIdentifier() || path.isJSXIdentifier()) {
            return path.node.name;
        }

        return evaluatePath(path);
    }

    function getMessageDescriptorValue(path) {
        if (path.isJSXExpressionContainer()) {
            path = path.get('expression');
        }

        // Always trim the Message Descriptor values.
        return evaluatePath(path).trim();
    }

    function getICUMessageValue(messagePath) {
        var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref$isJSXSource = _ref.isJSXSource;
        var isJSXSource = _ref$isJSXSource === undefined ? false : _ref$isJSXSource;

        var message = getMessageDescriptorValue(messagePath);

        try {
            return (0, _printIcuMessage2.default)(message);
        } catch (parseError) {
            if (isJSXSource && messagePath.isLiteral() && message.indexOf('\\\\') >= 0) {

                throw messagePath.buildCodeFrameError('[React Intl] Message failed to parse. ' + 'It looks like `\\`s were used for escaping, ' + 'this won\'t work with JSX string literals. ' + 'Wrap with `{}`. ' + 'See: http://facebook.github.io/react/docs/jsx-gotchas.html');
            }

            throw messagePath.buildCodeFrameError('[React Intl] Message failed to parse. ' + 'See: http://formatjs.io/guides/message-syntax/' + ('\n' + parseError));
        }
    }

    function createMessageDescriptor(propPaths) {
        return propPaths.reduce(function (hash, _ref2) {
            var _ref3 = (0, _slicedToArray3.default)(_ref2, 2);

            var keyPath = _ref3[0];
            var valuePath = _ref3[1];

            var key = getMessageDescriptorKey(keyPath);

            if (DESCRIPTOR_PROPS.has(key)) {
                hash[key] = valuePath;
            }

            return hash;
        }, {});
    }

    function evaluateMessageDescriptor(_ref4) {
        var descriptor = (0, _objectWithoutProperties3.default)(_ref4, []);

        var _ref5 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref5$isJSXSource = _ref5.isJSXSource;
        var isJSXSource = _ref5$isJSXSource === undefined ? false : _ref5$isJSXSource;

        (0, _keys2.default)(descriptor).forEach(function (key) {
            var valuePath = descriptor[key];

            if (key === 'defaultMessage') {
                descriptor[key] = getICUMessageValue(valuePath, { isJSXSource: isJSXSource });
            } else {
                descriptor[key] = getMessageDescriptorValue(valuePath);
            }
        });

        return descriptor;
    }

    function storeMessage(_ref6, path, state) {
        var id = _ref6.id;
        var description = _ref6.description;
        var defaultMessage = _ref6.defaultMessage;
        var opts = state.opts;
        var reactIntl = state.reactIntl;


        if (!(id && defaultMessage)) {
            throw path.buildCodeFrameError('[React Intl] Message Descriptors require an `id` and `defaultMessage`.');
        }

        if (reactIntl.messages.has(id)) {
            var existing = reactIntl.messages.get(id);

            if (description !== existing.description || defaultMessage !== existing.defaultMessage) {

                throw path.buildCodeFrameError('[React Intl] Duplicate message id: "' + id + '", ' + 'but the `description` and/or `defaultMessage` are different.');
            }
        }

        if (opts.enforceDescriptions && !description) {
            throw path.buildCodeFrameError('[React Intl] Message must have a `description`.');
        }

        reactIntl.messages.set(id, { id: id, description: description, defaultMessage: defaultMessage });
    }

    function referencesImport(path, mod, importedNames) {
        if (!(path.isIdentifier() || path.isJSXIdentifier())) {
            return false;
        }

        return importedNames.some(function (name) {
            return path.referencesImport(mod, name);
        });
    }

    return {
        visitor: {
            Program: {
                enter: function enter(path, state) {
                    state.reactIntl = {
                        messages: new _map2.default()
                    };
                },
                exit: function exit(path, state) {
                    var file = state.file;
                    var opts = state.opts;
                    var reactIntl = state.reactIntl;
                    var _file$opts = file.opts;
                    var basename = _file$opts.basename;
                    var filename = _file$opts.filename;


                    var descriptors = [].concat((0, _toConsumableArray3.default)(reactIntl.messages.values()));
                    file.metadata['react-intl'] = { messages: descriptors };

                    if (opts.messagesDir && descriptors.length > 0) {
                        // Make sure the relative path is "absolute" before
                        // joining it with the `messagesDir`.
                        var relativePath = p.join(p.sep, p.relative(process.cwd(), filename));

                        var messagesFilename = p.join(opts.messagesDir, p.dirname(relativePath), basename + '.json');

                        var messagesFile = (0, _stringify2.default)(descriptors, null, 2);

                        (0, _mkdirp.sync)(p.dirname(messagesFilename));
                        (0, _fs.writeFileSync)(messagesFilename, messagesFile);
                    }
                }
            },

            JSXOpeningElement: function JSXOpeningElement(path, state) {
                var file = state.file;
                var opts = state.opts;

                var moduleSourceName = getModuleSourceName(opts);

                var name = path.get('name');

                if (name.referencesImport(moduleSourceName, 'FormattedPlural')) {
                    file.log.warn('[React Intl] Line ' + path.node.loc.start.line + ': ' + 'Default messages are not extracted from ' + '<FormattedPlural>, use <FormattedMessage> instead.');

                    return;
                }

                if (referencesImport(name, moduleSourceName, COMPONENT_NAMES)) {
                    var attributes = path.get('attributes').filter(function (attr) {
                        return attr.isJSXAttribute();
                    });

                    var descriptor = createMessageDescriptor(attributes.map(function (attr) {
                        return [attr.get('name'), attr.get('value')];
                    }));

                    // In order for a default message to be extracted when
                    // declaring a JSX element, it must be done with standard
                    // `key=value` attributes. But it's completely valid to
                    // write `<FormattedMessage {...descriptor} />` or
                    // `<FormattedMessage id={dynamicId} />`, because it will be
                    // skipped here and extracted elsewhere. The descriptor will
                    // be extracted only if a `defaultMessage` prop exists.
                    if (descriptor.defaultMessage) {
                        // Evaluate the Message Descriptor values in a JSX
                        // context, then store it.
                        descriptor = evaluateMessageDescriptor(descriptor, {
                            isJSXSource: true
                        });
                        storeMessage(descriptor, path, state);
                    }
                }
            },
            CallExpression: function CallExpression(path, state) {
                var moduleSourceName = getModuleSourceName(state.opts);
                var callee = path.get('callee');

                function assertObjectExpression(node) {
                    if (!(node && node.isObjectExpression())) {
                        throw path.buildCodeFrameError('[React Intl] `' + callee.node.name + '()` must be ' + 'called with an object expression with values ' + 'that are React Intl Message Descriptors, also ' + 'defined as object expressions.');
                    }
                }

                function processMessageObject(messageObj) {
                    assertObjectExpression(messageObj);

                    var properties = messageObj.get('properties');

                    var descriptor = createMessageDescriptor(properties.map(function (prop) {
                        return [prop.get('key'), prop.get('value')];
                    }));

                    // Evaluate the Message Descriptor values, then store it.
                    descriptor = evaluateMessageDescriptor(descriptor);
                    storeMessage(descriptor, path, state);
                }

                var extract = false;
                if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
                    extract = true;
                }
                if (callee.node.name === 'defineMessages') {
                    var binding = callee.scope.getBinding(callee.node.name);
                    if (binding) {
                        var declaration = binding.path.node;

                        if (declaration.init.callee.name === 'require' && declaration.init.arguments[0].value === moduleSourceName && declaration.id && declaration.id.properties[0] && declaration.id.properties[0].value.name === 'defineMessages') {
                            extract = true;
                        }
                    }
                }

                if (extract) {
                    var messagesObj = path.get('arguments')[0];

                    assertObjectExpression(messagesObj);

                    messagesObj.get('properties').map(function (prop) {
                        return prop.get('value');
                    }).forEach(processMessageObject);
                }
            }
        }
    };
};

var _path = require('path');

var p = _interopRequireWildcard(_path);

var _fs = require('fs');

var _mkdirp = require('mkdirp');

var _printIcuMessage = require('./print-icu-message');

var _printIcuMessage2 = _interopRequireDefault(_printIcuMessage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 * Changed to support require and not only 'import'.
 */

var COMPONENT_NAMES = ['FormattedMessage', 'FormattedHTMLMessage'];

var FUNCTION_NAMES = ['defineMessages'];

var DESCRIPTOR_PROPS = new _set2.default(['id', 'description', 'defaultMessage']);