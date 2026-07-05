'use strict';

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import config from './config';
import { OrganizationClient } from './utils';

// Set status
let status = 'down';
let statusChangedCallbacks = [];

// Setup clients per organization
const ledgeritClient = new OrganizationClient(
  config.channelName,
  config.orderer0,
  config.org.peer,
  config.org.ca,
  config.org.admin
);

// Set status
function setStatus(s) {
  status = s;
  setTimeout(() => {
    statusChangedCallbacks
      .filter(f => typeof f === 'function')
      .forEach(f => f(s));
  }, 1000);
}

// Subscribe status
export function subscribeStatus(cb) {
  if (typeof cb === 'function') {
    statusChangedCallbacks.push(cb);
  }
}

// Get status
export function getStatus() {
  return status;
}

// Check if the status is ready
export function isReady() {
  return status === 'ready';
}

(async () => {
  console.log('Connecting to blockchain network...');
  let connected = false;
  
  // Retry loop to wait for chaincode to be deployed by deploy.sh
  while (!connected) {
    try {
      await ledgeritClient.login();
      // Try a simple query to ensure chaincode is up and responsive
      await ledgeritClient.query('ledgerit', '1.0', 'show_laptops');
      connected = true;
      console.log('Successfully connected to the blockchain network and chaincode is ready.');
      setStatus('ready');
    } catch (e) {
      console.log('Network/Chaincode not fully ready yet, retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
})();

export {
  ledgeritClient
};
