import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

const config = [
  {
    input: 'src/index.tsx',
    output: [
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
      { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript(),
      postcss({
        extract: true,
        minimize: true,
        modules: false,
      }),
      copy({
        targets: [{ src: 'src/onlinepay.css', dest: 'dist' }],
      }),
    ],
    external: ['react', 'react-dom', 'module', 'openpgp'],
  },
  {
    input: 'src/index.tsx',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];

export default config;
