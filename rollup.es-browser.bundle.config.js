import vuePlugin from 'rollup-plugin-vue'
import {terser} from "rollup-plugin-terser"
import generatePackageJson from 'rollup-plugin-generate-package-json'
import copy from 'rollup-plugin-copy'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from 'rollup-plugin-replace'

export default {
    input: 'builds/es-browser.bundle.js',
    output: {
        file: 'dist/es-browser.bundle.js',
        format: 'umd',
        name: 'dragonfly',
        exports: 'named'
    },
    plugins: [
        resolve(),
        commonjs(),
        vuePlugin({
            target: "browser",
        }),
        terser(),
        generatePackageJson({
            baseContents(pkg) {
                return {
                    ...pkg,
                    main: 'index.js',
                    module: 'index.js',
                    dependencies: {},
                    devDependencies: {},
                    scripts: {},
                    bundleDependencies: []
                }
            }
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('development'),
            'process.env.VUE_ENV': JSON.stringify('browser'),
            '__VUE_OPTIONS_API__': 'true',
            '__VUE_PROD_DEVTOOLS__': 'true',
        }),
        copy({
            targets: [
                {src: 'src/**/*.less', dest: 'dist/'},
                {src: 'LICENSE', dest: 'dist/'},
                {src: 'README.md', dest: 'dist/'},
            ]
        }),
    ]

}
