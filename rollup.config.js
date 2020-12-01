import vuePlugin from 'rollup-plugin-vue'
import {terser} from "rollup-plugin-terser"
import generatePackageJson from 'rollup-plugin-generate-package-json'
import copy from 'rollup-plugin-copy'

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        name: 'dragonfly'
    },
    plugins: [
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
                    dependencies: Object.fromEntries(pkg.bundleDependencies.map(name => [name, pkg.dependencies[name]])),
                    devDependencies: {},
                    scripts: {},
                }
            }
        }),
        copy({
            targets: [
                {src: 'src/**/*.less', dest: 'dist/'},
                {src: 'LICENSE', dest: 'dist/'},
                {src: 'README.md', dest: 'dist/'},
            ]
        })

    ]

}
