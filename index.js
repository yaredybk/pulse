const express = require('express');
const session = require('express-session');
const WebSocket = require('ws');
// const { _rd } = require('./utils/redis');/
const { newWebSocket } = require('./utils/webSocket');
const { _db } = require('./utils/db');
const { _session } = require('./utils/session');
const app = express();

app.use(express.static('pages'));
app.use(_session);

// TEST
// app.use((rq, rs, nx) => {
//   console.log(rq.session);
//   nx();
// });

app.use('/a', express.static('a', { fallthrough: false }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`-http- listening @:${process.env.PORT || 5000}`);
});

newWebSocket(server, () => newWebSocket(server));

// _db.query("create database main;").then(console.log).catch(console.warn);
