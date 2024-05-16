import { types as t, template, transformFromAstSync } from '@babel/core';

const buildRequire = template.program(`
  var %%importName%% = require(%%source%%);
`);

const requireAst = buildRequire({
  importName: t.identifier('myModule'),
  source: t.stringLiteral('my-module'),
});

const { code, ast } =
  transformFromAstSync(requireAst, '', {
    ast: true,
  }) ?? {};
