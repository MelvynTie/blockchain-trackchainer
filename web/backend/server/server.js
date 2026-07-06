#! /usr/bin/env node

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

'use strict';

import 'core-js/stable/index.js';
import dotenv from 'dotenv';
import server from './app.js';
// Check if the NODE_ENV variable is production or development
if (process.env.NODE_ENV === 'production') {
  // Production specific logic if needed
}
// Determine the port number
const port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
// Config the dotenv to silent
dotenv.config({ silent: true });
// Listen to the PORT
server.listen(port, () => {
  console.log('Server running on port: %d', port);
});
