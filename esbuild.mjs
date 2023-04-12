import {build} from 'esbuild';
import inlineWorkerPlugin from 'esbuild-plugin-inline-worker';

await build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/index.js',
    treeShaking: true,
    target: 'es2017',
    conditions: ['module'],
    format: 'esm',
    plugins: [inlineWorkerPlugin()],
});
