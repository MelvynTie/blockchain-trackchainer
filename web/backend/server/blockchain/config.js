////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Define the path of the certs
const basePath = resolve(__dirname, '../../certs');
// Read the Crypto File
const readCryptoFile = filename => readFileSync(resolve(basePath, filename)).toString();
// Define the config file
const config = {
  channelName: 'ledgerit',
  channelConfig: readFileSync(resolve(__dirname, '../../channel.tx')),
  chaincodeId: 'ledgerit',
  chaincodeVersion: 'v1',
  chaincodePath: 'ledgerit',
  orderer: {
    hostname: 'orderer',
    url: 'grpcs://localhost:7050',
    pem: readCryptoFile('orderer.pem')
  },
  org: {
    peer: {
      hostname: 'ledgerit-peer',
      url: 'grpcs://localhost:7051',
      eventHubUrl: 'grpcs://localhost:7053',
      pem: readCryptoFile('org.pem')
    },
    ca: {
      hostname: 'ledgerit-ca',
      url: 'https://localhost:7054',
      mspId: 'LedgerITOrgMSP',
      pem: readCryptoFile('org.pem')
    },
    admin: {
      key: readCryptoFile('Admin@ledgerit-org-key.pem'),
      cert: readCryptoFile('Admin@ledgerit-org-cert.pem')
    }
  }
};
// Define the local configuration for development process 
if (process.env.LOCALCONFIG) {
  config.orderer.url = 'grpcs://localhost:7050';

  config.org.peer.url = 'grpcs://localhost:7051';

  config.org.peer.eventHubUrl = 'grpcs://localhost:7053';

  config.org.ca.url = 'https://localhost:7054';
}
// Export the default config
export default config;
// Default Contract
export const DEFAULT_CONTRACT_TYPES = [{}];
