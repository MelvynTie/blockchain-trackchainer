import express from 'express';
import crypto from 'crypto';

import * as Peer from '../blockchain/peer.js';

const router = express.Router();

// Router render the home page of laptop
/*router.get('/v1/api/', (req, res) => {
  res.render('Index');
});*/

// Show all laptops
router.get('/v1/api/show', async (req, res) => {
  try {
    const laptops = await Peer.showLaptops();
    res.json(laptops || []);
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  } 
});
// Search the laptop
router.post('/v1/api/search', async (req, res) => {
  let { id } = req.body;
  if ( !(typeof id === 'string' )) {
    res.json({ error: 'Invalid request.'});
    return;
  }
  try {
    const laptop = await Peer.searchLaptop(id);
    res.json(laptop || []);
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  }
});
// Create new Laptop
router.post('/v1/api/create', async (req, res) => {
  let { id , sn , employer} = req.body;
  if ( typeof sn !== 'string' || typeof employer !== 'string' || typeof id !== 'string') {
    res.json({ error: 'Invalid request.'});
    return;
  }
  try {
    const laptop = await Peer.createLaptop(id, sn, employer);
    res.json( laptop || []);
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  }
});
// Edit the laptop
router.post('/v1/api/edit', async (req, res) => {
  let { id , sn , employer} = req.body;
  if ( typeof sn !== 'string' || typeof employer !== 'string' || typeof id !== 'string') {
    res.json({ error: 'Invalid request.'});
    return;
  }
  try {
    const laptop = await Peer.editLaptop(id, sn, employer);
    res.json( laptop || []);
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  }
});
// Remove the laptop
router.post('/v1/api/remove', async (req, res) => {
  let {sn} = req.body;
  if ( !(typeof sn === 'string' )) {
    res.json({ error: 'Invalid request.'});
    return;
  }
  try {
    const data = await Peer.showLaptops();
    var serialNo = sn;
    let removed = false;
    for(var i=0; i<data.length; i++){
      if(data[i].Record.sn == serialNo){
        const result = await Peer.removeLaptop(data[i].Key);
        if(result){
          res.json({ success: true, key: data[i].Key });
          removed = true;
          break;
        }
      }
    }
    if (!removed) {
      res.json({ error: 'Laptop with the specified serial number not found.' });
    }
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  }
});
// Show the history of block explorer
router.post('/v1/api/history/', async (req, res) => {
  let { id } = req.body;
  if ( typeof id !== 'string' ){
    res.json({ error: 'Invalid request.'});
    return;
  }
  try {
    const block = await Peer.getLaptopHistory(id);
    res.json( block || []);
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  }
});
// Search the specific laptop history
router.post('/v1/api/block/', async (req, res) => {
  const { noOfLastBlocks } = req.body;
  try {
    const block = await Peer.getBlocks(noOfLastBlocks);
    res.json( block );
  } catch (e) {
    res.json({ error: 'Error accessing blockchain.' });
  }
});

// Invoke the create_laptop chaincode
router.get('/create', async (req, res) => {
  try {
    res.render('CreatePage', {title:"Add Laptop"})
  } catch (e) {
    res.render('NotFoundPage', {title:"404"})
  }
});

// Submit the create request 
router.post('/create', async (req, res) => {
  try {
    const lastId = "LAPTOP-" + crypto.randomUUID();
    let {sn , employer} = req.body;
    const laptop = await Peer.createLaptop(lastId, sn, employer);
    if(laptop){
      res.redirect('/');
    }
    else{
      res.render('CreatePage', {title:"Add Laptop"});
    }
  } catch (e) {
    res.render('NotFoundPage', {title:"404"});
  }
});

// Invoke the remove_laptop chaincode
router.post('/history', async (req, res) => {
  try {
    let { id } = req.body;
    var history = await Peer.getLaptopHistory(id) || [];
    for(var i =0; i<history.length; i++){
      if (history[i] && history[i]["timestamp"]) {
        history[i]["time"] = convert(history[i]["timestamp"]["seconds"]);
      }
    }
    res.render('HistoryTable', {title:"History Table", table:history, laptop:id});
  } catch (e) {
    res.render('NotFoundPage', {title:"404"})
  }
});

// Get the block table
router.get('/block', async (req, res) => {
  try {
    res.render('BlockTable', {title:"Block Explorer"})
  } catch (e) {
    res.render('NotFoundPage', {title:"404"})
  }
});

// Render the other pages with 404 page
router.get('*', async (req, res) => {
  res.render('NotFoundPage', {title:"404"})
});

// Emit the block number to the io
function wsConfig(io) {
  Peer.on('block', block => { io.emit('block', block); });
};

// Conversion of the unix timestamp to the readable date
function convert(timestamp){
  
  // Unixtimestamp
  var unixtimestamp = timestamp;
  // Months array
  var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Convert timestamp to milliseconds
  var date = new Date(unixtimestamp*1000);
  // Year
  var year = date.getFullYear();
  // Month
  var month = months_arr[date.getMonth()];
  // Day
  var day = date.getDate();
  // Hours
  var hours = date.getHours();
  // Minutes
  var minutes = "0" + date.getMinutes();
  // Seconds
  var seconds = "0" + date.getSeconds();
  // Display date time in MM-dd-yyyy h:m:s format
  var convdataTime = month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2); 
  return convdataTime;
}

export default router;
export { wsConfig };
