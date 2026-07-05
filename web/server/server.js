#! /usr/bin/env node

////////////////////////
// JABIL Co.
// Trackchainer
// Author : Melvyn Tie
////////////////////////

'use strict';

import 'core-js/stable';
import dotenv from 'dotenv';
import server from './app';
// Check if the NODE_ENV variable is production or development
if (process.env.NODE_ENV === 'production') {
  require('@babel/register');
}
// Determine the port number
const port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
// Config the dotenv to silent
dotenv.config({ silent: true });
// Listen to the PORT
server.listen(port, () => {
  console.log('Server running on port: %d', port);
});
