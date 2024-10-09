const { claimCheck,requiresAuth } = require('express-openid-connect');
const WebSocket = require('ws');

const maxClients = 3;

function newWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  // wss.on('headers', (headers, request) => {
  // console.log(request.headers);
  // console.log('headers');
  // request.statusCode = 400;
  // request.destroy(new Error('UnAuthorized'));
  // });
  wss.on('connection', (ws, rq) => {
    if (wss.clients.size > maxClients) {
      console.warn('WS maxed out:', wss.clients.size);
      ws.send('Server is overloaded. Please try again later!');
      ws.close();
    }
    // const ch = claimCheck((req, claims) => {
    //   console.log(claims);
    // });
    // ch(rq,rs,()=>null);
    // console.warn('WSS\n',rq.oidc.user);
    ws.send('wellcome to PULSE!\nWho may i call you?');
    ws.on('message', (message) => {
      if (message.length > 15)
        ws.send('your name seems a bit long!\nuse between 4 and 15 characters');
      else if (message.length < 4)
        ws.send('your name is to short!\nuse between 4 and 15 characters');
      else ws.send('Hello, ' + message);
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
