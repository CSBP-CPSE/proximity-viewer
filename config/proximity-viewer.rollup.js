import babel from 'rollup-plugin-babel';

const banner = 
`/*
 * Proximity Viewer 
 * https://github.com/CSBP-CPSE/proximity-viewer/blob/master/LICENCE.md
 * v1.0 - 2021-02-04
 */`;

export default {
    input: '../proximity-viewer/src/main.js',
    output: {
        file: '../proximity-viewer/dist/main.min.js',
		format: 'iife',
		banner: banner
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
			configFile: './config/babel.config.cjs'
        })
    ]
}
