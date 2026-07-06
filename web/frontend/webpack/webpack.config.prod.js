import webpack from 'webpack';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';

const GLOBALS = {
  'process.env.NODE_ENV': JSON.stringify('production')
};

export default {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    'common': [
      'core-js/stable',
      'isomorphic-fetch',
      resolve(__dirname, '../client/common')
    ]
  },
  target: 'web',
  output: {
    path: resolve(__dirname, '../client/static/js'), // Note: Physical files are only output by the production build task `npm run build`.
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin(GLOBALS)
  ],
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: ['babel-loader'] },
      {
        test: /\.css$/, use: ['style-loader', 'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer({ overrideBrowserslist: ['last 5 versions', 'ie 10'] })
                ]
              }
            }
          }
        ]
      }
    ]
  }
};
