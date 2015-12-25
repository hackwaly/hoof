import ts from 'typescript';
import path from 'path';
import babel from 'rollup-plugin-babel';
import transform_es2015_classes from 'babel-plugin-transform-es2015-classes';
import transform_es2015_modules_commonjs from 'babel-plugin-transform-es2015-modules-commonjs';
import external_helpers_2 from 'babel-plugin-external-helpers-2';
import es2015 from 'babel-preset-es2015';

export default {
	plugins: [
		{
			resolveId(importee, importer) {
				if (!importer) {
					return importee;
				}
				let importerIsTs = /\.tsx?$/.test(importer);
				let importeeHasExt = /\.[^./\\]+$/.test(importee);
				if (importerIsTs && !importeeHasExt) {
					importee += '.ts';
				}
				return path.resolve(path.dirname(importer), importee);
			}
		},
		{
			transform(code, id) {
				let result = ts.transpileModule(code, {
					compilerOptions: {
						target: ts.ScriptTarget.ES2015,
						module: ts.ModuleKind.ES2015,
						jsx: ts.JsxEmit.React,
						sourceMap: true
					}
				});
				return {
					code: result.outputText,
					map: JSON.parse(result.sourceMapText)
				};
			}
		},
        babel({
            plugins: es2015.plugins.map((plugin) => {
                if (plugin === transform_es2015_classes) {
                    return [transform_es2015_classes, {loose: true}];
                } else if (plugin === transform_es2015_modules_commonjs) {
                    return external_helpers_2;
                }
                return plugin;
            })
        })
	]
};
