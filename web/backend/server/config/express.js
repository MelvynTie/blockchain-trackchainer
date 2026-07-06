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
  
  app.use(morgan('dev'));

  // Set up internationalization for the backend
  i18nConfig(app);
  // Set up security features if running in the cloud
  if (process.env.VCAP_APPLICATION) {
    require('./security').default(app);
  }
}
