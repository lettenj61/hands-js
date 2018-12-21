import prettier from 'rollup-plugin-prettier'
import typescript from 'rollup-plugin-typescript'
import { uglify } from 'rollup-plugin-uglify'

const tsc = typescript({ target: 'es5', declaration: true })
const prettify = prettier({ singleQuote: true })

const bundle = (minify = false) => {
  return {
    input: 'src/index.ts',
    output: {
      file: `dist/hands${ minify ? '.min' : '' }.js`,
      format: 'umd',
      name: 'handsjs'
    },
    plugins: [tsc].concat(
      minify ? [uglify()] : [prettify]
    )
  }
}

export default [
  bundle(),
  bundle(true),
  {
    input: 'src/polyfill.ts',
    output: {
      file: 'dist/hands-polyfill.js',
      format: 'iife',
      name: 'handsjs'
    },
    plugins: [tsc, prettify]
  }
]