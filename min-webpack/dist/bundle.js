(function (graph) {
  // 浏览器中没有 require 和 exports
  // 因此，我们需要自己实现，才能保证代码中的这两个方法不会报错
  function require(module) {
    // 使用闭包，防止模块中 require 的路径错误
    function absRequire(relativePath) {
      return require(graph[module].deps[relativePath]);
    }

    // 收集模块的导出
    var exports = {};

    (function (require, exports, code) {
      eval(code);
    })(absRequire, exports, graph[module].code);

    // 导出
    return exports;
  }

  require('./src/index.js');
})({
  './src/index.js': {
    deps: {
      './module1.js': './src\\module1.js',
      './module2.js': './src\\module2.js',
    },
    code: '"use strict";\n\nvar _module = _interopRequireDefault(require("./module1.js"));\nvar _module2 = _interopRequireDefault(require("./module2.js"));\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\nvar all = [_module["default"], _module2["default"]];\nconsole.log(\'🚀 ~ all:\', all);',
  },
  './src\\module1.js': {
    deps: { './module1-1.js': './src\\module1-1.js' },
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports["default"] = void 0;\nvar _module = _interopRequireDefault(require("./module1-1.js"));\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\nvar module_name = \'module1\';\nconsole.log(\'🚀 ~ module_name:\', module_name);\nvar _default = exports["default"] = {\n  module_name: module_name,\n  child: [_module["default"]]\n};',
  },
  './src\\module1-1.js': {
    deps: {},
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports["default"] = void 0;\nvar module_name = \'module1-1\';\nconsole.log(\'🚀 ~ module_name:\', module_name);\nvar _default = exports["default"] = {\n  module_name: module_name\n};',
  },
  './src\\module2.js': {
    deps: {},
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports["default"] = void 0;\nvar module_name = \'module2\';\nconsole.log(\'🚀 ~ module_name:\', module_name);\nvar _default = exports["default"] = {\n  module_name: module_name\n};',
  },
});
