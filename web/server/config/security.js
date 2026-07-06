'use strict';

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import expressRateLimit from 'express-rate-limit';
import helmet from 'helmet';

export default function(app) {
  // Enable trust proxy 
  app.enable('trust proxy');

  app.use(helmet());
  // Set the maximum number of the api request for each connection
  app.use(['/v1/api'],
  expressRateLimit({
    windowMs: 30 * 1000,
    max: 50
  }));
}
