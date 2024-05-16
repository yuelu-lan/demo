import { parse, traverse, transformFromAstSync } from '@babel/core';
import * as fs from 'node:fs';
import * as path from 'node:path';

type ModuleInfo = {
  /**
   * 模块相对路径
   */
  filePath: string;
  /**
   * 文件依赖的其他模块
   * 模块名称 -> 模块相对路径
   */
  deps: Record<string, string>;
  /**
   * babel 转化后的代码
   */
  code: string;
};

type DepsGraph = Record<
  /**
   * 模块相对路径
   */
  string,
  Omit<ModuleInfo, 'filePath'>
>;

/**
 * 解析文件模块
 * @param filePath 要解析的文件路径
 */
function getModuleInfo(filePath: string): ModuleInfo {
  const ast = parse(fs.readFileSync(filePath, 'utf-8'), {
    sourceType: 'module',
  })!;

  const dirname = path.dirname(filePath);
  const deps: ModuleInfo['deps'] = {};
  traverse(ast, {
    ImportDeclaration({ node }) {
      // 获取相对路径
      const absPath = './' + path.join(dirname, node.source.value);
      deps[node.source.value] = absPath;
    },
  });

  const { code } = transformFromAstSync(ast, undefined, {
    presets: ['@babel/preset-env'],
  })!;

  return {
    filePath,
    deps,
    code: code ?? '',
  };
}

// 1. 分析依赖
function parseModules(file: string): DepsGraph {
  const depsGraph: DepsGraph = {};

  const entry = getModuleInfo(file);
  const stack: ModuleInfo[] = [entry];

  while (stack.length) {
    const { filePath, deps, code } = stack.pop()!;
    depsGraph[filePath] = {
      deps,
      code,
    };

    const depsKey = Object.keys(deps);
    if (!depsKey.length) {
      continue;
    }
    // 从后往前遍历，应为 stack 是先近后出
    for (let i = depsKey.length - 1; i > -1; i--) {
      const moduleName = depsKey[i];
      stack.push(getModuleInfo(deps[moduleName]));
    }
  }

  return depsGraph;
}

// 2. 实现 bundle
function bundle(entryPath: string): string {
  const depsGraphStr = JSON.stringify(parseModules(entryPath));

  return `(function (graph) {
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

    require("${entryPath}");
  })(${depsGraphStr})`;
}

const content = bundle('./src/index.js');
fs.writeFileSync('./dist/bundle.js', content);
