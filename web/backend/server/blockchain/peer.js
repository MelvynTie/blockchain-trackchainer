'use strict';

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import config from './config';
import { wrapError } from './utils';
import { ledgeritClient as client, isReady } from './setup';

// Show all the laptops data
export async function showLaptops() {
  if (!isReady()) {
    return;
  }
  try {
    const data = await query('show_laptops');
    return data;
  } catch (e) {
    throw wrapError(`Error getting data: ${e.message}`, e);
  }
}

// Get the specific laptop data
export async function searchLaptop(id) {
  if (!isReady()) {
    return;
  }
  try {
    const data = await query('search_laptop',{id});
    return data;
  } catch (e) {
    throw wrapError(`Error getting data: ${e.message}`, e);
  }
}
// Create new laptop
export async function createLaptop(id, sn, employer) {
  if (!isReady()) {
    return;
  }
  try {
    const result = await invoke('create_laptop',{id, sn, employer});
    return true;
  } catch (e) {
    throw wrapError(`Error creating new laptop: ${e.message}`, e);
  }
}
// Edit the laptop
export async function editLaptop(id, sn, employer) {
  if (!isReady()) {
    return;
  }
  try {
    const result = await invoke('edit_laptop',{id, sn, employer});
    return result;
  } catch (e) {
    throw wrapError(`Error editing laptops: ${e.message}`, e);
  }
}
// Remove laptop
export async function removeLaptop(id) {
  if (!isReady()) {
    return;
  }
  try {
    const result = await invoke('remove_laptop', {id});
    return result;
  } catch (e) {
    throw wrapError(`Error removing laptop: ${e.message}`, e);
  }
}
// Get the history of the blockchain
export async function getLaptopHistory(id) {
  if (!isReady()) {
    return;
  }
  try {
    const data = await query('get_laptop_history',{id});
    return data;
  } catch (e) {
    throw wrapError(`Error getting history: ${e.message}`, e);
  }
}
// Get the last block of the blockchain network
export function getBlocks(noOfLastBlocks) {
  return client.getBlocks(noOfLastBlocks);
}
// Bind the listener to the client so that this allow the function being callback
export const on = client.on.bind(client);
export const once = client.once.bind(client);
export const addListener = client.addListener.bind(client);
export const prependListener = client.prependListener.bind(client);
export const removeListener = client.removeListener.bind(client);

/**************************************************************************/
// invoke chaincode
function invoke(fcn, ...args) {
  return client.invoke(
    config.chaincodeId, config.chaincodeVersion, fcn, ...args);
}
// query chaincode
function query(fcn, ...args) {
  return client.query(
    config.chaincodeId, config.chaincodeVersion, fcn, ...args);
}
