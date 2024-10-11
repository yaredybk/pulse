const { auth } = require('express-openid-connect');
const ws_ = require('ws');
const { _rdAuth } = require('./redis');
const maxClients = 3;

// fake temporary authenticate function
function authenticate(req, cb = () => null) {
  const sess = req.headers.cookie.match(/appSession=([^;]*);/);
  if (sess) _rdAuth.get(sess[1], cb);
  else cb(new Error('missing auth cookie.'));
}
function onSocketError(err) {
  console.error('onSocketError\n', err);
}
function newWebSocket(server) {
  const wss = new ws_.Server({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    socket.on('error', onSocketError);

    authenticate(request, (err, client) => {
      if (err || !client) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      socket.removeListener('error', onSocketError);

      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request, client.data.uuid);
      });
    });
  });
  // wss.on('headers', (headers, request) => {
  // console.log(request.headers);
  // console.log('headers');
  // request.statusCode = 400;
  // request.destroy(new Error('UnAuthorized'));
  // });
  wss.on('connection', (ws, rq, client) => {
    if (wss.clients.size > maxClients) {
      console.warn('WS maxed out:', wss.clients.size);
      ws.send('Server is overloaded. Please try again later!');
      ws.close();
    }

    // ch(rq,rs,()=>null);
    // console.warn('WSS\n',rq.oidc.user);
    ws.send('wellcome to PULSE!');
    ws.on('message', (message) => {
      // if (message.length > 15)
      //   ws.send('your name seems a bit long!\nuse between 4 and 15 characters');
      // else if (message.length < 4)
      //   ws.send('your name is to short!\nuse between 4 and 15 characters');
      // else ws.send('Hello, ' + message);
      wss.clients.forEach((c) => {
        if (c.readyState === ws_.OPEN && c != ws) {
          c.send(message.toString());
        }
      });
    });
    const to = setTimeout(() => {
      ws.send('Time out! \ngoodby!');
      ws.close();
    }, 1000 * 60 * 5);
    ws.on('close', () => {
      clearTimeout(to);
    });
  });
  wss.on('error', (error) => {
    console.warn('wss error\n', error);
  });
  wss.on('listening', () => {
    console.log('- ws - listening');
  });
  wss.on('close', () => {
    console.warn('- ws - CLOSED!');
  });
}

module.exports.newWebSocket = newWebSocket;
