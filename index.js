const express = require('express');
const WebSocket = require('ws');
// const { _rd } = require('./utils/redis');/
const { newWebSocket } = require('./utils/webSocket');
const app = express();

app.use('/a', express.static('a', { fallthrough: false }));
app.get('/', (rq, rs) => {
  rs.send(`<h1>PULSE</h1>
<p>a chat application</p>
<a href="/a">start a chat</a>  
`);
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`-http- listening @:${process.env.PORT || 5000}`);
});

newWebSocket(server, () => newWebSocket(server));
