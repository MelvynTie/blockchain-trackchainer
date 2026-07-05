'use strict';

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import expressRateLimit from 'express-rate-limit';
import csrf from 'csurf';
import helmet from 'helmet';

export default function(app) {
  // Enable trust proxy 
  app.enable('trust proxy');

  app.use(helmet({
    noCache: false,
    frameguard: false
  }));
  // Set the maximum number of the api request for each connection
  app.use(['/v1/api'],
  expressRateLimit({
    windowMs: 30 * 1000,
    delayMs: 0,
    max: 50
  }));
  // Allow the CSRF protection of the cookie
  const csrfProtection = csrf({
    cookie: true
  });

  app.get('/*', csrfProtection, (req, res, next) => {
    if (!res.locals) {
      res.locals = {};
    }
    res.locals.ct = req.csrfToken();
    next();
  });

}
