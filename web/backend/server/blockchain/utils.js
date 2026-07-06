'use strict';

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import { resolve } from 'path';
import EventEmitter from 'events';
import { Gateway, Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import fs from 'fs';
import { snakeToCamelCase, camelToSnakeCase } from 'json-style-converter';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fabricProtos from 'fabric-protos';
import fabricCommon from 'fabric-common';

const { common } = fabricProtos;
const { BlockDecoder } = fabricCommon;

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.GOPATH = resolve(__dirname, '../../chaincode');

export class OrganizationClient extends EventEmitter {
  constructor(channelName, ordererConfig, peerConfig, caConfig, admin) {
    super();
    this._channelName = channelName;
    this._ordererConfig = ordererConfig;
    this._peerConfig = peerConfig;
    this._caConfig = caConfig;
    this._admin = admin;
    this.gateway = new Gateway();
    this.network = null;
    this.contract = null;
    this.wallet = null;
  }

  async login() {
    try {
      this.wallet = await Wallets.newFileSystemWallet(`./${this._peerConfig.hostname}_wallet`);
      
      const adminIdentity = await this.wallet.get('admin');
      if (!adminIdentity) {
        const ca = new FabricCAServices(this._caConfig.url, { trustedRoots: [], verify: false }, this._caConfig.caName);
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: this._caConfig.mspId,
            type: 'X.509',
        };
        await this.wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user and imported it into the wallet');
      }

      const connectionProfile = {
        name: 'ledgerit-network',
        version: '1.0.0',
        client: {
          organization: this._caConfig.mspId,
          connection: { timeout: { peer: { endorser: '300' } } }
        },
        organizations: {
          [this._caConfig.mspId]: {
            mspid: this._caConfig.mspId,
            peers: [this._peerConfig.hostname],
            certificateAuthorities: [this._caConfig.hostname]
          }
        },
        peers: {
          [this._peerConfig.hostname]: {
            url: this._peerConfig.url,
            tlsCACerts: { pem: this._peerConfig.pem },
            grpcOptions: {
              'ssl-target-name-override': this._peerConfig.hostname,
              'grpc.keepalive_time_ms': 600000
            }
          }
        },
          certificateAuthorities: {
            [this._caConfig.hostname]: {
              url: this._caConfig.url,
              caName: '',
              tlsCACerts: this._caConfig.pem ? { pem: this._caConfig.pem } : {},
              httpOptions: { verify: false }
            }
          }
      };

      await this.gateway.connect(connectionProfile, {
        wallet: this.wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: false }
      });
      
      this.network = await this.gateway.getNetwork(this._channelName);
      this.contract = this.network.getContract('ledgerit');
      
      // Setup event listener
      try {
        await this.network.addBlockListener(async (event) => {
            this.emit('block', unmarshalBlock(event));
        });
      } catch (listenerErr) {
        console.warn('Block listener setup failed (non-fatal):', listenerErr.message);
      }
      
    } catch (e) {
      console.error(`Failed to login/connect. Error: ${e.message}`);
      throw e;
    }
  }

  async invoke(chaincodeId, chaincodeVersion, fcn, ...args) {
    try {
      const parsedArgs = marshalArgs(args);
      const result = await this.contract.submitTransaction(fcn, ...parsedArgs);
      if (result && result.length > 0) {
          return unmarshalResult([result]);
      }
      return null;
    } catch (error) {
      console.error(`Failed to submit transaction: ${error}`);
      throw error;
    }
  }

  async query(chaincodeId, chaincodeVersion, fcn, ...args) {
    try {
      const parsedArgs = marshalArgs(args);
      const result = await this.contract.evaluateTransaction(fcn, ...parsedArgs);
      if (result && result.length > 0) {
        return unmarshalResult([result]);
      }
      return null;
    } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      throw error;
    }
  }

  async getBlocks(noOfLastBlocks) {
    try {
        const qscc = this.network.getContract('qscc');
        const infoBytes = await qscc.evaluateTransaction('GetChainInfo', this._channelName);
        const info = common.BlockchainInfo.decode(infoBytes);
        const height = Number(info.height);

        let blocks = [];
        let limit = parseInt(noOfLastBlocks, 10);
        if (isNaN(limit) || limit <= 0) limit = 10;

        const startBlock = Math.max(0, height - limit);
        for (let i = height - 1; i >= startBlock; i--) {
            const blockBytes = await qscc.evaluateTransaction('GetBlockByNumber', this._channelName, String(i));
            const decodedBlock = BlockDecoder.decodeBlock(blockBytes);
            const blockEvent = {
                blockNumber: decodedBlock.header.number,
                blockData: decodedBlock
            };
            blocks.push(unmarshalBlock(blockEvent));
        }
        return blocks;
    } catch(e) {
        console.error('Error fetching blocks:', e);
        return [];
    }
  }
}

export function wrapError(message, innerError) {
  let error = new Error(message);
  error.inner = innerError;
  console.log(error.message);
  throw error;
}

function marshalArgs(args) {
  if (!args) {
    return [];
  }
  let snakeArgs = camelToSnakeCase(args);
  if (Array.isArray(args)) {
    return snakeArgs.map(
      arg => typeof arg === 'object' ? JSON.stringify(arg) : arg.toString());
  }
  if (typeof args === 'object') {
    return [JSON.stringify(snakeArgs)];
  }
  return [args.toString()];
}

function unmarshalResult(result) {
  if (!Array.isArray(result)) {
    return result;
  }
  let buff = Buffer.concat(result);
  if (!Buffer.isBuffer(buff)) {
    return result;
  }
  let json = buff.toString('utf8');
  if (!json) {
    return null;
  }
  try {
      let obj = JSON.parse(json);
      return snakeToCamelCase(obj);
  } catch(e) {
      return json;
  }
}

function unmarshalBlock(blockEvent) {
  // Translate the Fabric v2 BlockEvent to the format expected by the frontend
  const transactions = [];
  try {
      if (blockEvent.blockData && blockEvent.blockData.data && Array.isArray(blockEvent.blockData.data.data)) {
          for (const data of blockEvent.blockData.data.data) {
              if (data && data.payload && data.payload.header && data.payload.header.channel_header) {
                  transactions.push({
                      type: data.payload.header.channel_header.type,
                      timestamp: data.payload.header.channel_header.timestamp
                  });
              }
          }
      } else if (typeof blockEvent.getTransactionEvents === 'function') {
          const txEvents = blockEvent.getTransactionEvents();
          for (const tx of txEvents) {
              transactions.push({
                  type: 'ENDORSER_TRANSACTION',
                  timestamp: { seconds: 0 } // fallback
              });
          }
      }
  } catch (e) {
      console.warn('Failed to parse transactions in blockEvent', e);
  }
  
  let fingerprint = 'unknown';
  if (blockEvent.blockData && blockEvent.blockData.header && blockEvent.blockData.header.data_hash) {
      if (Buffer.isBuffer(blockEvent.blockData.header.data_hash)) {
          fingerprint = blockEvent.blockData.header.data_hash.slice(0, 20).toString('hex');
      } else {
          fingerprint = blockEvent.blockData.header.data_hash.toString().slice(0, 40);
      }
  }

  return {
    id: blockEvent.blockNumber ? blockEvent.blockNumber.toString() : '0',
    fingerprint,
    transactions
  };
}
