const merge = require('webpack-merge')
const { resolve } = require("path")
const argv = require('yargs-parser')(process.argv.slice(2))
// console.log(process.argv)
// console.log('argv', argv)
const _mode = argv.mode || 'development'
const _mergeConfig = require(`./config/webpack.${_mode}.js`)
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// 抽离css
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const _modeflag = _mode === 'production' ? true : false
const { ThemedProgressPlugin } = require('themed-progress-plugin')
// 添加 dotenv-webpack 插件
const Dotenv = require('dotenv-webpack')

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
        test: /\.(ts|tsx|jsx|js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader'
        }
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { importLoaders: 1 }},
          // 可编译tailwindcss
          'postcss-loader'
        ],
      }
    ]
  },
  resolve: {
    alias: {
      '@': resolve('src/'),
      '@components': resolve('src/components'),
      '@hooks': resolve('src/hooks'),
      '@pages': resolve('src/pages'),
      '@layouts': resolve('src/layouts'),
      '@assets': resolve('src/assets'),
      '@states': resolve('src/states'),
      '@service': resolve('src/service'),
      '@utils': resolve('src/utils'),
      '@lib': resolve('src/lib'),
      '@constants': resolve('src/constants'),
      '@connections': resolve('src/connections'),
      '@abis': resolve('src/abis'),
      '@types': resolve('src/types'),
    },
    extensions: ['.js', '.ts', '.tsx', '.jsx', '.css'],
    fallback: {
      // stream: require.resolve('stream-browserify'),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: _modeflag ? 'styles/[name].[contenthash:5].css' : 'style/[name].css',
      chunkFilename: _modeflag ? 'styles/[name].[contenthash:5].css' : 'style/[name].css',
      ignoreOrder: true
    }),
    new ThemedProgressPlugin(),
    // 添加 dotenv-webpack 插件配置
    new Dotenv({
      systemvars: true, // 加载所有系统环境变量
      path: resolve(process.cwd(), '.env') // 指定 .env 文件路径
    })
  ]
}
module.exports = merge.default(webpackBaseConfig, _mergeConfig)