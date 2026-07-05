'use strict';
////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import morgan from 'morgan';
import compression from 'compression';
import i18nConfig from './i18n';

// Export the default function
export default function (app) {
  // Check if the variable is development
  const isDev = app.get('env') === 'development';
  // Configure Express by setting the view engine to pug
  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, '../views'));
  // Compress response bodies for all request that traverse
  // through the middleware
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  // Use cookie parser
  app.use(require('cookie-parser')());
  // Use body parser to ensure the return of middleware
  // is only parses urlencoded body and only look at requests where
  // the Content-Type header matches the type option
  // A new body object containing parsed data is populated on matches
  // request object after the middleware(ie. req.body). This object
  // key-value pairs, where the value can be a string or array.
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  // Returns middleware that only parses json.
  app.use(bodyParser.json());
  // Serve static files with lower priority
  app.use(express.static(path.resolve(__dirname, '../../client/static')));
  // Pass the boolean value of the webpack.config to the webpackConfig
  const webpackConfig = isDev ? require('../../webpack/webpack.config.dev').default : require('../../webpack/webpack.config.prod').default;
  // If it is development
  if (isDev) {
    // webpack is a module bundler.
    // Its main purpose is to bundle JavaScript files for usage in a browser,
    // yet it is also capable of transforming, bundling, or packaging just about any resource or asset.
    const webpack = require('webpack');
    const compiler = webpack(webpackConfig);
    // Configure logging
    // Create a new morgan logger middleware function using the given format and options.
    // The format argument may be a string of a predefined name, a string of a format string,
    // or a function that will produce a log entry.
    // Arguments tokens, req, and res, where tokens is an object with all defined tokens, req is the HTTP request and res is the HTTP response.
    // The function is expected to return a string that will be the log line, or undefined / null to skip logging.
    app.use(morgan('dev'));
    // Configure webpack
    // An express-style development middleware for use with webpack bundles
    // and allows for serving of the files emitted from webpack.
    app.use(require('webpack-dev-middleware')(compiler, {
      noInfo: false,
      publicPath: webpackConfig.output.publicPath
    }));
    // Allows to add hot reloading into an existing server without webpack-dev-server.
    app.use(require('webpack-hot-middleware')(compiler));
  } else {
    // Log the output.path in console
    console.log(webpackConfig.output.path);
    // Use static
    app.use(express.static(webpackConfig.output.path));
  }
  // Set up internationalization for the backend
  i18nConfig(app);
  // Set up security features if running in the cloud
  if (process.env.VCAP_APPLICATION) {
    require('./security').default(app);
  }
}
