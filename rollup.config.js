import path from 'path';
import transpile from 'rollup-plugin-buble';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import { string } from 'rollup-plugin-string';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript';
import dts from 'rollup-plugin-dts';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import fs from 'fs';
import pkg from './package.json';

/**
 * Get a list of the non-private sorted packages with Lerna v3
 * @see https://github.com/lerna/lerna/issues/1848
 * @return {Promise<Package[]>} List of packages
 */
async function main()
{
    const plugins = [
        sourcemaps(),
        json(),
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs({}),
        typescript(),
        string({
            include: [
                '**/*.glsl',
            ],
        }),
        replace({
            __VERSION__: pkg.version,
        }),
        transpile(),
    ];

    const compiled = (new Date()).toUTCString().replace(/GMT/g, 'UTC');
    const sourcemap = true;
    const results = [];

    const namespaces = {};
    namespaces[pkg.name] = pkg.namespace || 'feng3d';
    for (const key in pkg.dependencies)
    {
        namespaces[key] = 'feng3d';
    }

    let banner = [
        `/*!`,
        ` * ${pkg.name} - v${pkg.version}`,
        ` * Compiled ${compiled}`,
        ` *`,
        ` * ${pkg.name} is licensed under the MIT License.`,
        ` * http://www.opensource.org/licenses/mit-license`,
        ` */`,
    ].join('\n');

    // Check for bundle folder
    const external = Object.keys(pkg.dependencies || []);
    const basePath = path.relative(__dirname, '');
    const input = path.join(basePath, 'src/index.ts');

    const {
        main,
        module,
        bundle,
        bundleInput,
        bundleOutput,
        bundleNoExports,
        standalone,
        types,
    } = pkg;
    const freeze = false;

    results.push({
        input,
        output: [
            {
                banner,
                file: path.join(basePath, main),
                format: 'cjs',
                freeze,
                sourcemap,
            },
            {
                banner,
                file: path.join(basePath, module),
                format: 'esm',
                freeze,
                sourcemap,
            },
        ],
        external,
        plugins,
    });

    results.push({
        input,
        external: standalone ? [] : external,
        output: [{
            file: path.join(basePath, types),
            name: namespaces[pkg.name],
            format: 'es',
            footer: `export as namespace ${namespaces[pkg.name]};`
        }],
        plugins: [
            json(),
            typescript({ tsconfig: './tsconfig.json' }),
            dts({ respectExternal: true }),
        ],
    });

    // The package.json file has a bundle field
    // we'll use this to generate the bundle file
    // this will package all dependencies
    if (bundle)
    {
        let input = path.join(basePath, bundleInput || 'src/index.ts');

        // TODO: remove check once all packages have been converted to typescript
        if (!fs.existsSync(input))
        {
            input = path.join(basePath, bundleInput || 'src/index.js');
        }

        const file = path.join(basePath, bundle);
        const external = standalone ? null : Object.keys(namespaces);
        const globals = standalone ? null : namespaces;
        const ns = namespaces[pkg.name];
        const name = pkg.name.replace(/[^a-z0-9]+/g, '_');
        let footer;

        if (!standalone)
        {
            if (bundleNoExports !== true)
            {
                footer = `Object.assign(this.${ns}, ${name});`;
            }

            if (ns.includes('.'))
            {
                const base = ns.split('.')[0];

                banner += `\nthis.${base} = this.${base} || {};`;
            }

            banner += `\nthis.${ns} = this.${ns} || {};`;
        }

        results.push({
            input,
            external,
            output: Object.assign({
                banner,
                file,
                format: 'iife',
                freeze,
                globals,
                name,
                footer,
                sourcemap,
            }, bundleOutput),
            treeshake: false,
            plugins,
        });

        if (process.env.NODE_ENV === 'production')
        {
            results.push({
                input,
                external,
                output: Object.assign({
                    banner,
                    file: file.replace(/\.js$/, '.min.js'),
                    format: 'iife',
                    freeze,
                    globals,
                    name,
                    footer,
                    sourcemap,
                }, bundleOutput),
                treeshake: false,
                plugins: [...plugins, terser({
                    output: {
                        comments: (node, comment) => comment.line === 1,
                    },
                })],
            });
        }
    }

    return results;
}

export default main();
