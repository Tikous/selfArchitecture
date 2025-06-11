const merge = require('webpack-merge')
const { resolve } = require("path")
const argv = require('yargs-parser')(process.argv.slice(2))
// console.log(process.argv)
// console.log('argv', argv)
const _mode = argv.mode || 'development'
const _mergeConfig = require(`./config/webpack.${_mode}.js`)

const webpackBaseConfig = {
  entry: {
    main: resolve('src/index.tsx')
  },
  output: {
    path: resolve(process.cwd(), 'dist')
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader'
        }
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/i,
        type: 'asset/resource'
      },
    ]
  }
}
module.exports = merge.default(webpackBaseConfig, _mergeConfig)