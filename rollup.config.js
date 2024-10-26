import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts', // Your entry point
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named' // Export individual functions/classes
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm' // For ES module imports
    }
  ],
  plugins: [
    typescript(),
    commonjs(),
    resolve()
  ]
};
