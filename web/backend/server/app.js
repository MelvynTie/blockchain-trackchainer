'use strict';
////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import { Server } from 'http';
import express from 'express';
import socketIo from 'socket.io';
import configureExpress from './config/express.js';
import router, { wsConfig } from './routers/router.js';

const ROOT_URL = '/';
// Initialise the express framework
const app = express();
// Initialise a httpServer
const httpServer = new Server(app);
// Setup a web socket
const io = socketIo(httpServer);
// Return the namespace of the path
wsConfig(io.of(ROOT_URL));
// Configure the settings of express
configureExpress(app);
// Render the homepage
app.get('/', (req, res) => {
  try {
    res.render('Index', {title:"Data Table"})
  } catch (e) {
    res.render('NotFoundPage', {title:"404"})
  }
});
// Set-up routing
app.use(ROOT_URL, router);

export default httpServer;
